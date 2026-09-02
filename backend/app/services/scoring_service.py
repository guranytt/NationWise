from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.candidate import Candidate
from app.models.candidate_metric import CandidateMetric
from app.models.candidate_score import CandidateScore

WEIGHTS = {
    "transparency": 0.25,
    "track_record": 0.25,
    "integrity": 0.20,
    "perception": 0.15,
    "policy": 0.10,
    "community": 0.05
}

def _normalize(value: float) -> float:
    return max(0.0, min(100.0, value))

def _calculate_dimension_score(metrics: List[CandidateMetric], metric_types: List[str]) -> float:
    relevant_metrics = [m for m in metrics if m.metric_type in metric_types]
    if not relevant_metrics:
        return 50.0 
    
    total = sum(m.value for m in relevant_metrics)
    return _normalize(total / len(relevant_metrics))

async def recalculate_score(db: AsyncSession, candidate_id: str) -> CandidateScore:
    query = select(Candidate).where(Candidate.id == candidate_id)
    result_proxy = await db.execute(query)
    candidate = result_proxy.scalars().first()
    if not candidate:
        raise ValueError(f"Candidate {candidate_id} not found")
        
    metrics_query = select(CandidateMetric).where(CandidateMetric.candidate_id == candidate_id)
    metrics_proxy = await db.execute(metrics_query)
    metrics = metrics_proxy.scalars().all()
    
    transparency_score = _calculate_dimension_score(metrics, ["asset_declaration", "campaign_finance"])
    track_record_score = _calculate_dimension_score(metrics, ["constituency_projects", "attendance_record"])
    financial_score = _calculate_dimension_score(metrics, ["court_cases", "education_verified"]) 
    perception_score = _calculate_dimension_score(metrics, ["social_sentiment", "news_mentions"])
    governance_score = _calculate_dimension_score(metrics, ["manifesto_score"]) 
    public_trust_score = _calculate_dimension_score(metrics, ["community_rating"]) 
    
    overall = (
        transparency_score * WEIGHTS["transparency"] +
        track_record_score * WEIGHTS["track_record"] +
        financial_score * WEIGHTS["integrity"] +
        perception_score * WEIGHTS["perception"] +
        governance_score * WEIGHTS["policy"] +
        public_trust_score * WEIGHTS["community"]
    )
    
    new_score = CandidateScore(
        candidate_id=candidate.id,
        overall_score=overall,
        transparency_score=transparency_score,
        track_record_score=track_record_score,
        financial_score=financial_score,
        governance_score=governance_score,
        public_trust_score=public_trust_score,
        methodology_version="1.0"
    )
    
    db.add(new_score)
    await db.commit()
    await db.refresh(new_score)
    
    return new_score
