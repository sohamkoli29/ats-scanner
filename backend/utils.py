"""
utils.py - NLP pre-processing helpers (NLTK-based).
Downloads required corpora on first run.
"""

import re
import string
import nltk

# ── one-time downloads ────────────────────────────────────────────────────────
for _pkg in ("punkt", "stopwords", "wordnet", "averaged_perceptron_tagger"):
    try:
        nltk.download(_pkg, quiet=True)
    except Exception:
        pass

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

_STOP = set(stopwords.words("english"))
_LEMMA = WordNetLemmatizer()

# ── common tech / domain skill keywords ──────────────────────────────────────
SKILL_KEYWORDS = {
    # Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "kotlin", "swift", "ruby", "php", "scala", "r", "matlab", "bash", "sql",
    # Web
    "react", "angular", "vue", "node", "nodejs", "express", "django", "flask",
    "fastapi", "spring", "laravel", "html", "css", "sass", "graphql", "rest",
    "api", "microservices", "websocket",
    # Data / ML
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow",
    "pytorch", "keras", "scikit-learn", "pandas", "numpy", "spark", "hadoop",
    "tableau", "powerbi", "data analysis", "data science", "statistics",
    "regression", "classification", "clustering", "neural network",
    # Cloud / DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "jenkins", "gitlab",
    "github actions", "terraform", "ansible", "linux", "unix", "bash",
    # Databases
    "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
    "oracle", "sqlite", "dynamodb", "firebase",
    # Soft skills
    "communication", "leadership", "teamwork", "problem solving", "agile",
    "scrum", "kanban", "project management", "mentoring",
    # General
    "git", "jira", "confluence", "figma", "photoshop",
}


def preprocess(text: str) -> str:
    """Lower-case, remove punctuation, lemmatise, drop stop-words."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s/#+.]", " ", text)
    tokens = word_tokenize(text)
    tokens = [_LEMMA.lemmatize(t) for t in tokens if t not in _STOP and len(t) > 1]
    return " ".join(tokens)


def extract_skills(text: str) -> set:
    """
    Return a set of skill keywords found in *text*.
    Handles single-word and multi-word phrases.
    """
    text_lower = text.lower()
    found = set()
    for skill in SKILL_KEYWORDS:
        # word-boundary aware search for multi-word skills too
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.add(skill)
    return found


def generate_suggestions(missing_skills: list, resume_text: str, jd_text: str) -> list:
    """
    Produce actionable improvement suggestions based on missing skills
    and simple heuristics about the resume text.
    """
    suggestions = []

    if missing_skills:
        top_missing = missing_skills[:5]
        suggestions.append(
            f"Add these high-priority missing skills to your resume: "
            f"{', '.join(top_missing)}."
        )

    # Length heuristic
    word_count = len(resume_text.split())
    if word_count < 300:
        suggestions.append(
            "Your resume appears short. Expand bullet points with "
            "quantifiable achievements (e.g., 'Improved API response time by 40%')."
        )
    elif word_count > 900:
        suggestions.append(
            "Your resume is quite lengthy. Consider condensing it to 1-2 pages, "
            "keeping only the most relevant experience."
        )

    # Action verbs heuristic
    action_verbs = ["led", "built", "designed", "developed", "improved",
                    "optimised", "managed", "delivered", "reduced", "increased"]
    verbs_found = [v for v in action_verbs if v in resume_text.lower()]
    if len(verbs_found) < 3:
        suggestions.append(
            "Use stronger action verbs (e.g., 'Architected', 'Spearheaded', "
            "'Optimised') to make bullet points more impactful."
        )

    # Metrics heuristic
    if not re.search(r"\d+\s*%", resume_text):
        suggestions.append(
            "Quantify your achievements with numbers / percentages wherever possible "
            "(e.g., 'Reduced deployment time by 30%')."
        )

    # Keywords in title / summary section
    jd_words = set(jd_text.lower().split())
    resume_words = set(resume_text.lower().split())
    overlap_ratio = len(jd_words & resume_words) / max(len(jd_words), 1)
    if overlap_ratio < 0.15:
        suggestions.append(
            "Mirror more language from the job description in your resume summary "
            "and bullet points to pass ATS keyword filters."
        )

    if not suggestions:
        suggestions.append(
            "Your resume is a strong match! Fine-tune the summary section to "
            "directly echo the job title and key responsibilities."
        )

    return suggestions
