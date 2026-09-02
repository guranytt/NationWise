from uuid import UUID
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional

from app.api.deps import get_db
from app.models.candidate import Candidate
from app.models.candidate_metric import CandidateMetric
from app.models.candidate_score import CandidateScore
from app.models.candidate_rating import CandidateRating
from app.services.fingerprint_service import check_and_record_fingerprint
from app.services.scoring_service import recalculate_score

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

class CandidateRatingRequest(BaseModel):
    fingerprint_id: str
    rating: int # 1 or -1

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

@router.get("/")
async def list_candidates(
    state: Optional[str] = None,
    position: Optional[str] = None,
    party: Optional[str] = None,
    election_cycle: Optional[str] = "2027",
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    query = select(Candidate)
    
    if state:
        query = query.where(Candidate.state == state)
    if position:
        query = query.where(Candidate.position_sought == position)
    if party:
        query = query.where(Candidate.party == party)
    if election_cycle:
        query = query.where(Candidate.election_cycle == election_cycle)
        
    query = query.offset(skip).limit(limit)
    result_proxy = await db.execute(query)
    candidates = result_proxy.scalars().all()
    
    result = []
    for c in candidates:
        score_query = select(CandidateScore).where(CandidateScore.candidate_id == c.id).order_by(desc(CandidateScore.calculated_at))
        score_proxy = await db.execute(score_query)
        latest_score = score_proxy.scalars().first()
        result.append({
            "id": c.id,
            "full_name": c.full_name,
            "party": c.party,
            "state": c.state,
            "lga": c.lga,
            "position_sought": c.position_sought,
            "election_cycle": c.election_cycle,
            "photo_url": c.photo_url,
            "overall_score": latest_score.overall_score if latest_score else None
        })
    return result

@router.get("/board/leaderboard")
async def get_leaderboard(
    state: Optional[str] = None,
    position: Optional[str] = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    query = select(Candidate, CandidateScore).join(
        CandidateScore, Candidate.id == CandidateScore.candidate_id
    )
    
    if state:
        query = query.where(Candidate.state == state)
    if position:
        query = query.where(Candidate.position_sought == position)
        
    query = query.order_by(desc(CandidateScore.overall_score)).limit(limit)
    result_proxy = await db.execute(query)
    leaders = result_proxy.all()
    
    result = []
    for rank, (candidate, score) in enumerate(leaders, 1):
        result.append({
            "rank": rank,
            "id": candidate.id,
            "full_name": candidate.full_name,
            "party": candidate.party,
            "state": candidate.state,
            "position_sought": candidate.position_sought,
            "overall_score": score.overall_score
        })
        
    return result

@router.get("/compare/")
async def compare_candidates(ids: str, db: AsyncSession = Depends(get_db)):
    candidate_ids = [UUID(id.strip()) for id in ids.split(",")]
    
    query = select(Candidate).where(Candidate.id.in_(candidate_ids))
    result_proxy = await db.execute(query)
    candidates = result_proxy.scalars().all()
    
    result = []
    for c in candidates:
        score_query = select(CandidateScore).where(CandidateScore.candidate_id == c.id).order_by(desc(CandidateScore.calculated_at))
        score_proxy = await db.execute(score_query)
        latest_score = score_proxy.scalars().first()
        
        metrics_query = select(CandidateMetric).where(CandidateMetric.candidate_id == c.id).order_by(desc(CandidateMetric.scraped_at))
        metrics_proxy = await db.execute(metrics_query)
        metrics = metrics_proxy.scalars().all()
        
        result.append({
            "candidate": {
                "id": c.id,
                "full_name": c.full_name,
                "party": c.party,
                "photo_url": c.photo_url
            },
            "score": latest_score,
            "metrics": metrics
        })
        
    return result

@router.get("/{candidate_id}")
async def get_candidate(candidate_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(Candidate).where(Candidate.id == candidate_id)
    result_proxy = await db.execute(query)
    candidate = result_proxy.scalars().first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    score_query = select(CandidateScore).where(CandidateScore.candidate_id == candidate_id).order_by(desc(CandidateScore.calculated_at))
    score_proxy = await db.execute(score_query)
    latest_score = score_proxy.scalars().first()
    
    metrics_query = select(CandidateMetric).where(CandidateMetric.candidate_id == candidate_id).order_by(desc(CandidateMetric.scraped_at))
    metrics_proxy = await db.execute(metrics_query)
    metrics = metrics_proxy.scalars().all()
    
    return {
        "candidate": {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "party": candidate.party,
            "state": candidate.state,
            "lga": candidate.lga,
            "position_sought": candidate.position_sought,
            "election_cycle": candidate.election_cycle,
            "photo_url": candidate.photo_url,
            "bio": candidate.bio
        },
        "score": latest_score,
        "metrics": metrics
    }

@router.post("/{candidate_id}/rate")
async def rate_candidate(
    candidate_id: UUID,
    rating_in: CandidateRatingRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Verify candidate exists
    query = select(Candidate).where(Candidate.id == candidate_id)
    result_proxy = await db.execute(query)
    candidate = result_proxy.scalars().first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    if rating_in.rating not in [1, -1]:
        raise HTTPException(status_code=400, detail="Rating must be 1 (upvote) or -1 (downvote)")

    ip_address = get_client_ip(request)
    fingerprint = await check_and_record_fingerprint(db, rating_in.fingerprint_id, ip_address)
    
    # Check if user already rated
    query_existing = select(CandidateRating).where(
        CandidateRating.candidate_id == candidate_id,
        CandidateRating.fingerprint_id == fingerprint.id
    )
    result_existing = await db.execute(query_existing)
    existing_rating = result_existing.scalars().first()
    
    if existing_rating:
        if existing_rating.rating == rating_in.rating:
            # No change
            return {"status": "success", "message": "Rating unchanged"}
        else:
            existing_rating.rating = rating_in.rating
    else:
        new_rating = CandidateRating(
            candidate_id=candidate_id,
            fingerprint_id=fingerprint.id,
            rating=rating_in.rating
        )
        db.add(new_rating)
        
    await db.commit()
    
    # Calculate new community rating metric
    query_all = select(CandidateRating.rating).where(CandidateRating.candidate_id == candidate_id)
    result_all = await db.execute(query_all)
    ratings = result_all.scalars().all()
    
    total_ratings = len(ratings)
    if total_ratings > 0:
        upvotes = sum(1 for r in ratings if r == 1)
        score = (upvotes / total_ratings) * 100
        
        # Update or create the community_rating metric
        query_metric = select(CandidateMetric).where(
            CandidateMetric.candidate_id == candidate_id,
            CandidateMetric.metric_type == "community_rating"
        )
        result_metric = await db.execute(query_metric)
        metric = result_metric.scalars().first()
        
        if metric:
            metric.value = score
        else:
            metric = CandidateMetric(
                candidate_id=candidate_id,
                metric_type="community_rating",
                value=score,
                source_label="NationWise Community"
            )
            db.add(metric)
            
        await db.commit()
        await recalculate_score(db, str(candidate_id))

    return {"status": "success"}
