from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from valuation_engine import RealEstateValuationEngine

app = FastAPI(
    title="Cartly Real Estate Valuation Service",
    version="1.0.0",
    description="Python microservice providing Automated Valuation Model (AVM) for real estate assets"
)

engine = RealEstateValuationEngine()


class ValuationRequest(BaseModel):
    sqft: float = Field(gt=0, description="Square footage")
    bedrooms: int = Field(ge=0, description="Number of bedrooms")
    bathrooms: float = Field(ge=0, description="Number of bathrooms")
    year_built: int = Field(ge=1800, le=2030, description="Construction year")
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    condition_factor: Optional[float] = Field(default=1.0, ge=0.5, le=1.5)


class DistanceRequest(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "cartly-real-estate-valuation-service",
        "engine": "Cartly-AVM-v2.4",
        "runtime": "python"
    }


@app.post("/api/v1/valuation/estimate")
def estimate_valuation(req: ValuationRequest):
    return engine.estimate_price(
        sqft=req.sqft,
        bedrooms=req.bedrooms,
        bathrooms=req.bathrooms,
        year_built=req.year_built,
        latitude=req.latitude,
        longitude=req.longitude,
        condition_factor=req.condition_factor or 1.0,
    )


@app.post("/api/v1/valuation/distance")
def calculate_distance(req: DistanceRequest):
    dist_km = engine.haversine_distance_km(req.lat1, req.lon1, req.lat2, req.lon2)
    return {
        "distanceKm": round(dist_km, 3),
        "distanceMiles": round(dist_km * 0.621371, 3)
    }
