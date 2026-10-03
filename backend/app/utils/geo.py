import math


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth
    using the Haversine formula.
    
    Returns distance in meters.
    """
    R = 6371000  # Earth's radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def is_within_geofence(
    user_lat: float,
    user_lon: float,
    fence_lat: float,
    fence_lon: float,
    radius_meters: float,
) -> tuple[bool, float]:
    """
    Check if user coordinates are within the geofence radius.
    Returns (is_within, distance_meters).
    """
    distance = haversine_distance(user_lat, user_lon, fence_lat, fence_lon)
    return distance <= radius_meters, round(distance, 2)