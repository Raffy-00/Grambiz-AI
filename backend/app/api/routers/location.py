from fastapi import APIRouter, HTTPException, Query
from app.schemas.schemas import GeocodeResponse, NearbyBusinessesRequest, NearbyBusinessesResponse
from app.services.maps.google_maps_service import geocode_location, reverse_geocode
from app.services.data.places_service import fetch_nearby_competitors

router = APIRouter(prefix="/api/location", tags=["location"])

@router.get("/geocode", response_model=GeocodeResponse)
@router.post("/geocode", response_model=GeocodeResponse)
def geocode_endpoint(q: str = Query(..., min_length=2, description="Location search query")):
    res = geocode_location(q)
    return GeocodeResponse(**res)

@router.get("/reverse-geocode", response_model=GeocodeResponse)
@router.post("/reverse-geocode", response_model=GeocodeResponse)
def reverse_geocode_endpoint(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
):
    res = reverse_geocode(lat, lon)
    return GeocodeResponse(**res)

@router.post("/nearby-businesses", response_model=NearbyBusinessesResponse)
def nearby_businesses_endpoint(payload: NearbyBusinessesRequest):
    res = fetch_nearby_competitors(
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km,
        category=payload.business_category,
        business_name=payload.business_name,
        location_name=payload.location_name
    )
    return NearbyBusinessesResponse(**res)
