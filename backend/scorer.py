"""
scorer.py — Hybrid ML ATS Scoring Engine
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
def _skill_coverage_score(resume_skills: set, jd_skills: set) -> float:
    if not jd_skills:
        return 50.0
    matched = resume_skills & jd_skills
    raw = len(matched) / len(jd_skills)
    boosted = raw ** 0.75          # concave curve — rewards high coverage more
    return round(min(boosted * 100, 100.0), 2)
def _tfidf_score(resume_clean: str, jd_clean: str) -> float:
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
    blended = (word_sim * 0.7) + (char_sim * 0.3)
    rescaled = (1 - math.exp(-3.5 * blended)) * 100
    return round(min(rescaled, 100.0), 2)
def _keyword_density_score(resume_text: str, jd_skills: set) -> tuple[float, dict]:
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
    hits_per_100 = (total_hits / resume_words) * 100
    if hits_per_100 == 0:
        score = 0.0
    else:
        score = min((math.log1p(hits_per_100) / math.log1p(3.0)) * 100, 100.0)
    return round(score, 2), density
def _quality_score(resume_text: str) -> float:
    score = 0.0
    text_lower = resume_text.lower()
    word_count = len(resume_text.split())
    if 300 <= word_count <= 700:
        score += 30
    elif 200 <= word_count < 300 or 700 < word_count <= 900:
        score += 20
    elif word_count >= 150:
        score += 10
    action_verbs = [
        "led", "built", "designed", "developed", "improved", "optimised",
        "optimized", "managed", "delivered", "reduced", "increased", "launched",
        "architected", "spearheaded", "implemented", "deployed", "automated",
        "collaborated", "mentored", "analysed", "analyzed",
    ]
    verb_hits = sum(1 for v in action_verbs if re.search(r"\b" + v + r"\b", text_lower))
    score += min(verb_hits * 5, 25)
    metrics = re.findall(r"\d+\s*%|\d+x\b|\$[\d,]+|₹[\d,]+", resume_text)
    score += min(len(metrics) * 8, 25)
    if re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", resume_text):
        score += 5
    if re.search(r"github\.com|linkedin\.com", text_lower):
        score += 5
    if re.search(r"\b(b\.?e|b\.?tech|m\.?tech|bachelor|master|phd|mba|degree)\b", text_lower):
        score += 5
    if re.search(r"\b(certif|aws|gcp|azure|google|coursera|udemy)\b", text_lower):
        score += 5
    return round(min(score, 100.0), 2)
def score_resume(resume_text: str, jd_text: str) -> dict:
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
