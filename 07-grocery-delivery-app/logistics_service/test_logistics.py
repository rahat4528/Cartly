import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest
import numpy as np
from route_optimizer import GroceryRouteOptimizer


def test_haversine_formula():
    dist = GroceryRouteOptimizer.haversine_km(40.7128, -74.0060, 40.7580, -73.9855)
    # Distance between lower Manhattan and Times Square ~ 5.3 km
    assert 4.5 < dist < 6.5


def test_tsp_2opt_solver():
    # 4 points arranged in a line: 0, 1, 2, 3
    # Distance matrix
    coords = [
        {"lat": 40.700, "lon": -74.000},
        {"lat": 40.720, "lon": -74.000},
        {"lat": 40.740, "lon": -74.000},
        {"lat": 40.760, "lon": -74.000},
    ]
    mat = GroceryRouteOptimizer.compute_distance_matrix(coords)
    tour = GroceryRouteOptimizer.solve_tsp_2opt(mat)
    assert len(tour) == 4
    # The tour starting at 0 should naturally proceed 0 -> 1 -> 2 -> 3
    assert tour == [0, 1, 2, 3]


def test_optimize_delivery_batch():
    depot = {"lat": 40.7128, "lon": -74.0060}
    orders = [
        {"orderId": "ORD-1", "lat": 40.7250, "lon": -74.0000, "customerName": "Alice", "itemsCount": 4},
        {"orderId": "ORD-2", "lat": 40.7500, "lon": -73.9900, "customerName": "Bob", "itemsCount": 2},
        {"orderId": "ORD-3", "lat": 40.7180, "lon": -74.0020, "customerName": "Charlie", "itemsCount": 1},
    ]

    res = GroceryRouteOptimizer.optimize_delivery_batch(depot, orders, avg_speed_kmh=30.0, stop_service_minutes=5.0)
    assert res["totalStops"] == 3
    assert res["totalDistanceKm"] > 0
    assert res["totalEstimatedMinutes"] > 15.0  # 3 stops * 5 min service + travel time
    assert len(res["legs"]) == 3
