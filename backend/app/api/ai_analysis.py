import os
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.api.deps import get_db
from app.models.candidate import Candidate
from app.models.ai_insight import AIInsight
from app.models.promise import Promise
from app.services.ai_service import analyze_candidate_profile, extract_promises

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])

@router.post("/analyze-candidate/{candidate_id}")
async def analyze_candidate(candidate_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(Candidate).where(Candidate.id == candidate_id)
    result = await db.execute(query)
    candidate = result.scalars().first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Serialize candidate data
    candidate_data = {
        "full_name": candidate.full_name,
        "party": candidate.party,
        "state": candidate.state,
        "position": candidate.position_sought,
        "bio": candidate.bio,
    }
    
    analysis = await analyze_candidate_profile(candidate_data)
    if "error" in analysis:
        raise HTTPException(status_code=500, detail=analysis["error"])
        
    insight = AIInsight(
        candidate_id=candidate.id,
        insight_type="general_summary",
        content=analysis,
        model_used="gemini-2.0-flash"
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    
    return insight

@router.get("/insights/{candidate_id}")
async def get_insights(candidate_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(AIInsight).where(AIInsight.candidate_id == candidate_id).order_by(AIInsight.created_at.desc())
    result = await db.execute(query)
    insights = result.scalars().all()
    return insights

@router.get("/promises/{candidate_id}")
async def get_promises(candidate_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(Promise).where(Promise.candidate_id == candidate_id).order_by(Promise.created_at.desc())
    result = await db.execute(query)
    promises = result.scalars().all()
    return promises
