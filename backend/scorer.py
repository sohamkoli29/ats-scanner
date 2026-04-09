"""
scorer.py — Hybrid ML ATS Scoring Engine
=========================================

Score = weighted combination of 4 independent signals:

  1. Skill Coverage Score   (40%) — What % of JD skills appear in resume
  2. TF-IDF Section Score   (25%) — Keyword overlap on EXPANDED token sets
  3. Keyword Density Score  (20%) — How richly JD keywords are used in resume
  4. Structure / Quality    (15%) — Resume quality heuristics (length, verbs, metrics)

This approach is robust to short texts where raw cosine similarity
collapses to near-zero (the original bug).
"""

import re
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from utils import preprocess, extract_skills, generate_suggestions, SKILL_KEYWORDS


# ── weights must sum to 1.0 ───────────────────────────────────────────────────
W_SKILL    = 0.40   # skill coverage
W_TFIDF    = 0.25   # tf-idf token overlap
W_DENSITY  = 0.20   # keyword density richness
W_QUALITY  = 0.15   # resume quality heuristics


# ─────────────────────────────────────────────────────────────────────────────
# Signal 1: Skill Coverage
# ─────────────────────────────────────────────────────────────────────────────
def _skill_coverage_score(resume_skills: set, jd_skills: set) -> float:
    """
    Percentage of JD-required skills present in resume.
    Returns 0–100. If JD has no detectable skills, falls back to 50 (neutral).
    """
    if not jd_skills:
        return 50.0
    matched = resume_skills & jd_skills
    # Partial credit: sqrt dampening so missing 1 of 5 hurts less than missing 4 of 5
    raw = len(matched) / len(jd_skills)
    # Boost: if resume covers > 80% of skills, push toward 100
    boosted = raw ** 0.75          # concave curve — rewards high coverage more
    return round(min(boosted * 100, 100.0), 2)


# ─────────────────────────────────────────────────────────────────────────────
# Signal 2: TF-IDF Overlap (fixed)
# ─────────────────────────────────────────────────────────────────────────────
def _tfidf_score(resume_clean: str, jd_clean: str) -> float:
    """
    Cosine similarity on character-level + word n-grams.
    Key fix: use analyzer='char_wb' as fallback so short texts still
    produce meaningful overlapping features.
    """
    # Try word n-grams first
    try:
        vec_word = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=8000,
            sublinear_tf=True,
            min_df=1,
        )
        m = vec_word.fit_transform([resume_clean, jd_clean])
        word_sim = float(cosine_similarity(m[0:1], m[1:2])[0][0])
    except Exception:
        word_sim = 0.0

    # Character n-gram similarity (captures partial word overlap, typos, abbreviations)
    try:
        vec_char = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            max_features=8000,
            sublinear_tf=True,
            min_df=1,
        )
        mc = vec_char.fit_transform([resume_clean, jd_clean])
        char_sim = float(cosine_similarity(mc[0:1], mc[1:2])[0][0])
    except Exception:
        char_sim = 0.0

    # Weighted blend — word overlap is more meaningful
    blended = (word_sim * 0.7) + (char_sim * 0.3)

    # Scale: raw cosine on short texts tops out ~0.4; rescale to 0-100
    # using a sigmoid-like stretch so 0.3 sim → ~60 score
    rescaled = (1 - math.exp(-3.5 * blended)) * 100
    return round(min(rescaled, 100.0), 2)


# ─────────────────────────────────────────────────────────────────────────────
# Signal 3: Keyword Density Richness
# ─────────────────────────────────────────────────────────────────────────────
def _keyword_density_score(resume_text: str, jd_skills: set) -> tuple[float, dict]:
    """
    Measures how deeply JD keywords are woven into the resume.
    Returns (score 0-100, density_dict).
    """
    if not jd_skills:
        return 50.0, {}

    resume_lower = resume_text.lower()
    resume_words = max(len(resume_text.split()), 1)
    density = {}
    total_hits = 0

    for skill in jd_skills:
        pattern = r"\b" + re.escape(skill) + r"\b"
        hits = len(re.findall(pattern, resume_lower))
        if hits:
            density[skill] = hits
            total_hits += hits

    # Normalize: hits per 100 words, then map to 0-100
    hits_per_100 = (total_hits / resume_words) * 100
    # Reasonable expectation: 2 hits/100 words = good (score ~70)
    # Uses log scaling so spamming doesn't help much
    if hits_per_100 == 0:
        score = 0.0
    else:
        score = min((math.log1p(hits_per_100) / math.log1p(3.0)) * 100, 100.0)

    return round(score, 2), density


# ─────────────────────────────────────────────────────────────────────────────
# Signal 4: Resume Quality Heuristics
# ─────────────────────────────────────────────────────────────────────────────
def _quality_score(resume_text: str) -> float:
    """
    Heuristic score based on resume best-practices.
    Returns 0–100.
    """
    score = 0.0
    text_lower = resume_text.lower()
    word_count = len(resume_text.split())

    # Length (ideal 300–700 words)
    if 300 <= word_count <= 700:
        score += 30
    elif 200 <= word_count < 300 or 700 < word_count <= 900:
        score += 20
    elif word_count >= 150:
        score += 10

    # Action verbs (up to 25 pts)
    action_verbs = [
        "led", "built", "designed", "developed", "improved", "optimised",
        "optimized", "managed", "delivered", "reduced", "increased", "launched",
        "architected", "spearheaded", "implemented", "deployed", "automated",
        "collaborated", "mentored", "analysed", "analyzed",
    ]
    verb_hits = sum(1 for v in action_verbs if re.search(r"\b" + v + r"\b", text_lower))
    score += min(verb_hits * 5, 25)

    # Quantified achievements — numbers / percentages (up to 25 pts)
    metrics = re.findall(r"\d+\s*%|\d+x\b|\$[\d,]+|₹[\d,]+", resume_text)
    score += min(len(metrics) * 8, 25)

    # Contact info signals (up to 10 pts)
    if re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", resume_text):
        score += 5
    if re.search(r"github\.com|linkedin\.com", text_lower):
        score += 5

    # Education / certifications (up to 10 pts)
    if re.search(r"\b(b\.?e|b\.?tech|m\.?tech|bachelor|master|phd|mba|degree)\b", text_lower):
        score += 5
    if re.search(r"\b(certif|aws|gcp|azure|google|coursera|udemy)\b", text_lower):
        score += 5

    return round(min(score, 100.0), 2)


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────
def score_resume(resume_text: str, jd_text: str) -> dict:
    """
    Hybrid ML-style ATS scorer.

    Returns
    -------
    dict:
        match_score       – float 0–100 (weighted composite)
        score_breakdown   – individual signal scores for transparency
        matched_skills    – list of skills in both resume & JD
        missing_skills    – list of skills in JD but not resume
        suggestions       – actionable improvement tips
        keyword_density   – {skill: count} for matched skills
        resume_word_count – int
        jd_word_count     – int
    """

    # 1. Pre-process
    resume_clean = preprocess(resume_text)
    jd_clean     = preprocess(jd_text)

    # 2. Extract skills
    resume_skills = extract_skills(resume_text)
    jd_skills     = extract_skills(jd_text)

    matched_skills = sorted(resume_skills & jd_skills)
    missing_skills = sorted(jd_skills - resume_skills)

    # 3. Compute individual signals
    s_skill   = _skill_coverage_score(resume_skills, jd_skills)
    s_tfidf   = _tfidf_score(resume_clean, jd_clean)
    s_density, keyword_density = _keyword_density_score(resume_text, jd_skills)
    s_quality = _quality_score(resume_text)

    # 4. Weighted composite
    composite = (
        s_skill   * W_SKILL  +
        s_tfidf   * W_TFIDF  +
        s_density * W_DENSITY +
        s_quality * W_QUALITY
    )
    match_score = round(min(max(composite, 0.0), 100.0), 1)

    # 5. Suggestions
    suggestions = generate_suggestions(missing_skills, resume_text, jd_text)

    return {
        "match_score": match_score,
        "score_breakdown": {
            "skill_coverage":    round(s_skill,   1),
            "keyword_overlap":   round(s_tfidf,   1),
            "keyword_density":   round(s_density, 1),
            "resume_quality":    round(s_quality, 1),
        },
        "matched_skills":    matched_skills,
        "missing_skills":    missing_skills,
        "suggestions":       suggestions,
        "keyword_density":   keyword_density,
        "resume_word_count": len(resume_text.split()),
        "jd_word_count":     len(jd_text.split()),
    }
