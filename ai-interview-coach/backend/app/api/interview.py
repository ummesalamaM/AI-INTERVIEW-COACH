from fastapi import APIRouter, HTTPException
from app.models.schemas import StartSessionRequest, StartSessionResponse
from app.services.llm_service import generate_questions
from app.core.session_store import create_session

router = APIRouter()

@router.post("/start", response_model=StartSessionResponse)
def start_interview(req: StartSessionRequest):
    try:
        questions = generate_questions(
            role=req.role,
            company=req.company,
            difficulty=req.difficulty,
            interview_type=req.interview_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

    session_id = create_session({
        "role": req.role,
        "company": req.company,
        "difficulty": req.difficulty,
        "interview_type": req.interview_type,
        "questions": questions,
        "answers": [],
        "feedbacks": [],
        "current_index": 0,
    })

    return StartSessionResponse(
        session_id=session_id,
        first_question=questions[0],
        total_questions=len(questions),
    )
