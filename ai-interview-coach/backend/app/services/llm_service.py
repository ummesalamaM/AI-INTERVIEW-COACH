import json
import re
from anthropic import Anthropic
from app.core.config import settings
from app.models.schemas import AnswerFeedback, FillerWordAnalysis

client = Anthropic(api_key=settings.anthropic_api_key)

FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically", "literally",
    "actually", "so", "right", "kind of", "sort of", "hmm",
    "well", "i mean", "you see"
]

QUESTION_COUNT = 5

def generate_questions(role: str, company: str, difficulty: str, interview_type: str) -> list[str]:
    prompt = f"""You are an expert technical interviewer at {company}.
Generate exactly {QUESTION_COUNT} {difficulty}-level {interview_type} interview questions for a {role} position.

Rules:
- Questions must be realistic and commonly asked at top tech companies
- For technical: include DSA, system design, or coding concepts
- For behavioral: use STAR-format prompting questions
- For system design: ask about scalable systems
- Return ONLY a JSON array of {QUESTION_COUNT} question strings, nothing else

Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    # Strip markdown fences if present
    text = re.sub(r"```json|```", "", text).strip()
    questions = json.loads(text)
    return questions[:QUESTION_COUNT]


def analyze_answer(
    question: str,
    answer: str,
    role: str,
    company: str,
    interview_type: str,
    duration_seconds: float
) -> AnswerFeedback:

    # Count filler words
    answer_lower = answer.lower()
    filler_counts = []
    total_fillers = 0
    for word in FILLER_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        count = len(re.findall(pattern, answer_lower))
        if count > 0:
            filler_counts.append(FillerWordAnalysis(word=word, count=count))
            total_fillers += count

    # Words per minute
    word_count = len(answer.split())
    minutes = max(duration_seconds / 60, 0.01)
    wpm = round(word_count / minutes, 1)

    prompt = f"""You are a senior interviewer at {company} evaluating a {role} candidate.

Interview Type: {interview_type}
Question Asked: {question}
Candidate's Answer: {answer}
Answer Duration: {duration_seconds:.0f} seconds
Words per Minute: {wpm}

Evaluate this answer and respond ONLY with a valid JSON object — no markdown, no extra text.

Return this exact structure:
{{
  "score": <integer 0-100>,
  "relevance": "<2-3 sentences on how relevant the answer is to the question>",
  "clarity": "<2-3 sentences on how clearly it was communicated>",
  "depth": "<2-3 sentences on technical/conceptual depth>",
  "suggested_answer": "<a model answer in 4-6 sentences showing what an ideal response looks like>"
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    text = re.sub(r"```json|```", "", text).strip()
    data = json.loads(text)

    return AnswerFeedback(
        score=data["score"],
        relevance=data["relevance"],
        clarity=data["clarity"],
        depth=data["depth"],
        filler_words=filler_counts,
        filler_word_count=total_fillers,
        words_per_minute=wpm,
        suggested_answer=data["suggested_answer"],
    )


def generate_summary(
    role: str,
    company: str,
    feedbacks: list[AnswerFeedback],
    questions: list[str]
) -> dict:

    scores = [f.score for f in feedbacks]
    overall = round(sum(scores) / len(scores))
    avg_wpm = round(sum(f.words_per_minute for f in feedbacks) / len(feedbacks), 1)
    total_fillers = sum(f.filler_word_count for f in feedbacks)

    qa_summary = ""
    for i, (q, f) in enumerate(zip(questions, feedbacks)):
        qa_summary += f"\nQ{i+1}: {q}\nScore: {f.score}/100\nRelevance: {f.relevance}\nDepth: {f.depth}\n"

    prompt = f"""Based on this {role} interview performance for {company}:

{qa_summary}

Overall score: {overall}/100
Average WPM: {avg_wpm}
Total filler words: {total_fillers}

Respond ONLY with a valid JSON object — no markdown:
{{
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"]
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    text = re.sub(r"```json|```", "", text).strip()
    data = json.loads(text)

    return {
        "overall_score": overall,
        "avg_wpm": avg_wpm,
        "total_filler_words": total_fillers,
        "strengths": data["strengths"],
        "improvements": data["improvements"],
        "question_scores": scores,
    }
