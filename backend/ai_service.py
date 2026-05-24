import os
from dotenv import load_dotenv
import json
import google.generativeai as genai
from travel_live_service import get_live_travel_data

load_dotenv()

# Configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

# Use the latest model name
MODEL_NAME = 'gemini-1.5-flash-latest'


async def generate_itinerary(
    destination: str,
    days: int,
    budget: str,
    travel_type: str,
    interests: str,
    origin_city: str = "None",
    start_date: str = None,
    daily_plans: list = None,
):
    """
    Calls the Gemini API to generate a structured JSON itinerary.
    """
    
    daily_plans_prompt = ""
    if daily_plans:
        daily_plans_prompt = "\nThe user has requested the following plans/focus for each day. You MUST design the activities for each corresponding day to include these plans/focus:\n"
        for i, plan in enumerate(daily_plans):
            if plan and plan.strip():
                daily_plans_prompt += f"- Day {i+1}: {plan.strip()}\n"

    prompt = f"""
    You are an expert AI Travel Planner. Create a detailed {days}-day itinerary for a trip to {destination}.
    The user's budget is {budget}.
    The travel type is {travel_type}.
    Their interests include: {interests}.
    Your role is a practical travel agent who helps users book transport and hotels with realistic choices.
    {daily_plans_prompt}
    Please provide the output strictly as a JSON object matching the following structure without any markdown blocks or backticks:
    {{
      "trip_title": "A catchy title for the trip",
      "destination": "{destination}",
      "duration": {days},
      "budget": "{budget}",
      "summary": "A brief summary of the trip.",
      "itinerary": [
        {{
          "day": 1,
          "theme": "Theme for the day",
          "activities": [
            {{
              "time": "09:00 AM",
              "title": "Activity Name",
              "description": "Details about the activity.",
              "estimated_cost": "Estimated cost strictly in INR (₹)"
            }}
          ]
        }}
      ],
      "hotel_suggestions": [
        {{
          "name": "Hotel Name",
          "rating": "4.5",
          "price_per_night": "Approx price",
          "description": "Brief description",
          "booking_tip": "Best area/platform/time to book this hotel"
        }}
      ],
      "transport_options": [
        {{
          "mode": "Flight/Train/Bus/Local Taxi/Metro",
          "route": "Origin to destination route or local route",
          "estimated_price": "Approx price in INR (₹)",
          "booking_tip": "How to book smartly and save money",
          "recommended_platforms": ["Platform 1", "Platform 2"]
        }}
      ],
      "food_recommendations": {{
        "traditional_dishes": [
          {{
            "dish": "Dish name",
            "why_try": "Why this is special at destination",
            "best_area_to_try": "Best area/market"
          }}
        ],
        "famous_food_spots": [
          {{
            "name": "Food street/restaurant name",
            "must_try": "Signature item",
            "estimated_cost_for_two": "Approx cost in INR (₹)"
          }}
        ]
      }},
      "booking_action_plan": [
        "Step 1 to book transport",
        "Step 2 to reserve hotel",
        "Step 3 to confirm local travel"
      ]
    }}
    
    Rules:
    - Keep output realistic and actionable for an Indian traveler.
    - Include at least 3 transport options when possible.
    - Include at least 5 traditional dishes.
    - Include at least 4 famous food spots.
    - Keep all costs in INR (₹).
    Ensure the response is ONLY valid JSON.
    """
    
    if not API_KEY:
        # Return mock data if no Gemini API key is provided
        base_data = get_mock_itinerary(destination, days, budget, daily_plans)
        live_data = get_live_travel_data(destination=destination, days=days, origin=origin_city, departure_date=start_date)
        return merge_live_data(base_data, live_data)
        
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        # Clean up the response if the model returned markdown code blocks
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        base_data = json.loads(result_text)
        live_data = get_live_travel_data(destination=destination, days=days, origin=origin_city, departure_date=start_date)
        return merge_live_data(base_data, live_data)
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        # Fallback to mock data on error for robustness during dev
        base_data = get_mock_itinerary(destination, days, budget, daily_plans)
        live_data = get_live_travel_data(destination=destination, days=days, origin=origin_city, departure_date=start_date)
        return merge_live_data(base_data, live_data)


def merge_live_data(base_data, live_data):
    if not isinstance(base_data, dict):
        base_data = {}

    if live_data.get("hotel_suggestions"):
        base_data["hotel_suggestions"] = live_data["hotel_suggestions"]

    current_transport = base_data.get("transport_options", [])
    live_transport = live_data.get("transport_options", [])
    if live_transport:
        base_data["transport_options"] = live_transport + current_transport

    base_data["live_data_notes"] = live_data.get("live_data_notes", [])
    return base_data

def get_mock_itinerary(destination, days, budget, daily_plans=None):
    """Fallback mock data for development without API key"""
    itinerary = []
    for d in range(1, days + 1):
        plan_text = ""
        if daily_plans and len(daily_plans) >= d and daily_plans[d-1]:
            plan_text = f" User requested: {daily_plans[d-1]}."
        
        theme = f"Explore {destination} - Day {d}" if not plan_text else f"Focus on {daily_plans[d-1]}"
        itinerary.append({
          "day": d,
          "theme": theme,
          "activities": [
            {
              "time": "09:00 AM",
              "title": f"Visit attractions in {destination}",
              "description": f"Enjoy your day in {destination}.{plan_text}",
              "estimated_cost": "₹1500"
            },
            {
              "time": "03:00 PM",
              "title": "Local sightseeing & dining",
              "description": f"Discover scenic view spots and local cuisines in {destination}.",
              "estimated_cost": "₹800"
            }
          ]
        })
        
    return {
      "trip_title": f"Mock Trip to {destination}",
      "destination": destination,
      "duration": days,
      "budget": budget,
      "summary": "This is a mock itinerary customized with your daily preferences.",
      "itinerary": itinerary,
      "hotel_suggestions": [
        {
          "name": f"Grand {destination} Hotel",
          "rating": "4.0",
          "price_per_night": "₹8000",
          "description": "A nice place to stay.",
          "booking_tip": "Book 3-4 weeks early for the best rates in central districts."
        }
      ],
      "transport_options": [
        {
          "mode": "Flight",
          "route": f"Major Indian city to {destination}",
          "estimated_price": "₹7,000 - ₹22,000",
          "booking_tip": "Compare early morning flights and set fare alerts 3 weeks ahead.",
          "recommended_platforms": ["Skyscanner", "MakeMyTrip"]
        },
        {
          "mode": "Train",
          "route": f"Nearest rail hub to {destination}",
          "estimated_price": "₹1,200 - ₹4,500",
          "booking_tip": "Book Tatkal only if regular quota is sold out; prefer 2AC for comfort.",
          "recommended_platforms": ["IRCTC", "ConfirmTkt"]
        },
        {
          "mode": "Local Transport",
          "route": f"Within {destination}",
          "estimated_price": "₹500 - ₹2,000 per day",
          "booking_tip": "Use metro/day passes where available and book app cabs during off-peak hours.",
          "recommended_platforms": ["Uber", "Local Metro App"]
        }
      ],
      "food_recommendations": {
        "traditional_dishes": [
          {
            "dish": "Regional Thali",
            "why_try": "Best way to taste the destination's complete flavor profile.",
            "best_area_to_try": "Old city market area"
          },
          {
            "dish": "Signature Street Chaat",
            "why_try": "Iconic local snack culture and authentic spice combinations.",
            "best_area_to_try": "Main street food lane"
          },
          {
            "dish": "Local Sweet Specialty",
            "why_try": "Traditional dessert recipe tied to local heritage.",
            "best_area_to_try": "Historic sweet shops district"
          },
          {
            "dish": "Regional Breakfast Dish",
            "why_try": "Authentic morning flavors locals actually eat daily.",
            "best_area_to_try": "Neighborhood breakfast hubs"
          },
          {
            "dish": "Festival Special Dish",
            "why_try": "Unique seasonal preparation and cultural relevance.",
            "best_area_to_try": "Temple or celebration markets"
          }
        ],
        "famous_food_spots": [
          {
            "name": "Heritage Food Street",
            "must_try": "Mixed local platter",
            "estimated_cost_for_two": "₹900"
          },
          {
            "name": "Old Town Spice House",
            "must_try": "House-style regional curry",
            "estimated_cost_for_two": "₹1,300"
          },
          {
            "name": "Night Market Bites",
            "must_try": "Grilled street specialties",
            "estimated_cost_for_two": "₹700"
          },
          {
            "name": "Classic Family Restaurant",
            "must_try": "Traditional set meal",
            "estimated_cost_for_two": "₹1,500"
          }
        ]
      },
      "booking_action_plan": [
        "Lock intercity transport first based on your final dates.",
        "Reserve hotel in a central neighborhood near top attractions.",
        "Pre-book airport/railway transfer to avoid peak pricing.",
        "Save all confirmation tickets in one folder for easy access during travel."
      ]
    }
