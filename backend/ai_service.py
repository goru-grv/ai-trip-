import os
from dotenv import load_dotenv
import json
import google.generativeai as genai
from travel_live_service import get_live_travel_data, attach_day_wise_hotels

load_dotenv()

# Configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

# Use the latest model name
MODEL_NAME = 'gemini-2.5-flash'


async def generate_itinerary(
    destination: str,
    days: int,
    budget: str,
    travel_type: str,
    interests: str,
    origin_city: str = "None",
    start_date: str = None,
):
    """
    Calls the Gemini API to generate a structured JSON itinerary.
    """
    
    prompt = f"""
    You are an expert AI Travel Planner. Create a detailed {days}-day itinerary for a trip to {destination}.
    The user's budget is {budget}.
    The travel type is {travel_type}.
    Their interests include: {interests}.
    Your role is a practical travel agent who helps users book transport and hotels with realistic choices.
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
          "optimized_route_summary": "Description of route layout for the day to avoid backtracking, indicating direction and connections.",
          "weather_prep": "Weather advice for this day's destinations (e.g. carry umbrella, wear walking shoes).",
          "safety_tips": "Local safety warnings or tips for this specific day's areas.",
          "budget_tips": "How to save money during this day's activities/transit.",
          "time_slots": [
            {{
              "slot": "Morning",
              "place_name": "Specific morning place/attraction name",
              "why_it_matters": "Historical, cultural significance or why the place is interesting",
              "activity": "Detailed activity/thing to do at the place",
              "travel_time_from_previous": "Estimated transit duration (e.g., 20 mins) and direction from the previous location/hotel",
              "transport_suggestion": "Practical local transit mode (e.g., Metro Line X, Uber, Local Bus 123)",
              "map_link": "Google Maps search link, e.g., https://www.google.com/maps/search/?api=1&query=Place+Name+Destination",
              "photo_point": "Highly descriptive point for taking the best photo (e.g., Eastern gate during sunrise)",
              "best_visiting_time": "Exact recommended timing (e.g., 8:00 AM - 10:00 AM)",
              "food_spot": "Highly recommended food joint/stall/cafe nearby",
              "local_dishes": "Specific traditional dishes/items to try at this food spot"
            }},
            {{
              "slot": "Afternoon",
              "place_name": "Specific afternoon place/attraction name",
              "why_it_matters": "Historical, cultural significance or why the place is interesting",
              "activity": "Detailed activity/thing to do at the place",
              "travel_time_from_previous": "Estimated transit duration (e.g., 20 mins) and direction from the morning location",
              "transport_suggestion": "Practical local transit mode",
              "map_link": "Google Maps search link",
              "photo_point": "Point for taking the best photo",
              "best_visiting_time": "Exact recommended timing",
              "food_spot": "Highly recommended food joint/stall/cafe nearby",
              "local_dishes": "Specific traditional dishes/items to try"
            }},
            {{
              "slot": "Evening",
              "place_name": "Specific evening place/attraction name",
              "why_it_matters": "Historical, cultural significance or why the place is interesting",
              "activity": "Detailed activity/thing to do at the place",
              "travel_time_from_previous": "Estimated transit duration and direction from the afternoon location",
              "transport_suggestion": "Practical local transit mode",
              "map_link": "Google Maps search link",
              "photo_point": "Point for taking the best photo",
              "best_visiting_time": "Exact recommended timing",
              "food_spot": "Highly recommended food joint/stall/cafe nearby",
              "local_dishes": "Specific traditional dishes/items to try"
            }},
            {{
              "slot": "Night",
              "place_name": "Specific night place/attraction name",
              "why_it_matters": "Historical, cultural significance or why the place is interesting",
              "activity": "Detailed activity/thing to do at the place",
              "travel_time_from_previous": "Estimated transit duration and direction from the evening location",
              "transport_suggestion": "Practical local transit mode",
              "map_link": "Google Maps search link",
              "photo_point": "Point for taking the best photo",
              "best_visiting_time": "Exact recommended timing",
              "food_spot": "Highly recommended food joint/stall/cafe nearby",
              "local_dishes": "Specific traditional dishes/items to try"
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
        base_data = get_mock_itinerary(destination, days, budget)
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
        base_data = get_mock_itinerary(destination, days, budget)
        live_data = get_live_travel_data(destination=destination, days=days, origin=origin_city, departure_date=start_date)
        return merge_live_data(base_data, live_data)


def merge_live_data(base_data, live_data):
    if not isinstance(base_data, dict):
        base_data = {}

    destination = base_data.get("destination", "Jaipur")
    budget = base_data.get("budget", "Medium")

    itinerary = base_data.get("itinerary", [])
    if itinerary:
        base_data["itinerary"] = attach_day_wise_hotels(itinerary, destination, budget)

    current_transport = base_data.get("transport_options", [])
    live_transport = live_data.get("transport_options", [])
    if live_transport:
        base_data["transport_options"] = live_transport + current_transport

    base_data["live_data_notes"] = live_data.get("live_data_notes", [])
    return base_data

def get_mock_itinerary(destination, days, budget):
    """Fallback mock data for development without API key"""
    itinerary = []
    for d in range(1, days + 1):
        theme = f"Explore {destination} - Day {d}"
        itinerary.append({
          "day": d,
          "theme": theme,
          "optimized_route_summary": f"Morning city tour heading south to local markets, concluding with an evening lakeside walk to avoid backtracking.",
          "weather_prep": "Wear lightweight, breathable clothing, apply sunscreen, and carry a water bottle.",
          "safety_tips": "Keep your personal items secure in crowded market areas and use official pre-paid transport.",
          "budget_tips": "Purchase a day pass for public transit to save on individual fare costs.",
          "time_slots": [
            {
              "slot": "Morning",
              "place_name": f"Historic {destination} Center",
              "why_it_matters": "The cultural epicenter featuring ancient architecture and rich community history.",
              "activity": "Explore architectural wonders, taking in the historical significance and cultural artifacts.",
              "travel_time_from_previous": "Departing from hotel: 15 mins via subway",
              "transport_suggestion": "Subway Line A or official taxi",
              "map_link": f"https://www.google.com/maps/search/?api=1&query={destination}+Historic+Center",
              "photo_point": "Near the central pavilion at sunrise for the best warm lighting.",
              "best_visiting_time": "08:30 AM - 11:00 AM",
              "food_spot": "Central Heritage Tea House",
              "local_dishes": "Signature Spice Tea, Steamed Dumplings"
            },
            {
              "slot": "Afternoon",
              "place_name": f"Grand {destination} Bazaar",
              "why_it_matters": "A vibrant marketplace functioning as the local commerce and culinary hub.",
              "activity": "Walk through colorful stalls, purchase authentic souvenirs, and interact with local weavers.",
              "travel_time_from_previous": "10 mins walk from Historic Center",
              "transport_suggestion": "Walking route along central boulevard",
              "map_link": f"https://www.google.com/maps/search/?api=1&query={destination}+Grand+Bazaar",
              "photo_point": "Second-floor balcony overlooking the bazaar corridors for a wide busy scene.",
              "best_visiting_time": "12:30 PM - 03:00 PM",
              "food_spot": "Bazaar Spices Kitchen",
              "local_dishes": "Traditional Regional Thali, Local Street Chaat"
            },
            {
              "slot": "Evening",
              "place_name": f"{destination} Scenic Lakefront",
              "why_it_matters": "A peaceful natural retreat where locals gather to relax during sunset.",
              "activity": "Take a scenic boat tour on the lake, enjoying the cool evening breeze and city skyline.",
              "travel_time_from_previous": "20 mins auto-rickshaw from Bazaar",
              "transport_suggestion": "Auto-rickshaw or local bus",
              "map_link": f"https://www.google.com/maps/search/?api=1&query={destination}+Lakefront",
              "photo_point": "Lakeside dock during sunset to capture reflection of the orange sky on water.",
              "best_visiting_time": "05:00 PM - 07:00 PM",
              "food_spot": "Lakeside Sunset Bistro",
              "local_dishes": "Grilled Fish, Lemon Soda"
            },
            {
              "slot": "Night",
              "place_name": f"{destination} Night Market",
              "why_it_matters": "Famous for its energetic street food atmosphere and glowing neon stalls.",
              "activity": "Indulge in night snacks, enjoy street music performances, and sample desserts.",
              "travel_time_from_previous": "10 mins walk from Lakefront",
              "transport_suggestion": "Walking via lakeside path",
              "map_link": f"https://www.google.com/maps/search/?api=1&query={destination}+Night+Market",
              "photo_point": "Under the main glowing neon archway at the market entrance.",
              "best_visiting_time": "08:30 PM - 10:30 PM",
              "food_spot": "Heritage Sweets & Snacks",
              "local_dishes": "Signature Sweet Specialty, Grilled Street Skewers"
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
