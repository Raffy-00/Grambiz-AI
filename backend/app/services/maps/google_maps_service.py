import os
import re
import urllib.parse
from typing import Dict, Any, Optional, List
import requests

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
USER_AGENT = "GramBizAI-RuralEnterprise/1.0 (https://grambiz.app; support@grambiz.local)"
HTTP_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9"
}

def _clean_str(val: Any) -> str:
    if not val:
        return ""
    s = str(val).strip()
    s = re.sub(r'^Zone\s+\d+\s+', '', s, flags=re.IGNORECASE)
    return s.strip()

def _parse_nominatim_address(data: Dict[str, Any], fallback_lat: float, fallback_lon: float) -> Dict[str, Any]:
    address = data.get("address", {})
    raw_disp = data.get("display_name", "")
    
    # Coordinates
    lat = float(data.get("lat", fallback_lat))
    lon = float(data.get("lon", fallback_lon))
    
    # 1. Village / Local Area
    village = (
        _clean_str(address.get("village")) or
        _clean_str(address.get("hamlet")) or
        _clean_str(address.get("neighbourhood")) or
        _clean_str(address.get("suburb")) or
        _clean_str(address.get("quarter")) or
        _clean_str(address.get("town")) or
        _clean_str(address.get("city")) or
        _clean_str(address.get("municipality")) or
        "Local Area"
    )

    # 2. District
    district = (
        _clean_str(address.get("state_district")) or
        _clean_str(address.get("district")) or
        _clean_str(address.get("county")) or
        _clean_str(address.get("city")) or
        _clean_str(address.get("municipality")) or
        "District"
    )
    # Clean redundant suffixes
    district = district.replace(" Corporation", "").replace(" District", "").strip()

    # If village resolved to exact same name as district, try road or neighbourhood
    if village.lower() == district.lower():
        alt = _clean_str(address.get("neighbourhood")) or _clean_str(address.get("suburb")) or _clean_str(address.get("road"))
        if alt and alt.lower() != district.lower():
            village = alt

    # 3. Block / Taluk / Subdivision
    block = (
        _clean_str(address.get("county")) or
        _clean_str(address.get("municipality")) or
        _clean_str(address.get("city_district")) or
        _clean_str(address.get("suburb")) or
        ""
    )

    # 4. State & Postcode
    state = _clean_str(address.get("state")) or "Tamil Nadu"
    postcode = _clean_str(address.get("postcode"))

    # Clean display name
    parts = [p for p in [village, district, state] if p]
    clean_disp = ", ".join(parts) if parts else raw_disp

    return {
        "display_name": clean_disp,
        "village": village,
        "district": district,
        "block": block,
        "suburb": _clean_str(address.get("suburb")),
        "town": _clean_str(address.get("town")),
        "state": state,
        "postcode": postcode,
        "latitude": round(lat, 5),
        "longitude": round(lon, 5)
    }

def geocode_location(query: str) -> Dict[str, Any]:
    if not query or not query.strip():
        return {
            "display_name": "Valarpuram, Kanchipuram, Tamil Nadu",
            "village": "Valarpuram",
            "district": "Kanchipuram",
            "block": "Sriperumbudur",
            "state": "Tamil Nadu",
            "postcode": "602105",
            "latitude": 13.0125,
            "longitude": 79.9754
        }

    clean_q = query.strip()

    # 1. Google Maps Geocoding API if key configured and active
    if GOOGLE_MAPS_API_KEY:
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={urllib.parse.quote(clean_q)}&key={GOOGLE_MAPS_API_KEY}"
            resp = requests.get(url, headers=HTTP_HEADERS, timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "OK" and data.get("results"):
                    first = data["results"][0]
                    lat = first["geometry"]["location"]["lat"]
                    lon = first["geometry"]["location"]["lng"]
                    disp = first.get("formatted_address", clean_q)
                    parts = [p.strip() for p in disp.split(",")]
                    village = parts[0] if parts else clean_q
                    district = parts[-3] if len(parts) >= 3 else (parts[-2] if len(parts) >= 2 else "District")
                    state = parts[-2] if len(parts) >= 2 else "Tamil Nadu"

                    return {
                        "display_name": disp,
                        "village": village,
                        "district": district,
                        "state": state,
                        "latitude": round(lat, 5),
                        "longitude": round(lon, 5)
                    }
        except Exception as e:
            print("[Google Maps Geocode Notice]:", e)

    # 2. Nominatim OpenStreetMap Geocoding (Global + Hyper-local India)
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(clean_q)}&format=json&addressdetails=1&limit=1"
        resp = requests.get(url, headers=HTTP_HEADERS, timeout=4.5)
        if resp.status_code == 200:
            items = resp.json()
            if items and isinstance(items, list) and len(items) > 0:
                return _parse_nominatim_address(items[0], 13.0125, 79.9754)
    except Exception as e:
        print("[Nominatim Geocode Notice]:", e)

    # 3. Country-wide query fallback if simple village query failed
    if "," not in clean_q:
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(clean_q + ', India')}&format=json&addressdetails=1&limit=1"
            resp = requests.get(url, headers=HTTP_HEADERS, timeout=4)
            if resp.status_code == 200:
                items = resp.json()
                if items and isinstance(items, list) and len(items) > 0:
                    return _parse_nominatim_address(items[0], 13.0125, 79.9754)
        except Exception:
            pass

    # 4. Safe fallback
    return {
        "display_name": f"{clean_q}, India",
        "village": clean_q,
        "district": "Local District",
        "state": "Tamil Nadu",
        "latitude": 13.0125,
        "longitude": 79.9754
    }

def reverse_geocode(lat: float, lon: float) -> Dict[str, Any]:
    # 1. Google Maps Reverse Geocoding API if key configured and active
    if GOOGLE_MAPS_API_KEY:
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={GOOGLE_MAPS_API_KEY}"
            resp = requests.get(url, headers=HTTP_HEADERS, timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "OK" and data.get("results"):
                    first = data["results"][0]
                    disp = first.get("formatted_address", f"Lat {lat:.4f}, Lon {lon:.4f}")
                    parts = [p.strip() for p in disp.split(",")]
                    village = parts[0] if parts else "Your Village"
                    district = parts[-3] if len(parts) >= 3 else (parts[-2] if len(parts) >= 2 else "District")
                    state = parts[-2] if len(parts) >= 2 else "Tamil Nadu"

                    return {
                        "display_name": disp,
                        "village": village,
                        "district": district,
                        "state": state,
                        "latitude": round(lat, 5),
                        "longitude": round(lon, 5)
                    }
        except Exception as e:
            print("[Google Maps Reverse Geocode Notice]:", e)

    # 2. Nominatim OpenStreetMap Reverse Geocode
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1"
        resp = requests.get(url, headers=HTTP_HEADERS, timeout=4.5)
        if resp.status_code == 200:
            data = resp.json()
            if data and "address" in data:
                return _parse_nominatim_address(data, lat, lon)
    except Exception as e:
        print("[Nominatim Reverse Geocode Notice]:", e)

    # 3. Fallback coordinate representation
    return {
        "display_name": f"Current Location ({lat:.4f}, {lon:.4f})",
        "village": "Your Location",
        "district": "Local District",
        "state": "Tamil Nadu",
        "latitude": round(lat, 5),
        "longitude": round(lon, 5)
    }
