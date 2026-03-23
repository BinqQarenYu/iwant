import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

async def seed_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["kaintayo"]
    
    print("Clearing old mock data...")
    await db.restaurants.delete_many({"owner_id": "system"})
    
    restaurants_data = [
        {
            "id": str(uuid.uuid4()),
            "owner_id": "system",
            "name": "Mang Tomas Ihaw-Ihaw",
            "description": "Authentic Filipino grilled dishes. Best isaw and BBQ in Urdaneta!",
            "cuisine_type": "street_food",
            "address": "McArthur Highway, Urdaneta City",
            "area": "Urdaneta City",
            "lat": 15.9785,
            "lng": 120.5723,
            "phone": "09171234567",
            "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
            "is_open": True,
            "is_approved": True,
            "rating": 4.5,
            "total_reviews": 128,
            "delivery_fee": 30.0,
            "min_order": 100.0,
            "estimated_delivery_time": "25-35 mins",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "owner_id": "system",
            "name": "Aling Nena's Carinderia",
            "description": "Home-cooked Filipino meals just like lola used to make.",
            "cuisine_type": "filipino",
            "address": "Rizal St., Poblacion, Urdaneta City",
            "area": "Urdaneta City",
            "lat": 15.9761,
            "lng": 120.5711,
            "phone": "09181234567",
            "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
            "is_open": True,
            "is_approved": True,
            "rating": 4.8,
            "total_reviews": 256,
            "delivery_fee": 35.0,
            "min_order": 150.0,
            "estimated_delivery_time": "30-40 mins",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "owner_id": "system",
            "name": "Chicken Haus Urdaneta",
            "description": "Crispy fried chicken, wings, and chicken meals. Unli rice available!",
            "cuisine_type": "chicken",
            "address": "Nancayasan, Urdaneta City",
            "area": "Urdaneta City",
            "lat": 15.9812,
            "lng": 120.5689,
            "phone": "09191234567",
            "image_url": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800",
            "is_open": True,
            "is_approved": True,
            "rating": 4.3,
            "total_reviews": 89,
            "delivery_fee": 25.0,
            "min_order": 120.0,
            "estimated_delivery_time": "20-30 mins",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    print(f"Inserting {len(restaurants_data)} mock stores...")
    await db.restaurants.insert_many(restaurants_data)
    
    print("Populating menus...")
    menu_items_data = []
    mang_tomas_id = restaurants_data[0]["id"]
    menu_items_data.extend([
        {"id": str(uuid.uuid4()), "restaurant_id": mang_tomas_id, "name": "Pork BBQ (3 sticks)", "description": "Grilled pork skewers with special sauce", "price": 60.0, "category": "Grilled", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": mang_tomas_id, "name": "Chicken Isaw (5 sticks)", "description": "Grilled chicken intestines", "price": 50.0, "category": "Grilled", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()}
    ])
    
    aling_nena_id = restaurants_data[1]["id"]
    menu_items_data.extend([
        {"id": str(uuid.uuid4()), "restaurant_id": aling_nena_id, "name": "Sinigang na Baboy", "description": "Pork in sour tamarind soup", "price": 120.0, "category": "Soups", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": aling_nena_id, "name": "Chicken Adobo", "description": "Braised chicken in soy sauce and vinegar", "price": 95.0, "category": "Main", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()}
    ])
    
    chicken_id = restaurants_data[2]["id"]
    menu_items_data.extend([
        {"id": str(uuid.uuid4()), "restaurant_id": chicken_id, "name": "1pc Chicken with Rice", "description": "Crispy fried chicken with unlimited rice", "price": 99.0, "category": "Meals", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": chicken_id, "name": "Buffalo Wings (6pcs)", "description": "Spicy buffalo-style wings", "price": 129.0, "category": "Wings", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()}
    ])
    
    await db.menu_items.insert_many(menu_items_data)
    print("Database seeded successfully with mock stores!")

if __name__ == "__main__":
    asyncio.run(seed_data())
