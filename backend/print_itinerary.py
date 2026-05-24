from pymongo import MongoClient
import json
from bson import ObjectId

import sys
import codecs
sys.stdout.reconfigure(encoding='utf-8')

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super(JSONEncoder, self).default(o)

def print_itinerary():
    try:
        client = MongoClient("mongodb://localhost:27017")
        db = client.trip_planner
        bookings_col = db.bookings
        
        booking = bookings_col.find_one({"destination": "rishikesh"})
        
        if not booking:
            print("No booking for Rishikesh found.")
            return
            
        trip_data = booking.get("trip_data")
        if not trip_data:
            print("No trip_data itinerary saved inside this booking record.")
            return
            
        print("=" * 60)
        print(f"TRIP TITLE: {trip_data.get('trip_title')}")
        print(f"DESTINATION: {trip_data.get('destination')}")
        print(f"DURATION: {trip_data.get('duration')} Days")
        print("=" * 60)
        
        itinerary = trip_data.get("itinerary", [])
        for day in itinerary:
            print(f"\nDAY {day.get('day')}: {day.get('theme')}")
            print("-" * 40)
            for act in day.get("activities", []):
                print(f"  [{act.get('time')}] {act.get('title')}")
                print(f"    Description : {act.get('description')}")
                print(f"    Cost        : {act.get('estimated_cost')}")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print_itinerary()
