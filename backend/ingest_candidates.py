import os
import httpx
import asyncio
import json

# Make sure this matches the API key in the backend
API_KEY = os.environ.get("SCRAPER_API_KEY", "dev_scraper_key_123")
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
HEADERS = {"X-Scraper-Key": API_KEY}

async def ingest_candidate(client: httpx.AsyncClient, candidate_data: dict):
    print(f"Ingesting candidate: {candidate_data['full_name']}")
    response = await client.post(f"{API_BASE_URL}/api/ingest/candidate", json=candidate_data, headers=HEADERS)
    response.raise_for_status()
    return response.json()["candidate_id"]

async def ingest_metric(client: httpx.AsyncClient, candidate_id: str, metric_type: str, value: float, source_label: str):
    metric_data = {
        "candidate_id": candidate_id,
        "metric_type": metric_type,
        "value": value,
        "source_label": source_label,
        "source_url": "https://example.com/source"
    }
    response = await client.post(f"{API_BASE_URL}/api/ingest/metric", json=metric_data, headers=HEADERS)
    response.raise_for_status()
    return response.json()

async def main():
    async with httpx.AsyncClient() as client:
        # Candidate 1
        c1_id = await ingest_candidate(client, {
            "full_name": "Babagana Umara Zulum",
            "party": "APC",
            "state": "Borno",
            "position_sought": "Governor",
            "election_cycle": "2027",
            "bio": "Serving Governor of Borno State, known for reconstruction efforts.",
            "photo_url": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Babagana_Umara_Zulum.jpg"
        })
        
        # Ingest metrics for Zulum
        await ingest_metric(client, c1_id, "asset_declaration", 85.0, "CCB Verified")
        await ingest_metric(client, c1_id, "constituency_projects", 90.0, "State Project Tracker")
        await ingest_metric(client, c1_id, "court_cases", 100.0, "No pending cases")
        await ingest_metric(client, c1_id, "social_sentiment", 88.0, "Twitter/X Analysis")
        await ingest_metric(client, c1_id, "community_rating", 92.0, "Local NGO Survey")
        
        # Candidate 2
        c2_id = await ingest_candidate(client, {
            "full_name": "Seyi Makinde",
            "party": "PDP",
            "state": "Oyo",
            "position_sought": "President",
            "election_cycle": "2027",
            "bio": "Governor of Oyo State, engineer and businessman.",
            "photo_url": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Seyi_Makinde_Portrait.jpg"
        })
        
        # Ingest metrics for Makinde
        await ingest_metric(client, c2_id, "asset_declaration", 95.0, "Publicly Declared")
        await ingest_metric(client, c2_id, "constituency_projects", 82.0, "State Project Tracker")
        await ingest_metric(client, c2_id, "court_cases", 95.0, "Minor administrative cases")
        await ingest_metric(client, c2_id, "social_sentiment", 75.0, "Twitter/X Analysis")
        await ingest_metric(client, c2_id, "community_rating", 80.0, "Local NGO Survey")
        
        print("Successfully ingested sample candidates and metrics!")

if __name__ == "__main__":
    asyncio.run(main())
