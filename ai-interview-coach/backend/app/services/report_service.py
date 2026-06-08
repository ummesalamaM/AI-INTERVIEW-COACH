from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from app.models.schemas import SessionSummary

PRIMARY = colors.HexColor("#1a1a2e")
ACCENT = colors.HexColor("#4f46e5")
SUCCESS = colors.HexColor("#059669")
WARNING = colors.HexColor("#d97706")
DANGER = colors.HexColor("#dc2626")
LIGHT_BG = colors.HexColor("#f8f9ff")


def score_color(score: int):
    if score >= 75:
        return SUCCESS
    elif score >= 50:
        return WARNING
    return DANGER


def generate_pdf_report(summary: SessionSummary) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", fontSize=22, textColor=PRIMARY,
                                  spaceAfter=4, fontName="Helvetica-Bold", alignment=TA_CENTER)
    sub_style = ParagraphStyle("sub", fontSize=11, textColor=colors.grey,
                                spaceAfter=2, alignment=TA_CENTER)
    section_style = ParagraphStyle("section", fontSize=13, textColor=ACCENT,
                                    fontName="Helvetica-Bold", spaceBefore=16, spaceAfter=6)
    body_style = ParagraphStyle("body", fontSize=10, textColor=PRIMARY,
                                 spaceAfter=4, leading=15)
    label_style = ParagraphStyle("label", fontSize=9, textColor=colors.grey,
                                  fontName="Helvetica-Bold")

    story = []

    # Header
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("AI Mock Interview Report", title_style))
    story.append(Paragraph(f"{summary.role} · {summary.company}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    # Scorecard table
    score_c = score_color(summary.overall_score)
    metrics = [
        ["Overall Score", "Avg WPM", "Filler Words", "Questions"],
        [
            Paragraph(f'<font color="#{score_c.hexval()[1:]}"><b>{summary.overall_score}/100</b></font>', body_style),
            Paragraph(f"<b>{summary.avg_wpm}</b>", body_style),
            Paragraph(f"<b>{summary.total_filler_words}</b>", body_style),
            Paragraph(f"<b>{summary.total_questions}</b>", body_style),
        ]
    ]
    t = Table(metrics, colWidths=[4 * cm] * 4)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.grey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white]),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4 * cm))

    # Strengths & Improvements
    story.append(Paragraph("Strengths", section_style))
    for s in summary.strengths:
        story.append(Paragraph(f"✓  {s}", body_style))

    story.append(Paragraph("Areas for Improvement", section_style))
    for imp in summary.improvements:
        story.append(Paragraph(f"→  {imp}", body_style))

    # Per-question breakdown
    story.append(Paragraph("Question-by-Question Breakdown", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey, spaceAfter=8))

    for i, fb in enumerate(summary.detailed_feedbacks):
        q_color = score_color(fb.score)

        story.append(Paragraph(f"<b>Q{i+1}</b>", label_style))
        story.append(Spacer(1, 0.1 * cm))

        # Score row
        row = [
            [Paragraph(f'<font color="#{q_color.hexval()[1:]}"><b>{fb.score}/100</b></font>', body_style),
             Paragraph(f"WPM: {fb.words_per_minute}", body_style),
             Paragraph(f"Filler words: {fb.filler_word_count}", body_style)]
        ]
        rt = Table(row, colWidths=[4 * cm, 4 * cm, 8 * cm])
        rt.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(rt)

        story.append(Paragraph(f"<b>Relevance:</b> {fb.relevance}", body_style))
        story.append(Paragraph(f"<b>Clarity:</b> {fb.clarity}", body_style))
        story.append(Paragraph(f"<b>Depth:</b> {fb.depth}", body_style))

        if fb.filler_words:
            filler_str = ", ".join([f"{f.word} ({f.count}x)" for f in fb.filler_words])
            story.append(Paragraph(f"<b>Filler words detected:</b> {filler_str}", body_style))

        story.append(Paragraph(f"<b>Model Answer:</b> {fb.suggested_answer}", body_style))
        story.append(HRFlowable(width="100%", thickness=0.3, color=colors.lightgrey,
                                 spaceBefore=8, spaceAfter=8))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
