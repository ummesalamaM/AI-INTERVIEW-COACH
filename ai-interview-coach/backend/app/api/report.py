from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import SessionSummary, AnswerFeedback, FillerWordAnalysis
from app.services.llm_service import generate_summary
from app.services.report_service import generate_pdf_report
from app.core.session_store import get_session, delete_session
import io

router = APIRouter()


@router.get("/summary/{session_id}", response_model=SessionSummary)
def get_summary(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    feedbacks_raw = session.get("feedbacks", [])
    if not feedbacks_raw:
        raise HTTPException(status_code=400, detail="No answers recorded yet")

    feedbacks = []
    for f in feedbacks_raw:
        filler_words = [FillerWordAnalysis(**fw) for fw in f.get("filler_words", [])]
        feedbacks.append(AnswerFeedback(
            score=f["score"],
            relevance=f["relevance"],
            clarity=f["clarity"],
            depth=f["depth"],
            filler_words=filler_words,
            filler_word_count=f["filler_word_count"],
            words_per_minute=f["words_per_minute"],
            suggested_answer=f["suggested_answer"],
        ))

    stats = generate_summary(
        role=session["role"],
        company=session["company"],
        feedbacks=feedbacks,
        questions=session["questions"],
    )

    return SessionSummary(
        session_id=session_id,
        role=session["role"],
        company=session["company"],
        overall_score=stats["overall_score"],
        total_questions=len(session["questions"]),
        avg_wpm=stats["avg_wpm"],
        total_filler_words=stats["total_filler_words"],
        strengths=stats["strengths"],
        improvements=stats["improvements"],
        question_scores=stats["question_scores"],
        detailed_feedbacks=feedbacks,
    )


@router.get("/pdf/{session_id}")
def download_pdf(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Rebuild summary for PDF
    feedbacks_raw = session.get("feedbacks", [])
    if not feedbacks_raw:
        raise HTTPException(status_code=400, detail="No answers recorded yet")

    feedbacks = []
    for f in feedbacks_raw:
        filler_words = [FillerWordAnalysis(**fw) for fw in f.get("filler_words", [])]
        feedbacks.append(AnswerFeedback(
            score=f["score"],
            relevance=f["relevance"],
            clarity=f["clarity"],
            depth=f["depth"],
            filler_words=filler_words,
            filler_word_count=f["filler_word_count"],
            words_per_minute=f["words_per_minute"],
            suggested_answer=f["suggested_answer"],
        ))

    stats = generate_summary(
        role=session["role"],
        company=session["company"],
        feedbacks=feedbacks,
        questions=session["questions"],
    )

    summary = SessionSummary(
        session_id=session_id,
        role=session["role"],
        company=session["company"],
        overall_score=stats["overall_score"],
        total_questions=len(session["questions"]),
        avg_wpm=stats["avg_wpm"],
        total_filler_words=stats["total_filler_words"],
        strengths=stats["strengths"],
        improvements=stats["improvements"],
        question_scores=stats["question_scores"],
        detailed_feedbacks=feedbacks,
    )

    pdf_bytes = generate_pdf_report(summary)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=interview-report-{session_id[:8]}.pdf"
        }
    )
