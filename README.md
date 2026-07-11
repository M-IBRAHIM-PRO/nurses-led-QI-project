# Nurses-Led QI Project

A web platform that automates the literature-review step of nurse-led Quality Improvement (QI) and evidence-based-practice projects. From a project's title and description it generates a PubMed search query, retrieves matching papers, uses GPT-4 to appraise each paper across a fixed set of nursing evidence-table fields, and exports the result as a structured, APA-cited "Table of Evidence" (TOE) that is stored and shared per project.

Instead of manually searching PubMed and hand-appraising each paper, a user creates a project, generates a search query, and gets a structured evidence table in minutes.

## Repository Layout

This repository contains three components:

```
flaskAPI/     Python AI microservice: PubMed retrieval + GPT-4 appraisal
backend/      Node.js/Express REST API (MongoDB) that orchestrates the workflow
frontend/     React (Vite) + Tailwind client
```

## How It Works

```
1. User creates a QI project (title + description)
2. Backend calls GPT-4 to turn title/description into a PubMed search query
3. Backend calls the Flask AI service with the query
4. Flask searches PubMed (Biopython Entrez), fetches Medline records,
   and asks GPT-4 to appraise each paper across 9 standardized fields
5. Backend flattens the appraisals into a CSV Table of Evidence,
   uploads it to Google Drive, and links it to the project
6. Project owners and collaborators can view and manage the results
```

### The nine appraisal fields

Each paper is appraised into: Purpose, Design & Method, Sample & Settings, Major Variables Studied & Definitions, Measurement of Variables, Data Analysis, Findings, Limitations, and Worth of Practice (Applicability), alongside an APA citation, title, and source URL. The prompt fills every field, making reasonable, labeled inferences when a paper does not state something explicitly, so the resulting table has no empty columns.

## Components

### 1. Flask AI microservice (`flaskAPI/`)

A standalone Python service that owns retrieval and LLM appraisal.

- **Endpoint:** `POST /pubmed-search`
- **Body:** `{ "query": string, "email": string, "api_key": string, "max_results": number }`
  - `email` is required by NCBI Entrez for PubMed access.
  - `api_key` is the OpenAI key used for that request.
- **Behavior:** searches PubMed, fetches Medline records via Biopython, calls GPT-4 per paper, extracts the nine sections from the model output, and returns a JSON array of structured appraisals. A per-paper error is captured in that paper's entry so one failure does not abort the batch.
- **Runtime:** listens on port `5010`; served with Gunicorn in production.

Dependencies: `flask`, `flask-cors`, `biopython`, `openai`, `gunicorn`.

### 2. Backend API (`backend/`)

Node.js/Express with MongoDB (Mongoose), JWT authentication, and rate limiting.

Key responsibilities:

- **Auth:** register/login with JWT; protected routes via `authenticateUser` middleware.
- **Search-query generation:** `POST /api/generate-search-query` uses GPT-4 to convert a project title and description into a clean, natural-language PubMed query.
- **Document generation:** `POST /api/generate-document` calls the Flask service, builds the Table-of-Evidence CSV with `json2csv`, uploads it to Google Drive, saves a `Document` record, and attaches it to the project.
- **Projects & collaboration:** projects hold a title, description, search query, and document references, with an owner and collaborators; collaboration requests move through `pending`, `accepted`, and `rejected` states.
- **Key management:** OpenAI/PubMed keys are stored and retrieved through dedicated routes.

Main models: `User`, `Project`, `Document`, `CollaborationRequest`, `GPTKey`.

Route groups (all mounted under `/api`): `userRoute`, `gptRoute`, `projectRoute`, `documentRoute`. Default port `5002`.

### 3. Frontend (`frontend/vite-project/`)

React 18 + Vite + Tailwind CSS single-page app.

- Authentication pages (sign in / sign up) with public and protected route guards.
- Client area: project list, create-project modal, view-project modal, and key management.
- Uses React Router, React Query, Axios, React Table, React Dropzone, and React Toastify.

## Getting Started

Run the three components separately. Each needs its own configuration.

### Prerequisites

- Node.js 18+
- Python 3.9+
- A MongoDB instance
- An OpenAI API key
- A Google Cloud service account with Drive access (for document storage)
- An email address for NCBI Entrez

### Flask AI service

```bash
cd flaskAPI
pip install -r requirements.txt
python app.py            # serves on http://localhost:5010
```

### Backend

```bash
cd backend
npm install
npm start                # serves on http://localhost:5002 by default
```

Create a `.env` in `backend/` with at least:

```env
PORT=5002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

The backend also needs Google Drive credentials (see the security note below) and, depending on configuration, the URL of the Flask service.

### Frontend

```bash
cd frontend/vite-project
npm install
npm run dev              # Vite dev server
```

Point the frontend's API base URL at your running backend.

## Security Notes

Please review these before deploying or sharing the repository:

- **Do not commit credentials.** The Google service-account JSON and any API keys must be provided at runtime (environment variables or an untracked secrets file) and listed in `.gitignore`. If a real service-account key or API key has ever been committed, rotate it in the provider console and remove it from git history, not just from the latest commit.
- **API keys** (OpenAI, PubMed) should be stored securely rather than in plaintext, and passed to the Flask service over a trusted channel.
- **CORS and rate limiting:** the backend currently allows all origins and applies a basic IP rate limit; tighten the CORS origin for production.

## Possible Improvements

- Replace regex-based section extraction with structured/JSON model output for more reliable parsing.
- Raise the LLM response token limit so long appraisals are not truncated.
- Cache PubMed results to avoid repeated identical queries.
- Add evaluation of appraisal quality against human-reviewed papers.
- Consolidate the two GPT integrations (Node and Flask) onto a single current model and SDK version.

## Notes

This project was built in collaboration with Doctor of Nursing Practice (DNP) students at the University of California, Irvine, who served as the domain experts and end-users defining the evidence-table requirements.
