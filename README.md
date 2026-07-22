# Gayithri Ponnapalli — Portfolio

Source for my personal portfolio site, built with MkDocs Material. Live at [gayithriponnapalli.com](https://gayithriponnapalli.com).

I'm an AI Engineer focused on production-grade RAG systems, customer care chatbots, and workflow automation. This site includes project write-ups (including a RAG pipeline case study), background, and contact info.

<details>
   <summary>Tech stack & local development</summary>

**Tech stack:** MkDocs Material — Markdown content, YAML config, Docker for local dev.

**Run locally:**
```
git clone https://github.com/Gayithri606/gayithri-portfolio.git
cd gayithri-portfolio
pip install "mkdocs-material[imaging]"
mkdocs serve
```
Visit `http://localhost:8000` to preview.

Or with Docker:
```
chmod +x start_server.sh
./start_server.sh
```

**Structure:**
```
docs/
├── index.md       # Homepage
├── about.md       # About page
├── portfolio/     # Project write-ups
├── blog/          # Blog posts
└── assets/        # Images and other files
```

**Deployment:** GitHub Pages via GitHub Actions.

</details>
