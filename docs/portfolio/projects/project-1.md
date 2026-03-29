---
title: RAG-Based AI Assistant with pgvector
description: A production-ready Retrieval-Augmented Generation application built with FastAPI, PostgreSQL/pgvector, PydanticAI, and Langfuse for LLM observability.
---

# RAG-Based AI Assistant with pgvector

??? tip "Portfolio Best Practices"
    This project was built as part of the Datalumina AI Engineering program — a production-focused curriculum designed to bridge backend engineering with modern Generative AI.

!!! abstract "Project Summary"
    **Program**: Datalumina AI Engineering
    **Duration**: Oct 2025 – Mar 2026
    **Role**: AI Engineer

    **Key Outcomes**:

    - End-to-end RAG application deployed in a production-like environment
    - Full LLM observability with Langfuse tracing
    - Type-safe AI pipelines using Pydantic
    - Sub-second retrieval from PostgreSQL/pgvector
    - Modular FastAPI backend ready for team integration

## Challenge

Teams often have vast amounts of internal data — documents, knowledge bases, support tickets — but no reliable way to query it conversationally. Generic LLMs hallucinate or lack context. The challenge was building a system that answers real questions from real organizational data with accuracy that teams can depend on.

## Approach

Built a Retrieval-Augmented Generation (RAG) pipeline that embeds and indexes documents into a PostgreSQL database using the pgvector extension, enabling semantic similarity search. The application retrieves the most relevant context before passing it to an LLM, drastically reducing hallucinations.

The backend was built with FastAPI and Python, with PydanticAI ensuring type safety throughout the AI pipeline. Langfuse was integrated for full LLM observability — tracing every request, prompt, and response.

## Results & Impact

- Accurate, grounded responses based on retrieved organizational data
- Full observability: every LLM call traced and logged via Langfuse
- Type-safe pipeline preventing silent failures in production
- Clean, modular architecture that a team can extend and maintain
- Production engineering practices applied throughout (not just a prototype)

## Solution Overview

![Architecture Diagram](../../assets/openai-end-to-end-aml-deployment.svg)

*End-to-end RAG architecture with retrieval, LLM orchestration, and observability*

## Tech Stack

- Python & FastAPI
- PostgreSQL with pgvector (vector similarity search)
- PydanticAI (type-safe AI pipelines)
- LangChain (LLM orchestration)
- Langfuse (LLM observability and tracing)
- OpenAI / Claude (LLM providers)
- Docker (containerization)
- GitHub Actions (CI/CD)

## Additional Context

- Timeline: 6 months (as part of Datalumina program)
- Role: AI Engineer (solo)
- Focus: Production-grade reliability, not just prototyping
- Engineering practices: Pydantic type safety, structured logging, modular design

<div class="grid cards" style="margin-top: 3rem" markdown>

-   :material-email:{ .lg .middle } Interested in similar work?

    ---

    I'd love to discuss how a RAG-based solution could work for your team's data and workflows.

    [Email Me :material-arrow-top-right:](mailto:gayithri@pojoai.com){ .md-button .md-button--primary }

</div>
