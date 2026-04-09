# ATS Resume Scorer

An NLP-powered Applicant Tracking System (ATS) scanner that analyzes a resume against a Job Description and returns a match score, skill gaps, and improvement suggestions.

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, Tailwind CSS |
| Backend   | Python 3.10+, Flask, Flask-CORS |
| ML / NLP  | scikit-learn (TF-IDF + Cosine Similarity), NLTK |
| File I/O  | PyPDF2, pdfminer.six, python-docx |

---

## Project Structure

```
ats-scanner/
├── backend/
│   ├── app.py        ← Flask REST API
│   ├── parser.py     ← PDF / DOCX / TXT extraction
│   ├── scorer.py     ← TF-IDF scoring engine
│   └── utils.py      ← NLP helpers, skill list, suggestions
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       └── components/
│           ├── DropZone.jsx
│           ├── ScoreRing.jsx
│           ├── SkillsPanel.jsx
│           ├── SuggestionsPanel.jsx
│           ├── KeywordDensityChart.jsx
│           └── LoadingSkeleton.jsx
├── requirements.txt
└── README.md
```

---

## Quick Start

### 1. Backend Setup

```bash
cd ats-scanner

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (optional, used for future extensions)
python -m spacy download en_core_web_sm

# Start Flask server
cd backend
python app.py
# → http://localhost:5000
```

### 2. Frontend Setup

```bash
cd ats-scanner/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## API Reference

### `POST /api/analyze`

**Content-Type:** `multipart/form-data`

| Field    | Type   | Description |
|----------|--------|-------------|
| `resume` | File   | PDF, DOCX, DOC, or TXT (max 5 MB) |
| `jd`     | String | Job description text (min 50 chars) |

**Response (200):**
```json
{
  "match_score": 73.4,
  "matched_skills": ["python", "flask", "docker", "aws"],
  "missing_skills": ["kubernetes", "terraform"],
  "suggestions": [
    "Add these high-priority missing skills: kubernetes, terraform.",
    "Quantify your achievements with numbers / percentages."
  ],
  "keyword_density": { "python": 5, "flask": 3, "docker": 2 },
  "resume_word_count": 412,
  "jd_word_count": 320
}
```

**Response (400):**
```json
{ "errors": ["No resume file uploaded."] }
```

---

## How It Works

1. **Text Extraction** — PyPDF2 + pdfminer.six for PDFs; python-docx for DOCX files.
2. **Pre-processing** — Lowercasing, lemmatisation (NLTK WordNet), stop-word removal.
3. **TF-IDF Vectorisation** — Both texts are vectorised with bigram TF-IDF (scikit-learn).
4. **Cosine Similarity** — The angle between vectors gives the match score (0–100%).
5. **Skill Gap Analysis** — A curated keyword list (~80 skills) is matched against both texts.
6. **Suggestions** — Rule-based heuristics (length, action verbs, quantification, keyword density).

---

## Environment Variables

| Variable       | Default               | Description |
|----------------|-----------------------|-------------|
| `VITE_API_URL` | `/api` (proxied)      | Backend base URL for the frontend |
| `FLASK_ENV`    | `development`         | Flask environment |

For production, set `VITE_API_URL=https://your-backend.com` in a `.env` file inside `frontend/`.

---

## Production Build

```bash
# Build frontend
cd frontend
npm run build          # outputs to frontend/dist/

# Serve with gunicorn
cd ../backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Serve `frontend/dist/` via nginx or any static host, pointing `/api` to the gunicorn server.
