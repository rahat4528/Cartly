import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from route_optimizer import GroceryRouteOptimizer

app = FastAPI(
    title="Cartly Grocery Delivery Logistics Optimizer",
    description="Python 2-opt VRP / TSP route optimization microservice for grocery couriers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Location(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)


class DeliveryOrder(BaseModel):
    orderId: str
    lat: float
    lon: float
    customerName: Optional[str] = "Customer"
    itemsCount: Optional[int] = 1


class OptimizeRouteRequest(BaseModel):
    depot: Location
    orders: List[DeliveryOrder]
    avgSpeedKmh: float = Field(default=30.0, gt=5.0, le=120.0)
    stopServiceMinutes: float = Field(default=5.0, ge=0.0, le=60.0)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "grocery-logistics-route-optimizer",
        "framework": "FastAPI/NumPy/Python",
        "version": "1.0.0"
    }


@app.post("/api/v1/logistics/optimize-routes")
def optimize_routes_endpoint(req: OptimizeRouteRequest):
    try:
        depot_dict = {"lat": req.depot.lat, "lon": req.depot.lon}
        orders_dict = [o.model_dump() for o in req.orders]
        res = GroceryRouteOptimizer.optimize_delivery_batch(
            depot=depot_dict,
            orders=orders_dict,
            avg_speed_kmh=req.avgSpeedKmh,
            stop_service_minutes=req.stopServiceMinutes,
        )
        return {
            "status": "success",
            "logistics": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=False)
