import os
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

from app.api.deps import get_db
from app.models.candidate import Candidate
from app.models.candidate_metric import CandidateMetric
from app.services.scoring_service import recalculate_score

router = APIRouter(prefix="/api/ingest", tags=["Scraper Ingest"])

EXPECTED_API_KEY = os.environ.get("SCRAPER_API_KEY", "dev_scraper_key_123")

def verify_scraper_key(x_scraper_key: str = Header(...)):
    if x_scraper_key != EXPECTED_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_scraper_key

class CandidateCreate(BaseModel):
    full_name: str
    party: str
    state: str
    lga: Optional[str] = None
    position_sought: str
    election_cycle: str = "2027"
    photo_url: Optional[HttpUrl] = None
    bio: Optional[str] = None

class MetricCreate(BaseModel):
    candidate_id: UUID
    metric_type: str
    value: float
    source_url: Optional[HttpUrl] = None
    source_label: Optional[str] = None

@router.post("/candidate")
async def ingest_candidate(candidate_in: CandidateCreate, db: AsyncSession = Depends(get_db), _: str = Depends(verify_scraper_key)):
    query = select(Candidate).where(
        Candidate.full_name == candidate_in.full_name,
        Candidate.party == candidate_in.party,
        Candidate.state == candidate_in.state,
        Candidate.election_cycle == candidate_in.election_cycle
    )
    result_proxy = await db.execute(query)
    existing = result_proxy.scalars().first()
    
    if existing:
        existing.photo_url = str(candidate_in.photo_url) if candidate_in.photo_url else existing.photo_url
        existing.bio = candidate_in.bio if candidate_in.bio else existing.bio
        await db.commit()
        await db.refresh(existing)
        return {"status": "updated", "candidate_id": existing.id}
    else:
        new_candidate = Candidate(
            full_name=candidate_in.full_name,
            party=candidate_in.party,
            state=candidate_in.state,
            lga=candidate_in.lga,
            position_sought=candidate_in.position_sought,
            election_cycle=candidate_in.election_cycle,
            photo_url=str(candidate_in.photo_url) if candidate_in.photo_url else None,
            bio=candidate_in.bio
        )
        db.add(new_candidate)
        await db.commit()
        await db.refresh(new_candidate)
        await recalculate_score(db, str(new_candidate.id))
        return {"status": "created", "candidate_id": new_candidate.id}

@router.post("/metric")
async def ingest_metric(metric_in: MetricCreate, db: AsyncSession = Depends(get_db), _: str = Depends(verify_scraper_key)):
    query = select(Candidate).where(Candidate.id == metric_in.candidate_id)
    result_proxy = await db.execute(query)
    candidate = result_proxy.scalars().first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    new_metric = CandidateMetric(
        candidate_id=metric_in.candidate_id,
        metric_type=metric_in.metric_type,
        value=metric_in.value,
        source_url=str(metric_in.source_url) if metric_in.source_url else None,
        source_label=metric_in.source_label
    )
    db.add(new_metric)
    await db.commit()
    
    new_score = await recalculate_score(db, str(metric_in.candidate_id))
    
    return {"status": "created", "metric_id": new_metric.id, "new_overall_score": new_score.overall_score}

@router.post("/score/recalculate/{candidate_id}")
async def trigger_scoring(candidate_id: UUID, db: AsyncSession = Depends(get_db), _: str = Depends(verify_scraper_key)):
    try:
        new_score = await recalculate_score(db, str(candidate_id))
        return {"status": "success", "new_overall_score": new_score.overall_score}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
