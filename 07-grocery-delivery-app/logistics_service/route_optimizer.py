import math
from typing import List, Dict, Any, Tuple
import numpy as np


class GroceryRouteOptimizer:
    """
    Vehicle Routing Problem (VRP) & Route TSP Solver using 2-opt heuristic
    and geospatial Haversine metrics for grocery couriers.
    """

    EARTH_RADIUS_KM = 6371.0

    @classmethod
    def haversine_km(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance in kilometers."""
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return cls.EARTH_RADIUS_KM * c

    @classmethod
    def compute_distance_matrix(cls, stops: List[Dict[str, float]]) -> np.ndarray:
        """Computes pairwise N x N Euclidean/Haversine distance matrix."""
        n = len(stops)
        matrix = np.zeros((n, n), dtype=float)
        for i in range(n):
            for j in range(i + 1, n):
                d = cls.haversine_km(
                    stops[i]["lat"], stops[i]["lon"],
                    stops[j]["lat"], stops[j]["lon"]
                )
                matrix[i, j] = d
                matrix[j, i] = d
        return matrix

    @classmethod
    def solve_tsp_2opt(cls, dist_matrix: np.ndarray, max_iterations: int = 50) -> List[int]:
        """
        Solves Traveling Salesperson Problem using Nearest Neighbor initial tour
        followed by iterative 2-opt edge-swap improvements.
        """
        n = dist_matrix.shape[0]
        if n <= 1:
            return list(range(n))

        # Nearest neighbor initialization
        unvisited = set(range(1, n))
        tour = [0]
        curr = 0
        while unvisited:
            next_stop = min(unvisited, key=lambda city: dist_matrix[curr, city])
            tour.append(next_stop)
            unvisited.remove(next_stop)
            curr = next_stop

        # 2-opt optimization
        def tour_distance(t: List[int]) -> float:
            return sum(dist_matrix[t[i], t[i + 1]] for i in range(len(t) - 1))

        improved = True
        iterations = 0
        best_distance = tour_distance(tour)

        while improved and iterations < max_iterations:
            improved = False
            iterations += 1
            for i in range(1, n - 1):
                for j in range(i + 1, n):
                    # Test reversing segment [i:j]
                    new_tour = tour[:i] + tour[i:j + 1][::-1] + tour[j + 1:]
                    new_dist = tour_distance(new_tour)
                    if new_dist < best_distance - 1e-4:
                        tour = new_tour
                        best_distance = new_dist
                        improved = True
                        break
                if improved:
                    break

        return tour

    @classmethod
    def optimize_delivery_batch(
        cls,
        depot: Dict[str, float],
        orders: List[Dict[str, Any]],
        avg_speed_kmh: float = 30.0,
        stop_service_minutes: float = 5.0,
    ) -> Dict[str, Any]:
        """
        Optimizes grocery order deliveries starting from depot/store warehouse.
        Returns optimized sequence, legs, total distance, and arrival ETAs.
        """
        if not orders:
            return {
                "route": [],
                "totalDistanceKm": 0.0,
                "totalEstimatedMinutes": 0.0
            }

        all_stops = [{"lat": depot["lat"], "lon": depot["lon"], "type": "depot", "id": "depot"}]
        for o in orders:
            all_stops.append({
                "lat": float(o["lat"]),
                "lon": float(o["lon"]),
                "type": "delivery",
                "id": str(o.get("orderId", o.get("id", ""))),
                "customerName": str(o.get("customerName", "Customer")),
                "itemsCount": int(o.get("itemsCount", 1))
            })

        dist_matrix = cls.compute_distance_matrix(all_stops)
        optimized_indices = cls.solve_tsp_2opt(dist_matrix)

        total_distance_km = 0.0
        cumulative_minutes = 0.0
        legs = []

        for idx in range(len(optimized_indices) - 1):
            from_idx = optimized_indices[idx]
            to_idx = optimized_indices[idx + 1]
            leg_dist = float(dist_matrix[from_idx, to_idx])
            travel_mins = (leg_dist / avg_speed_kmh) * 60.0
            cumulative_minutes += travel_mins + stop_service_minutes
            total_distance_km += leg_dist

            legs.append({
                "from": all_stops[from_idx],
                "to": all_stops[to_idx],
                "legDistanceKm": round(leg_dist, 3),
                "legTravelMinutes": round(travel_mins, 1),
                "cumulativeMinutes": round(cumulative_minutes, 1)
            })

        return {
            "totalStops": len(orders),
            "totalDistanceKm": round(total_distance_km, 3),
            "totalEstimatedMinutes": round(cumulative_minutes, 1),
            "orderedStops": [all_stops[i] for i in optimized_indices[1:]],
            "legs": legs
        }
