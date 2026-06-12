import os
import re
import json

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


def analyze_cv(cv_text, job_requirements):
    """
    AI Service for CV Analysis using the Groq API (Llama 3.3 70B).
    Falls back to smart keyword matching when the API is unavailable.
    """
    if not cv_text or not job_requirements:
        return 0, "Please provide both CV text and Job Requirements."

    api_key = os.environ.get("GROQ_API_KEY")

    if not api_key or not GROQ_AVAILABLE:
        print("Groq API unavailable — using fallback keyword analysis.")
        return fallback_analyze_cv(cv_text, job_requirements)

    try:
        client = Groq(api_key=api_key)

        prompt = f"""
        Act as an expert technical recruiter and career coach.
        You are tasked with evaluating a candidate's CV against a set of job requirements.
        
        Job Requirements:
        ---
        {job_requirements}
        ---
        
        Candidate CV:
        ---
        {cv_text}
        ---
        
        Task:
        1. Calculate a "match score" from 0 to 100 representing how well the CV fits the requirements. Be objective.
        2. Write a short paragraph of actionable suggestions (max 3 sentences) on how the candidate can improve their CV for this specific role, highlighting missing keywords or skills if any.
        
        IMPORTANT: Your response MUST be a valid JSON object with EXACTLY two keys: "score" (a number) and "suggestions" (a string). Do not include Markdown formatting like ```json or any other text outside the JSON object.
        Example format:
        {{
            "score": 85.5,
            "suggestions": "Your CV matches the core requirements well. However, you should explicitly mention 'React' and 'Docker' as these are required. Consider highlighting your leadership experience more clearly."
        }}
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful career advisor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=512,
        )

        response_text = response.choices[0].message.content.strip()

        # Clean up in case the model returns markdown JSON block anyway
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        result = json.loads(response_text.strip())

        score = float(result.get("score", 0))
        suggestions = result.get("suggestions", "No suggestions provided.")

        return score, suggestions

    except Exception as e:
        print(f"Groq API Error: {e}")
        # Fallback to smart heuristic if API fails
        return fallback_analyze_cv(cv_text, job_requirements)


# ---------------------------------------------------------------------------
# Smart Heuristic Fallback (Keyword Matching)
# ---------------------------------------------------------------------------

MULTI_WORD_SKILLS = [
    "problem solving", "machine learning", "deep learning", "data analysis",
    "data science", "project management", "software engineering",
    "web development", "mobile development", "cloud computing",
    "artificial intelligence", "natural language processing",
    "computer vision", "big data", "version control", "agile methodology",
    "user experience", "user interface", "continuous integration",
    "continuous deployment", "test driven development",
    "object oriented programming", "functional programming",
    "technical writing", "public speaking", "critical thinking",
    "time management", "team management", "team leadership",
]

STOP_WORDS = {
    'and', 'or', 'the', 'a', 'an', 'in', 'on', 'with', 'for', 'to', 'of',
    'at', 'by', 'is', 'are', 'be', 'will', 'we', 'you', 'your', 'our',
    'must', 'have', 'has', 'had', 'been', 'should', 'can', 'could',
    'would', 'do', 'does', 'did', 'not', 'no', 'but', 'if', 'so', 'it',
    'that', 'this', 'these', 'those', 'from', 'as', 'also', 'about',
    'more', 'very', 'other', 'any', 'all', 'each', 'some', 'than',
    'such', 'like', 'well', 'just', 'only', 'both', 'into', 'over',
    'after', 'before', 'between', 'under', 'out', 'up', 'down',
    'skills', 'experience', 'required', 'looking', 'strong', 'excellent',
    'ability', 'bonus', 'points',
}

SHORT_TECH_TERMS = {
    'c', 'c++', 'c#', 'r', 'go', 'ui', 'ux', 'ai', 'ml', 'js', 'ts',
    'sql', 'css', 'php', 'aws', 'api', 'git', 'ci', 'cd',
}

def _extract_keywords(text):
    text_lower = text.lower()
    keywords = set()

    # Multi-word
    for phrase in MULTI_WORD_SKILLS:
        if phrase in text_lower:
            keywords.add(phrase)

    # Short tech
    for term in SHORT_TECH_TERMS:
        if re.search(r'(?<!\w)' + re.escape(term) + r'(?!\w)', text_lower):
            keywords.add(term)

    # Individual words
    words = set(re.findall(r'\b[a-z][a-z0-9.]+\b', text_lower))
    for word in words:
        if word not in STOP_WORDS and len(word) >= 2:
            keywords.add(word)

    return keywords

def fallback_analyze_cv(cv_text, job_requirements):
    req_keywords = _extract_keywords(job_requirements)
    cv_keywords  = _extract_keywords(cv_text)

    if not req_keywords:
        return 0, "Job requirements are too vague to analyze properly."

    if not cv_keywords:
        return 0, "Your CV does not contain any recognizable skills or keywords."

    matched = req_keywords & cv_keywords
    missing = req_keywords - cv_keywords

    match_ratio = len(matched) / len(req_keywords)
    score = round(match_ratio * 100, 1)

    lines = ["⚠️ AI analysis unavailable — results are based on keyword matching."]
    if score >= 75:
        lines.append(f"✅ Great match! Your CV covers {len(matched)} of {len(req_keywords)} requirements.")
    elif score >= 40:
        lines.append(f"🔶 Decent match ({len(matched)}/{len(req_keywords)} keywords found).")
    else:
        lines.append(f"🔴 Low match ({len(matched)}/{len(req_keywords)} keywords).")

    if matched:
        lines.append(f"✔️ Matched: {', '.join(sorted(matched)[:8])}.")
    if missing:
        lines.append(f"❌ Missing: {', '.join(sorted(missing)[:8])}.")

    return score, "\n".join(lines)
