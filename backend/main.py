from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from ai_service import generate_itinerary
import os
from dotenv import load_dotenv
from uuid import uuid4
from datetime import datetime
import re

load_dotenv()

app = FastAPI(title="AI Trip Planner API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only. Should be restricted in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TripRequest(BaseModel):
    budget: str
    destination: str
    number_of_days: int
    travel_type: str
    interests: str
    origin_city: Optional[str] = "New Delhi"
    start_date: Optional[str] = None


class BookingItem(BaseModel):
    item_type: str
    name: str
    price: str
    details: Optional[str] = None


class CheckoutRequest(BaseModel):
    user_email: str
    destination: str
    payment_method: str
    cart_items: List[BookingItem]

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Trip Planner API"}

@app.post("/api/generate-trip")
async def create_trip(request: TripRequest):
    try:
        # Call Gemini AI to generate the trip
        itinerary = await generate_itinerary(
            destination=request.destination,
            days=request.number_of_days,
            budget=request.budget,
            travel_type=request.travel_type,
            interests=request.interests,
            origin_city=request.origin_city or "New Delhi",
            start_date=request.start_date
        )
        return {"status": "success", "data": itinerary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _extract_inr(value: str) -> int:
    digits = re.sub(r"[^\d]", "", value or "")
    if not digits:
        return 0
    return int(digits)


@app.post("/api/checkout")
async def checkout_booking(request: CheckoutRequest):
    try:
        if not request.cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        total_amount = sum(_extract_inr(item.price) for item in request.cart_items)
        booking_reference = f"VLR-{uuid4().hex[:10].upper()}"

        tickets = []
        for item in request.cart_items:
            ticket_id = f"TKT-{uuid4().hex[:8].upper()}"
            tickets.append(
                {
                    "ticket_id": ticket_id,
                    "item_type": item.item_type,
                    "name": item.name,
                    "status": "Booked",
                    "details": item.details,
                }
            )

        return {
            "status": "success",
            "message": "Payment successful. All selected tickets booked by agent.",
            "booking_reference": booking_reference,
            "paid_amount_inr": total_amount,
            "currency": "INR",
            "booked_at": datetime.utcnow().isoformat() + "Z",
            "tickets": tickets,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
