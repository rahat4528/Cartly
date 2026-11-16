import math
from typing import Dict, Any, List


class RealEstateValuationEngine:
    """
    Automated Valuation Model (AVM) for Real Estate Assets.
    Calculates estimated fair market value, confidence intervals, price per square foot,
    and geospatial distance calculations using the Haversine formula.
    """

    EARTH_RADIUS_KM = 6371.0
    BASE_RATE_PER_SQFT = 380.0

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points on the earth in kilometers.
        """
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return RealEstateValuationEngine.EARTH_RADIUS_KM * c

    def estimate_price(
        self,
        sqft: float,
        bedrooms: int,
        bathrooms: float,
        year_built: int,
        latitude: float,
        longitude: float,
        condition_factor: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Estimate property valuation with bounds and confidence intervals.
        """
        # Base pricing on square footage
        base_val = sqft * self.BASE_RATE_PER_SQFT

        # Bedroom & Bathroom adjustments
        bed_factor = 1.0 + (bedrooms - 2) * 0.08
        bath_factor = 1.0 + (bathrooms - 1.5) * 0.06

        # Age depreciation / appreciation factor
        current_year = 2026
        age = max(0, current_year - year_built)
        age_factor = max(0.75, 1.0 - (age * 0.005))

        # Composite estimation
        estimated_price = round(base_val * bed_factor * bath_factor * age_factor * condition_factor, 2)
        price_low = round(estimated_price * 0.92, 2)
        price_high = round(estimated_price * 1.08, 2)
        price_per_sqft = round(estimated_price / sqft, 2) if sqft > 0 else 0.0

        return {
            "estimatedPrice": estimated_price,
            "priceLow": price_low,
            "priceHigh": price_high,
            "pricePerSqft": price_per_sqft,
            "confidenceScore": 0.88,
            "valuationModel": "Cartly-AVM-v2.4",
            "metadata": {
                "sqft": sqft,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "yearBuilt": year_built,
                "latitude": latitude,
                "longitude": longitude,
            },
        }
