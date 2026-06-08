from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.schemas import AnswerRequest, AnswerFeedback
from app.services.llm_service import analyze_answer
from app.services.transcription_service import transcribe_audio
from app.core.session_store import get_session, update_session
import json

router = APIRouter()


@router.post("/audio", response_model=AnswerFeedback)
async def submit_audio_answer(
    session_id: str = Form(...),
    question_index: int = Form(...),
    duration_seconds: float = Form(...),
    audio: UploadFile = File(...),
):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    audio_bytes = await audio.read()
    transcript = await transcribe_audio(audio_bytes, audio.content_type or "audio/webm")

    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Could not transcribe audio. Please try again.")

    return await _process_answer(session, session_id, question_index, transcript, duration_seconds)


@router.post("/text", response_model=AnswerFeedback)
async def submit_text_answer(req: AnswerRequest):
    session = get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return await _process_answer(
        session, req.session_id, req.question_index, req.transcript, req.duration_seconds
    )


async def _process_answer(
    session: dict,
    session_id: str,
    question_index: int,
    transcript: str,
    duration_seconds: float,
) -> AnswerFeedback:
    questions = session["questions"]
    if question_index >= len(questions):
        raise HTTPException(status_code=400, detail="Invalid question index")

    question = questions[question_index]

    feedback = analyze_answer(
        question=question,
        answer=transcript,
        role=session["role"],
        company=session["company"],
        interview_type=session["interview_type"],
        duration_seconds=duration_seconds,
    )

    feedbacks = session.get("feedbacks", [])
    feedbacks.append(feedback.model_dump())
    answers = session.get("answers", [])
    answers.append(transcript)

    next_index = question_index + 1
    is_last = next_index >= len(questions)

    update_session(session_id, {
        "feedbacks": feedbacks,
        "answers": answers,
        "current_index": next_index,
    })

    feedback.is_last_question = is_last
    if not is_last:
        feedback.next_question = questions[next_index]

    return feedback
