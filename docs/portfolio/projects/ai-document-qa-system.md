---
title: AI Document Q&A System — Production-Grade RAG Pipeline
description: A production-ready Retrieval-Augmented Generation (RAG) pipeline that lets users upload PDF or DOCX documents and ask natural-language questions — built with FastAPI, Celery, TimescaleDB/pgvectorscale, Docling, Instructor, and Langfuse.
---

# AI Document Q&A System — Production-Grade RAG Pipeline

??? tip "Project Context"
    This project was built as an independent initiative — a real-world document intelligence tool and a reference implementation for teams building production RAG systems.

!!! abstract "Project Summary"
    **Type**: Personal / Independent Project
    **Duration**: 2025 – 2026
    **Role**: AI Engineer (Solo)

    **Key Outcomes**:

    - Structure-aware document parsing that respects headings, tables, and lists — not blind token splitting
    - Zero-blocking API: document ingestion runs as a background Celery task, returning an instant `job_id`
    - Single-call batch embeddings — 1 OpenAI API call for all document chunks, not 1 per chunk
    - PostgreSQL-native vector store (TimescaleDB + pgvectorscale) outperforming Pinecone at ~75% lower cost
    - Fully async FastAPI — embedding, vector search, and LLM synthesis are all non-blocking
    - End-to-end observability: every LLM call, token count, and dollar tracked via Langfuse

## Challenge

Organizations in law, finance, healthcare, HR, and consulting are sitting on enormous document libraries — contracts, filings, policies, guidelines, reports. The information is there. The problem is the cost of retrieving it: analysts manually searching PDFs, hours spent finding a single clause, and the constant risk of missing something important buried on page 47.

The challenge was to build a system that could ingest any PDF or DOCX file and answer natural-language questions about it — reliably, cheaply, and quickly enough to be genuinely useful in production. The technical difficulty lies not just in wiring up an LLM, but in making the retrieval step accurate and the system architecture solid enough to hold up under real workloads.

## Approach

**1. Structure-aware document parsing**

Rather than extracting raw text from documents, the pipeline uses [Docling](https://github.com/DS4SD/docling)'s `DocumentConverter`, which preserves the document's full structure — headings, tables, lists, and logical hierarchy. This structured document object is passed directly to the chunker, keeping semantic context intact from the very first step.

**2. HybridChunker with dual-text contextualization**

Naive chunking strategies split text at fixed token boundaries, which regularly bisects sentences, severs table rows from their headers, and throws away structural context. Docling's `HybridChunker` respects the document's natural boundaries. Crucially, each chunk is also *contextualized* — the parent heading is prepended to the chunk text before embedding — while the clean, unmodified text is stored in the database. This dual-text approach gives the embedding model richer semantic signal without cluttering the response returned to users.

```python
for chunk in raw_chunks:
    raw_text = chunk.text
    contextualized_text = self.chunker.contextualize(chunk=chunk)
    # contextualized_text → sent to embeddings API (richer semantic meaning)
    # raw_text           → stored in DB and returned to users (clean display)
```

**3. Batch embedding in a single API call**

A document may produce 50–100 chunks after processing. Embedding each chunk in a separate API call would mean 50–100 sequential network round trips, compounding latency and cost. Instead, all chunks are batched into a single `embeddings.create()` call. The OpenAI API guarantees order-preserving responses, so embeddings map correctly back to their source chunks:

```python
response = self.openai_client.embeddings.create(
    input=texts,  # all chunks at once
    model="text-embedding-3-small",
)
embeddings = [item.embedding for item in response.data]
```

**4. PostgreSQL-native vector storage**

Vectors and metadata are stored in [TimescaleDB](https://www.timescale.com/) using the `pgvectorscale` extension. This is a deliberate architectural choice over dedicated vector databases like Pinecone. Timescale's benchmarks demonstrate comparable or superior query performance at approximately 75% lower cost. More practically, it keeps the vector store within the same Postgres ecosystem that engineers already know — no new vendor, no new operational overhead, no surprise pricing at scale.

**5. Fully async FastAPI**

Every operation in the query path — question embedding, vector similarity search, and LLM synthesis — uses native async clients. No blocking, no thread pools for these steps. The FastAPI event loop remains free to handle concurrent requests throughout, giving the API solid concurrency characteristics without horizontal scaling tricks.

```python
@router.post("/", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    results = await vector_store.search(request.question, limit=request.limit)
    response = await Synthesizer.generate_response(
        question=request.question,
        context=results,
    )
    return QueryResponse(
        answer=response.answer,
        thought_process=response.thought_process,
        enough_context=response.enough_context,
    )
```

**6. Background ingestion via Celery + Redis**

Processing a real document — parsing, chunking, embedding, storing — takes 10 to 30 seconds depending on file size. Holding an HTTP connection open for that duration on the ingestion endpoint is not viable at any real scale. Instead, the file is saved to a temporary path, handed off to a [Celery](https://docs.celeryq.dev/) worker via Redis, and the API returns a `job_id` immediately. Clients poll a lightweight `/jobs/{job_id}` endpoint for status. The server is never blocked:

```python
task = ingest_document_task.delay(tmp_path, file.filename)
return IngestResponse(
    job_id=task.id,
    message="Ingestion queued. Poll /jobs/{task.id} for status.",
)
```

**7. Structured LLM output with Instructor**

Answer synthesis uses GPT-4o via the [Instructor](https://github.com/jxnl/instructor) library, which wraps the LLM client and validates responses against a Pydantic model. There is no JSON string parsing, no brittle regex extraction. If the model's response doesn't conform to the schema, Instructor automatically retries. The API always returns a typed, predictable object:

```python
class SynthesizedResponse(BaseModel):
    thought_process: List[str]
    answer: str
    enough_context: bool  # system tells you when context is insufficient
```

**8. End-to-end observability with Langfuse**

[Langfuse](https://langfuse.com/) is wired in from the start — not added as an afterthought. The OpenAI clients are replaced with Langfuse's drop-in-compatible versions, and key functions are decorated with `@observe()`. Every LLM call, every embedding request, every token count, and the inferred cost of each operation is captured in real time. This is what makes it possible to answer "what did this cost to run last month?" with actual data.

## Results & Impact

- **Sub-second query responses** on ingested document collections with full semantic retrieval
- **Single API call for batch embedding** — constant network overhead regardless of document size
- **~75% lower vector storage cost** compared to managed vector databases like Pinecone
- **Zero server blocking on document uploads** — instant `job_id` response, all processing deferred
- **Type-safe LLM responses** — no hallucinated JSON or fragile parsing anywhere in the pipeline
- **Full cost visibility** — every token and dollar tracked in Langfuse from day one
- **Modular and swappable** — LLM provider, embedding model, chunker, and vector store can each be changed independently without touching the rest of the system

## Solution Overview

![Architecture diagram showing the two-lane RAG system: async query path (FastAPI → Vector Store → GPT-4o → Answer) and background ingestion path (FastAPI → Celery/Redis → Worker → Docling → Chunker → Batch Embed → TimescaleDB), with Langfuse observability across both lanes and a shared TimescaleDB vector store](../../assets/rag-document-qa-architecture.svg)

*Two-lane architecture: the async query path returns answers in real time; the background ingestion path processes documents without ever blocking the API. Langfuse observes every step across both lanes.*

## Tech Stack

- **Python 3.12** — core language
- **FastAPI** — async REST API
- **Celery 5 + Redis** — background task queue for document ingestion
- **TimescaleDB + pgvectorscale** — PostgreSQL-native vector store and similarity search
- **OpenAI GPT-4o** — answer synthesis
- **OpenAI text-embedding-3-small** — document and query embeddings (1536-dim)
- **Docling** — structure-aware document parsing (PDF + DOCX)
- **Instructor** — structured, type-safe LLM output via Pydantic models
- **Langfuse** — LLM observability: token counts, costs, latency, prompt/completion tracing
- **Pydantic v2** — data validation throughout
- **pandas** — vector search result handling and metadata expansion
- **Docker + Docker Compose** — containerised TimescaleDB and Redis

## Additional Context

- Timeline: Independent project, 2025–2026
- Role: AI Engineer (solo — architecture, implementation, deployment)
- Focus: Production-grade reliability — real async architecture, background jobs, observability — not a Jupyter notebook demo
- The clean separation between components (`DocumentProcessor`, `Chunker`, `VectorStore`, `LLMFactory`, `Synthesizer`) makes the system easy to extend: new document types, new LLM providers, or new retrieval strategies can be added without touching the core pipeline
- Designed to be deployable for any knowledge-heavy business: law, finance, HR, healthcare, or consulting — anywhere documents contain answers that are currently too slow to find

<div class="grid cards" style="margin-top: 3rem" markdown>

-   :material-email:{ .lg .middle } Interested in similar work?

    ---

    I help teams design and ship production-grade RAG and document intelligence systems — built to be reliable, observable, and cost-efficient from day one.

    [Email Me :material-arrow-top-right:](mailto:gayithri@pojoai.com){ .md-button .md-button--primary }

</div>
