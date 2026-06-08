from pydantic import BaseModel
from typing import Optional, List

class StartSessionRequest(BaseModel):
    role: str                    # e.g. "Software Engineer"
    company: str                 # e.g. "Google"
    difficulty: str              # "easy" | "medium" | "hard"
    interview_type: str          # "technical" | "behavioral" | "system_design"

class StartSessionResponse(BaseModel):
    session_id: str
    first_question: str
    total_questions: int

class AnswerRequest(BaseModel):
    session_id: str
    question_index: int
    transcript: str              # transcribed answer text
    duration_seconds: float      # how long the answer took

class FillerWordAnalysis(BaseModel):
    word: str
    count: int

class AnswerFeedback(BaseModel):
    score: int                   # 0-100
    relevance: str               # feedback on relevance
    clarity: str                 # feedback on clarity
    depth: str                   # feedback on depth
    filler_words: List[FillerWordAnalysis]
    filler_word_count: int
    words_per_minute: float
    suggested_answer: str
    next_question: Optional[str] = None
    is_last_question: bool = False

class SessionSummary(BaseModel):
    session_id: str
    role: str
    company: str
    overall_score: int
    total_questions: int
    avg_wpm: float
    total_filler_words: int
    strengths: List[str]
    improvements: List[str]
    question_scores: List[int]
    detailed_feedbacks: List[AnswerFeedback]
