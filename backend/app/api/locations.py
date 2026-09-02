import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/locations", tags=["Locations"])

def load_locations():
    path = os.path.join(os.path.dirname(__file__), "..", "data", "nigeria_locations.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/states")
async def get_states():
    data = load_locations()
    return sorted([state["name"] for state in data["states"]])

@router.get("/lgas")
async def get_lgas(state: str):
    data = load_locations()
    for s in data["states"]:
        if s["name"].lower() == state.lower():
            return sorted(s["lgas"])
    raise HTTPException(status_code=404, detail="State not found")
