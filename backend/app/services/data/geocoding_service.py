import urllib.request
import urllib.parse
import json
from typing import Dict, Any, Optional

USER_AGENT = "GramBizAI-RuralBusinessAdvisory/1.0"

def geocode_location_query(query: str) -> Dict[str, Any]:
    if not query or not query.strip():
        return {
            "display_name": "Valarpuram, Kanchipuram, Tamil Nadu",
            "village": "Valarpuram",
            "district": "Kanchipuram",
            "state": "Tamil Nadu",
            "latitude": 13.0125,
            "longitude": 79.9754
        }

    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            if data and len(data) > 0:
                item = data[0]
                lat = float(item.get("lat", 13.0125))
                lon = float(item.get("lon", 79.9754))
                disp = item.get("display_name", query)
                parts = [p.strip() for p in disp.split(",")]
                village = parts[0] if parts else query
                district = parts[-3] if len(parts) >= 3 else (parts[-2] if len(parts) >= 2 else "District")
                state = parts[-2] if len(parts) >= 2 else "Tamil Nadu"

                return {
                    "display_name": disp,
                    "village": village,
                    "district": district,
                    "state": state,
                    "latitude": lat,
                    "longitude": lon
                }
    except Exception as e:
        print("Geocoding exception:", e)

    # Fallback default coordinates
    return {
        "display_name": f"{query}, India",
        "village": query,
        "district": "District",
        "state": "Tamil Nadu",
        "latitude": 13.0125,
        "longitude": 79.9754
    }

def reverse_geocode_coordinates(lat: float, lon: float) -> Dict[str, Any]:
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            if data:
                disp = data.get("display_name", f"Lat {lat:.4f}, Lon {lon:.4f}")
                address = data.get("address", {})
                village = address.get("village") or address.get("town") or address.get("suburb") or "Your Location"
                district = address.get("county") or address.get("state_district") or address.get("city") or "District"
                state = address.get("state", "Tamil Nadu")

                return {
                    "display_name": disp,
                    "village": village,
                    "district": district,
                    "state": state,
                    "latitude": lat,
                    "longitude": lon
                }
    except Exception as e:
        print("Reverse geocoding exception:", e)

    return {
        "display_name": f"Current Location ({lat:.4f}, {lon:.4f})",
        "village": "Your Village",
        "district": "Local District",
        "state": "Tamil Nadu",
        "latitude": lat,
        "longitude": lon
    }
