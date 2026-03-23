import asyncio
import uuid
import random
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

async def seed_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["kaintayo"]
    
    print("Clearing old data...")
    await db.restaurants.delete_many({})
    await db.menu_items.delete_many({})
    await db.users.delete_many({"role": {"$in": ["rider", "customer", "restaurant_owner"]}})
    await db.rider_profiles.delete_many({})
    
    barangays = ["Poblacion", "Nancayasan", "San Vicente", "Camanang", "Pinmaludpod", "Dilan", "Bayaoas", "Camantiles", "Anonas", "Labit West", "Nancamaliran East", "Oltama"]
    first_names = ["Juan", "Pedro", "Maria", "Clarissa", "Jose", "Angel", "Mark", "Arnel", "Joana", "Maricel", "Roberto", "Lito", "Jun", "Bong", "Eddie", "Rose", "Nena", "Tomas", "Cardo", "Boy"]
    last_names = ["Dela Cruz", "Reyes", "Bautista", "Aquino", "Santos", "Garcia", "Torres", "Cruz", "Soriano", "Corpuz", "Mendoza", "Rosario", "Flores", "Ramos", "Perez"]
    cuisines = [
        ("street_food", "Street Food", "Tusok-tusok"),
        ("chicken", "Chicken", "Manok"),
        ("pork", "Pork", "Baboy"),
        ("seafood", "Seafood", "Seafood"),
        ("noodles", "Noodles", "Pancit"),
        ("desserts", "Desserts", "Panghimagas"),
        ("filipino", "Filipino Classic", "Lutong Bahay")
    ]
    
    images = [
        "1555939594-58d7cb561ad1", "1504674900247-0877df9cc836", "1626645738196-c2a7c87a8f58",
        "1569718212165-3a8278d5f624", "1599321329467-7be3840f23a3", "1528735602780-2552fd46c7af",
        "1546069901-ba6ba6cc1fb6", "1473093295043-cdd812d0e601", "1550547660-d9450f859349",
        "1481070555726-a28a3611a9f0", "1512485800-023ea2041d8d", "1493770348161-369560ae357d"
    ]

    print("Generating 50 Gold Standard Restaurants...")
    restaurants_data = []
    
    # Randomly generated lat/lng around Urdaneta coordinates: ~15.9761, 120.5711
    # Adding slight variations
    for i in range(50):
        name_choice = random.choice(first_names)
        last_choice = random.choice(last_names)
        bz_types = [
            f"Aling {name_choice}'s Eatery",
            f"Kuya {name_choice}'s Grill",
            f"{name_choice} & {last_choice} Resto",
            f"Casa {last_choice}",
            f"{name_choice}'s Sizzling Plate",
            f"{last_choice} Family Diner",
            f"Tito {name_choice}'s Pizzeria",
            f"Lola {name_choice}'s Carinderia"
        ]
        res_name = random.choice(bz_types)
        c_id, c_name, c_name_tl = random.choice(cuisines)
        bg = random.choice(barangays)
        lat = 15.9761 + random.uniform(-0.02, 0.02)
        lng = 120.5711 + random.uniform(-0.02, 0.02)
        img = random.choice(images)
        
        restaurants_data.append({
            "id": str(uuid.uuid4()),
            "owner_id": "system",
            "name": res_name,
            "description": f"The best {c_name.lower()} in {bg}, Urdaneta! Come and try our signature dishes cooked fresh daily.",
            "cuisine_type": c_id,
            "address": f"Near {bg} Hall, Urdaneta City",
            "area": "Urdaneta City",
            "lat": lat,
            "lng": lng,
            "phone": f"0917{random.randint(1000000, 9999999)}",
            "image_url": f"https://images.unsplash.com/photo-{img}?w=800",
            "is_open": True,
            "is_approved": True,
            "rating": round(random.uniform(4.0, 5.0), 1),
            "total_reviews": random.randint(10, 500),
            "delivery_fee": float(random.choice([25, 30, 35, 40, 50])),
            "min_order": float(random.choice([100, 150, 200])),
            "estimated_delivery_time": f"{random.randint(20, 35)}-{random.randint(40, 55)} mins",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
    await db.restaurants.insert_many(restaurants_data)
    
    print("Generating Gold Standard Menus for Restaurants...")
    menu_items = []
    for r in restaurants_data:
        # Give each restaurant 5 items
        for _ in range(5):
            menu_items.append({
                "id": str(uuid.uuid4()),
                "restaurant_id": r["id"],
                "name": f"Signature {r['cuisine_type'].title().replace('_', ' ')} Meal",
                "description": f"Our best selling {r['cuisine_type'].title().replace('_', ' ')} dish, made with love.",
                "price": float(random.randint(50, 350)),
                "category": "Main Dishes",
                "is_available": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    await db.menu_items.insert_many(menu_items)

    print("Generating 25 Gold Standard Riders...")
    riders_data = []
    rider_profiles = []
    for i in range(25):
        r_id = f"rider_{uuid.uuid4().hex[:12]}"
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        riders_data.append({
            "user_id": r_id,
            "email": f"rider{i}@kaintayo.mock",
            "name": f"{fname} {lname}",
            "picture": f"https://ui-avatars.com/api/?name={fname}+{lname}&background=FF6B00&color=fff",
            "role": "rider",
            "language": "en",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        rider_profiles.append({
            "id": str(uuid.uuid4()),
            "user_id": r_id,
            "vehicle_type": random.choice(["motorcycle", "tricycle"]),
            "plate_number": f"{random.choice(['ABC','XYZ','MNL'])}{random.randint(100,999)}",
            "is_online": True,
            "is_on_delivery": False,
            "current_order_id": None,
            "current_lat": 15.9761 + random.uniform(-0.02, 0.02),
            "current_lng": 120.5711 + random.uniform(-0.02, 0.02),
            "total_deliveries": random.randint(50, 1000),
            "total_earnings": random.randint(1000, 50000),
            "rating": round(random.uniform(4.5, 5.0), 1),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.users.insert_many(riders_data)
    await db.rider_profiles.insert_many(rider_profiles)

    print("Generating 50 Gold Standard Clients...")
    clients_data = []
    for i in range(50):
        c_id = f"user_{uuid.uuid4().hex[:12]}"
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        clients_data.append({
            "user_id": c_id,
            "email": f"client{i}@kaintayo.mock",
            "name": f"{fname} {lname}",
            "picture": f"https://ui-avatars.com/api/?name={fname}+{lname}&background=random",
            "role": "customer",
            "language": "en",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.users.insert_many(clients_data)
    
    print("Database seeded successfully with Gold Standard mock data!")

if __name__ == "__main__":
    asyncio.run(seed_data())
