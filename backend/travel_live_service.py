import os
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

import requests


AMADEUS_BASE_URL = os.getenv("AMADEUS_BASE_URL", "https://test.api.amadeus.com")
AMADEUS_API_KEY = os.getenv("AMADEUS_API_KEY")
AMADEUS_API_SECRET = os.getenv("AMADEUS_API_SECRET")

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
TRAIN_API_URL = os.getenv("TRAIN_API_URL")
TRAIN_API_HOST = os.getenv("TRAIN_API_HOST")
BUS_API_URL = os.getenv("BUS_API_URL")
BUS_API_HOST = os.getenv("BUS_API_HOST")
TRAIN_ITEMS_PATH = os.getenv("TRAIN_ITEMS_PATH", "data")
BUS_ITEMS_PATH = os.getenv("BUS_ITEMS_PATH", "data")
HTTP_HEADERS = {
    "User-Agent": "ai-trip-planner/1.0 (travel assistant)",
}

CURATED_REAL_HOTELS = {
    "jaipur": [
        ("Rambagh Palace", "5.0", "Civil Lines"),
        ("ITC Rajputana", "5.0", "Gopalbari"),
        ("Trident Jaipur", "5.0", "Amer Road"),
        ("Jai Mahal Palace", "5.0", "Jacob Road"),
        ("Samode Haveli", "4.5", "Gangapole"),
    ],
    "mumbai": [
        ("The Taj Mahal Palace", "5.0", "Colaba"),
        ("The Oberoi Mumbai", "5.0", "Nariman Point"),
        ("Trident Nariman Point", "5.0", "Marine Drive"),
        ("ITC Maratha", "5.0", "Andheri East"),
        ("The St. Regis Mumbai", "5.0", "Lower Parel"),
    ],
    "goa": [
        ("Taj Exotica Resort & Spa", "5.0", "Benaulim"),
        ("The Leela Goa", "5.0", "Cavelossim"),
        ("Grand Hyatt Goa", "5.0", "Bambolim"),
        ("W Goa", "5.0", "Vagator"),
        ("Alila Diwa Goa", "5.0", "Majorda"),
    ],
    "delhi": [
        ("The Imperial New Delhi", "5.0", "Janpath"),
        ("Taj Palace New Delhi", "5.0", "Diplomatic Enclave"),
        ("The Leela Palace New Delhi", "5.0", "Chanakyapuri"),
        ("ITC Maurya", "5.0", "Sardar Patel Marg"),
        ("Shangri-La Eros New Delhi", "5.0", "Connaught Place"),
    ],
    "bangalore": [
        ("The Leela Palace Bengaluru", "5.0", "Old Airport Road"),
        ("Taj West End", "5.0", "Race Course Road"),
        ("ITC Gardenia", "5.0", "Residency Road"),
        ("The Oberoi Bengaluru", "5.0", "MG Road"),
        ("JW Marriott Hotel Bengaluru", "5.0", "Vittal Mallya Road"),
    ],
    "dubai": [
        ("Atlantis The Palm", "5.0", "Palm Jumeirah"),
        ("Burj Al Arab Jumeirah", "5.0", "Jumeirah"),
        ("Address Downtown", "5.0", "Downtown Dubai"),
        ("JW Marriott Marquis Dubai", "5.0", "Business Bay"),
        ("Armani Hotel Dubai", "5.0", "Burj Khalifa"),
    ],
}


def _dig(data: Any, dotted_path: str) -> Any:
    if not dotted_path:
        return data
    current = data
    for part in dotted_path.split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current


def _coerce_items(payload: Any, items_path: str) -> List[Dict[str, Any]]:
    raw = _dig(payload, items_path)
    if isinstance(raw, list):
        return [row for row in raw if isinstance(row, dict)]
    if isinstance(raw, dict):
        return [raw]
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    return []


def _pick_value(row: Dict[str, Any], keys: List[str], default: str = "N/A") -> str:
    for key in keys:
        value = _dig(row, key)
        if value is not None and value != "":
            return str(value)
    return default


def _safe_get(url: str, headers: Dict[str, str], params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        req_headers = {**HTTP_HEADERS, **(headers or {})}
        resp = requests.get(url, headers=req_headers, params=params, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


def _get_amadeus_token() -> Optional[str]:
    if not AMADEUS_API_KEY or not AMADEUS_API_SECRET:
        return None

    try:
        resp = requests.post(
            f"{AMADEUS_BASE_URL}/v1/security/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": AMADEUS_API_KEY,
                "client_secret": AMADEUS_API_SECRET,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json().get("access_token")
    except Exception:
        return None


def _resolve_iata_code(city_or_airport: str, token: str) -> Optional[str]:
    url = f"{AMADEUS_BASE_URL}/v1/reference-data/locations"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "subType": "CITY,AIRPORT",
        "keyword": city_or_airport,
        "page[limit]": 1,
    }
    payload = _safe_get(url, headers, params)
    if not payload or not payload.get("data"):
        return None
    return payload["data"][0].get("iataCode")


def _pick_best_flight(offers: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Optional[int]]:
    if not offers:
        return [], None

    scored: List[Tuple[int, Dict[str, Any]]] = []
    for offer in offers:
        try:
            price = float(offer.get("price", {}).get("total", "0"))
        except Exception:
            price = 999999.0
        itinerary = (offer.get("itineraries") or [{}])[0]
        segments = itinerary.get("segments") or []
        stops = max(len(segments) - 1, 0)
        score = int(price * 100) + (stops * 25000)
        scored.append((score, offer))

    scored.sort(key=lambda x: x[0])
    best_offer = scored[0][1]
    best_id = best_offer.get("id")
    normalized = []
    for offer in [x[1] for x in scored[:5]]:
        itinerary = (offer.get("itineraries") or [{}])[0]
        segments = itinerary.get("segments") or []
        dep = segments[0].get("departure", {}) if segments else {}
        arr = segments[-1].get("arrival", {}) if segments else {}
        validating_airline_codes = offer.get("validatingAirlineCodes") or []
        traveler_pricings = offer.get("travelerPricings") or []
        fare_basis = traveler_pricings[0].get("fareDetailsBySegment", [{}])[0].get("fareBasis", "N/A") if traveler_pricings else "N/A"
        normalized.append(
            {
                "mode": "Flight",
                "route": f"{dep.get('iataCode', 'N/A')} → {arr.get('iataCode', 'N/A')}",
                "estimated_price": f"₹{offer.get('price', {}).get('total', 'N/A')}",
                "booking_tip": "Book this fare quickly if flexible cancellation is available.",
                "recommended_platforms": ["Amadeus Live Fare"],
                "airline": (validating_airline_codes[0] if validating_airline_codes else (segments[0].get("carrierCode") if segments else "N/A")),
                "stops": max(len(segments) - 1, 0),
                "departure_time": dep.get("at", "N/A"),
                "arrival_time": arr.get("at", "N/A"),
                "fare_basis": fare_basis,
                "is_best": offer.get("id") == best_id,
            }
        )
    return normalized, best_id


def _get_live_flights(origin: str, destination: str, departure_date: str, token: str) -> List[Dict[str, Any]]:
    origin_code = _resolve_iata_code(origin, token)
    destination_code = _resolve_iata_code(destination, token)
    if not origin_code or not destination_code:
        return []

    url = f"{AMADEUS_BASE_URL}/v2/shopping/flight-offers"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "originLocationCode": origin_code,
        "destinationLocationCode": destination_code,
        "departureDate": departure_date,
        "adults": 1,
        "max": 8,
        "currencyCode": "INR",
    }
    payload = _safe_get(url, headers, params)
    if not payload:
        return []
    offers = payload.get("data", [])
    normalized, _ = _pick_best_flight(offers)
    return normalized


def _get_live_hotels(destination: str, token: str) -> List[Dict[str, Any]]:
    city_code = _resolve_iata_code(destination, token)
    if not city_code:
        return []

    hotel_lookup_url = f"{AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city"
    headers = {"Authorization": f"Bearer {token}"}
    lookup_payload = _safe_get(hotel_lookup_url, headers, {"cityCode": city_code})
    if not lookup_payload or not lookup_payload.get("data"):
        return []

    hotel_ids = [item.get("hotelId") for item in lookup_payload["data"][:8] if item.get("hotelId")]
    if not hotel_ids:
        return []

    offers_url = f"{AMADEUS_BASE_URL}/v3/shopping/hotel-offers"
    offers_payload = _safe_get(offers_url, headers, {"hotelIds": ",".join(hotel_ids)})
    if not offers_payload:
        return []

    normalized: List[Dict[str, Any]] = []
    for item in (offers_payload.get("data") or [])[:5]:
        hotel = item.get("hotel", {})
        offers = item.get("offers") or []
        offer = offers[0] if offers else {}
        price = offer.get("price", {})
        board_type = offer.get("boardType", "N/A")
        check_in = offer.get("checkInDate", "N/A")
        check_out = offer.get("checkOutDate", "N/A")
        room_info = offer.get("room", {})
        room_type = room_info.get("typeEstimated", {}).get("category", "N/A")
        normalized.append(
            {
                "name": hotel.get("name", "Hotel"),
                "rating": str(hotel.get("rating", "N/A")),
                "price_per_night": f"₹{price.get('total', 'N/A')}",
                "description": f"{hotel.get('name', 'Hotel')} in {destination}",
                "booking_tip": "Compare refundable and non-refundable rates before booking.",
                "source": "Amadeus Live Hotel Offers",
                "check_in": check_in,
                "check_out": check_out,
                "board_type": board_type,
                "room_type": room_type,
            }
        )
    return normalized


def _get_osm_hotels(destination: str) -> List[Dict[str, Any]]:
    try:
        geo_resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": destination, "format": "json", "limit": 1},
            headers=HTTP_HEADERS,
            timeout=15,
        )
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        if not geo_data:
            return []

        lat = float(geo_data[0]["lat"])
        lon = float(geo_data[0]["lon"])

        overpass_query = f"""
        [out:json][timeout:25];
        (
          node["tourism"="hotel"](around:7000,{lat},{lon});
          way["tourism"="hotel"](around:7000,{lat},{lon});
          relation["tourism"="hotel"](around:7000,{lat},{lon});
        );
        out center 15;
        """
        overpass_resp = requests.post(
            "https://overpass-api.de/api/interpreter",
            data=overpass_query,
            headers=HTTP_HEADERS,
            timeout=25,
        )
        overpass_resp.raise_for_status()
        payload = overpass_resp.json()
        elements = payload.get("elements", [])
        if not elements:
            return []

        hotels: List[Dict[str, Any]] = []
        seen_names = set()
        for item in elements:
            tags = item.get("tags", {})
            name = tags.get("name")
            if not name or name in seen_names:
                continue
            seen_names.add(name)
            stars = tags.get("stars", "N/A")
            addr = tags.get("addr:street") or tags.get("addr:suburb") or destination
            hotels.append(
                {
                    "name": name,
                    "rating": str(stars),
                    "price_per_night": "Check live OTA",
                    "description": f"Real hotel listing near {addr}",
                    "booking_tip": "Compare rates on MakeMyTrip, Booking.com, and Agoda.",
                    "source": "OpenStreetMap Live",
                }
            )
            if len(hotels) >= 8:
                break
        return hotels
    except Exception:
        return []


def _get_curated_real_hotels(destination: str) -> List[Dict[str, Any]]:
    key = (destination or "").strip().lower()
    entries = CURATED_REAL_HOTELS.get(key)
    if not entries:
        return []
    return [
        {
            "name": name,
            "rating": rating,
            "price_per_night": "Check live OTA",
            "description": f"Popular real hotel in {area}",
            "booking_tip": "Compare weekday and weekend rates before booking.",
            "source": "Curated Real Hotels",
        }
        for name, rating, area in entries
    ]


def _normalize_rapidapi_rows(
    rows: List[Dict[str, Any]],
    origin: str,
    destination: str,
    mode: str,
) -> List[Dict[str, Any]]:
    normalized = []
    for row in rows[:8]:
        operator_name = _pick_value(row, ["operator", "operator.name", "name", "agency", "provider"], mode)
        dep = _pick_value(row, ["departure_time", "departure", "departTime", "departure.time", "origin.dep_time"])
        arr = _pick_value(row, ["arrival_time", "arrival", "arrivalTime", "arrival.time", "destination.arr_time"])
        fare = _pick_value(row, ["price", "fare", "ticket_price", "fare.amount", "price.total"])
        route = _pick_value(row, ["route", "route_name"], f"{origin} → {destination}")
        duration = _pick_value(row, ["duration", "travel_time", "eta"], "N/A")
        seats = _pick_value(row, ["available_seats", "seatsAvailable", "availability"], "N/A")
        vehicle_type = _pick_value(row, ["class", "coach_type", "bus_type", "train_type"], "N/A")

        normalized.append(
            {
                "mode": mode,
                "route": route,
                "estimated_price": f"₹{fare}" if fare != "N/A" else "N/A",
                "booking_tip": f"Check cancellation policy before confirming {mode.lower()} ticket.",
                "recommended_platforms": [operator_name],
                "departure": dep,
                "arrival": arr,
                "duration": duration,
                "available_seats": seats,
                "vehicle_type": vehicle_type,
            }
        )
    return normalized


def _get_rapidapi_transport(
    url: Optional[str],
    host: Optional[str],
    items_path: str,
    origin: str,
    destination: str,
    departure_date: str,
    mode: str,
) -> List[Dict[str, Any]]:
    if not RAPIDAPI_KEY or not url or not host:
        return []
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": host,
    }
    params = {
        "origin": origin,
        "destination": destination,
        "date": departure_date,
    }
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        payload = resp.json()
        rows = _coerce_items(payload, items_path)
        if not rows:
            return []
        return _normalize_rapidapi_rows(rows, origin, destination, mode)
    except Exception:
        return []


def get_live_travel_data(
    destination: str,
    days: int,
    origin: str = "New Delhi",
    departure_date: Optional[str] = None,
) -> Dict[str, Any]:
    dep_date = departure_date or (date.today() + timedelta(days=21)).isoformat()
    result = {
        "hotel_suggestions": [],
        "transport_options": [],
        "live_data_notes": [],
    }

    token = _get_amadeus_token()
    if token:
        result["hotel_suggestions"] = _get_live_hotels(destination, token)
        result["transport_options"].extend(_get_live_flights(origin, destination, dep_date, token))
    else:
        result["live_data_notes"].append("Amadeus API keys missing/invalid. Add AMADEUS_API_KEY and AMADEUS_API_SECRET.")

    if not result["hotel_suggestions"]:
        osm_hotels = _get_osm_hotels(destination)
        if osm_hotels:
            result["hotel_suggestions"] = osm_hotels
            result["live_data_notes"].append("Hotels sourced from OpenStreetMap live data.")
    if not result["hotel_suggestions"]:
        curated_hotels = _get_curated_real_hotels(destination)
        if curated_hotels:
            result["hotel_suggestions"] = curated_hotels
            result["live_data_notes"].append("Hotels sourced from curated real hotel database for this destination.")
        else:
            result["live_data_notes"].append("No live hotels found from Amadeus/OpenStreetMap, and no curated entries for this destination.")

    train_options = _get_rapidapi_transport(
        TRAIN_API_URL,
        TRAIN_API_HOST,
        TRAIN_ITEMS_PATH,
        origin,
        destination,
        dep_date,
        "Train",
    )
    bus_options = _get_rapidapi_transport(
        BUS_API_URL,
        BUS_API_HOST,
        BUS_ITEMS_PATH,
        origin,
        destination,
        dep_date,
        "Bus",
    )
    result["transport_options"].extend(train_options)
    result["transport_options"].extend(bus_options)

    if not train_options:
        result["live_data_notes"].append("Train API not configured or schema mismatch. Verify TRAIN_API_URL, TRAIN_API_HOST, TRAIN_ITEMS_PATH, and RAPIDAPI_KEY.")
    if not bus_options:
        result["live_data_notes"].append("Bus API not configured or schema mismatch. Verify BUS_API_URL, BUS_API_HOST, BUS_ITEMS_PATH, and RAPIDAPI_KEY.")

    return result
