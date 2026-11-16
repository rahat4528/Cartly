import pytest
from valuation_engine import RealEstateValuationEngine


def test_haversine_distance():
    # Distance between NYC (40.7128, -74.0060) and Philadelphia (39.9526, -75.1652) ~ 129-130 km
    dist = RealEstateValuationEngine.haversine_distance_km(40.7128, -74.0060, 39.9526, -75.1652)
    assert 120.0 < dist < 140.0


def test_valuation_scaling():
    engine = RealEstateValuationEngine()
    val_small = engine.estimate_price(
        sqft=800,
        bedrooms=1,
        bathrooms=1.0,
        year_built=2015,
        latitude=40.7128,
        longitude=-74.0060,
    )
    val_large = engine.estimate_price(
        sqft=3000,
        bedrooms=4,
        bathrooms=3.5,
        year_built=2020,
        latitude=40.7128,
        longitude=-74.0060,
    )

    assert val_large["estimatedPrice"] > val_small["estimatedPrice"]
    assert val_small["priceLow"] < val_small["estimatedPrice"] < val_small["priceHigh"]
    assert val_large["priceLow"] < val_large["estimatedPrice"] < val_large["priceHigh"]
    assert val_large["pricePerSqft"] > 0
