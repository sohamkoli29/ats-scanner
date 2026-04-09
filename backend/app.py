"""
app.py - Flask REST API for ATS Resume Scorer.

Endpoints
---------
POST /api/analyze   – multipart/form-data with 'resume' file + 'jd' text field
GET  /api/health    – liveness probe
"""

import io
from flask import Flask, request, jsonify
from flask_cors import CORS

from parser import parse_resume
from scorer import score_resume

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "txt"}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[-1].lower() in ALLOWED_EXTENSIONS


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/api/analyze", methods=["POST"])
def analyze():
    # ── Validate inputs ───────────────────────────────────────────────────────
    errors = []

    resume_file = request.files.get("resume")
    jd_text = request.form.get("jd", "").strip()

    if not resume_file or resume_file.filename == "":
        errors.append("No resume file uploaded.")
    elif not _allowed(resume_file.filename):
        errors.append("Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.")

    if not jd_text:
        errors.append("Job description text is required.")
    elif len(jd_text) < 50:
        errors.append("Job description is too short (minimum 50 characters).")

    if errors:
        return jsonify({"errors": errors}), 400

    # ── Parse resume ──────────────────────────────────────────────────────────
    try:
        file_bytes = resume_file.read()
        file_stream = io.BytesIO(file_bytes)
        resume_text = parse_resume(file_stream, resume_file.filename)
    except Exception as e:
        return jsonify({"errors": [f"Failed to parse resume: {str(e)}"]}), 500

    if not resume_text or len(resume_text.split()) < 20:
        return jsonify({"errors": ["Could not extract sufficient text from the resume."]}), 400

    # ── Score ─────────────────────────────────────────────────────────────────
    try:
        result = score_resume(resume_text, jd_text)
    except Exception as e:
        return jsonify({"errors": [f"Scoring failed: {str(e)}"]}), 500

    return jsonify(result), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
