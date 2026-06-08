from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import interview, feedback, report

app = FastAPI(title="AI Interview Coach API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(report.router, prefix="/api/report", tags=["report"])

@app.get("/health")
def health():
    return {"status": "ok"}
