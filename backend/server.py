from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent Auth URL
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Create the main app
app = FastAPI(title="KainTayo - The Sync Dashboard")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "customer"  # customer, rider, merchant, admin
    language: str = "en"
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoleSwitch(BaseModel):
    role: str

class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    name: str
    description: str
    cuisine_type: str
    address: str
    area: str = "Urdaneta City"
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: str
    image_url: Optional[str] = None
    is_open: bool = True
    is_approved: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    delivery_fee: float = 30.0
    min_order: float = 100.0
    estimated_delivery_time: str = "30-45 mins"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RestaurantCreate(BaseModel):
    name: str
    description: str
    cuisine_type: str
    address: str
    phone: str
    image_url: Optional[str] = None
    delivery_fee: float = 30.0
    min_order: float = 100.0

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None

class CartItem(BaseModel):
    menu_item_id: str
    quantity: int
    special_instructions: Optional[str] = None

class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    price: float
    quantity: int
    special_instructions: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: str
    restaurant_id: str
    restaurant_name: str
    rider_id: Optional[str] = None
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    discount: float = 0.0
    promo_code: Optional[str] = None
    total: float
    delivery_address: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    area: Optional[str] = None
    payment_method: str
    payment_status: str = "pending"
    order_status: str = "pending"  # pending, confirmed, preparing, ready, picked_up, delivered, cancelled
    special_instructions: Optional[str] = None
    estimated_delivery: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    ready_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

class OrderCreate(BaseModel):
    restaurant_id: str
    items: List[CartItem]
    delivery_address: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    area: Optional[str] = None
    payment_method: str
    promo_code: Optional[str] = None
    special_instructions: Optional[str] = None

class PabiliRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    customer_email: str
    rider_id: Optional[str] = None
    rider_name: Optional[str] = None
    items_list: str
    store_location: str
    delivery_address: str
    estimated_budget: float
    service_fee: float = 50.0
    actual_cost: Optional[float] = None
    total: Optional[float] = None
    payment_method: str
    payment_status: str = "pending"
    status: str = "pending"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PabiliCreate(BaseModel):
    items_list: str
    store_location: str
    delivery_address: str
    estimated_budget: float
    payment_method: str
    notes: Optional[str] = None

class RiderProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    vehicle_type: str  # motorcycle, tricycle
    plate_number: str
    is_online: bool = False
    is_on_delivery: bool = False
    current_order_id: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    total_deliveries: int = 0
    total_earnings: float = 0.0
    rating: float = 5.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_location_update: Optional[datetime] = None

class RiderProfileCreate(BaseModel):
    vehicle_type: str
    plate_number: str

class RiderLocationUpdate(BaseModel):
    lat: float
    lng: float

class PromoCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    description: str
    discount_type: str
    discount_value: float
    min_order: float = 0.0
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    usage_count: int = 0
    per_user_limit: int = 1
    valid_from: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    valid_until: Optional[datetime] = None
    is_active: bool = True
    applicable_areas: Optional[List[str]] = None
    first_order_only: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromoCodeCreate(BaseModel):
    code: str
    description: str
    discount_type: str
    discount_value: float
    min_order: float = 0.0
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    per_user_limit: int = 1
    valid_until: Optional[str] = None
    applicable_areas: Optional[List[str]] = None
    first_order_only: bool = False

class PromoCodeApply(BaseModel):
    code: str
    subtotal: float
    delivery_fee: float
    area: Optional[str] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from session token (cookie or header)"""
    session_token = None
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and credentials:
        session_token = credentials.credentials
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_optional_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user if authenticated, None otherwise"""
    try:
        return await get_current_user(request, credentials)
    except:
        return None

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    if not email or not session_token:
        raise HTTPException(status_code=401, detail="Invalid auth response")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "customer",  # Default role
            "language": "en",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Get updated user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    """Get current user profile"""
    return user

@api_router.put("/auth/profile")
async def update_profile(updates: dict, user = Depends(get_current_user)):
    """Update user profile"""
    allowed_fields = ["name", "address", "language", "phone"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user

@api_router.put("/auth/switch-role")
async def switch_role(data: RoleSwitch, user = Depends(get_current_user)):
    """Switch user role (for The Sync Dashboard)"""
    valid_roles = ["customer", "rider", "merchant", "admin"]
    if data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": data.role}})
    
    # If switching to rider, ensure rider profile exists
    if data.role == "rider":
        existing_profile = await db.rider_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if not existing_profile:
            # Create default rider profile
            profile = RiderProfile(user_id=user["user_id"], vehicle_type="motorcycle", plate_number="TBD")
            doc = profile.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.rider_profiles.insert_one(doc)
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out successfully"}

# ==================== RESTAURANT ROUTES ====================

@api_router.get("/restaurants")
async def get_restaurants(cuisine: Optional[str] = None, search: Optional[str] = None, area: Optional[str] = None):
    """Get all approved restaurants"""
    query = {"is_approved": True}
    if cuisine:
        query["cuisine_type"] = cuisine
    if area and area != "all":
        query["area"] = {"$regex": area, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"cuisine_type": {"$regex": search, "$options": "i"}}
        ]
    restaurants = await db.restaurants.find(query, {"_id": 0}).to_list(100)
    return restaurants

@api_router.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    """Get restaurant details with menu"""
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    menu = await db.menu_items.find({"restaurant_id": restaurant_id, "is_available": True}, {"_id": 0}).to_list(100)
    return {"restaurant": restaurant, "menu": menu}

@api_router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(data: RestaurantCreate, user = Depends(get_current_user)):
    """Create a new restaurant (for merchants)"""
    if user["role"] not in ["merchant", "admin"]:
        raise HTTPException(status_code=403, detail="Only merchants can create restaurants")
    
    restaurant = Restaurant(owner_id=user["user_id"], **data.model_dump())
    doc = restaurant.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.restaurants.insert_one(doc)
    return restaurant

@api_router.put("/restaurants/{restaurant_id}")
async def update_restaurant(restaurant_id: str, updates: dict, user = Depends(get_current_user)):
    """Update restaurant details"""
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant["owner_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["name", "description", "cuisine_type", "address", "phone", "image_url", 
                      "is_open", "delivery_fee", "min_order", "estimated_delivery_time"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    if update_data:
        await db.restaurants.update_one({"id": restaurant_id}, {"$set": update_data})
    return await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})

@api_router.get("/my-restaurant")
async def get_my_restaurant(user = Depends(get_current_user)):
    """Get restaurant owned by current user"""
    if user["role"] not in ["merchant", "admin"]:
        raise HTTPException(status_code=403, detail="Not a merchant")
    restaurant = await db.restaurants.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    return restaurant

# ==================== MENU ROUTES ====================

@api_router.post("/restaurants/{restaurant_id}/menu", response_model=MenuItem)
async def add_menu_item(restaurant_id: str, data: MenuItemCreate, user = Depends(get_current_user)):
    """Add menu item to restaurant"""
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant["owner_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    item = MenuItem(restaurant_id=restaurant_id, **data.model_dump())
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.menu_items.insert_one(doc)
    return item

@api_router.put("/menu/{item_id}")
async def update_menu_item(item_id: str, updates: dict, user = Depends(get_current_user)):
    """Update menu item"""
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    restaurant = await db.restaurants.find_one({"id": item["restaurant_id"]}, {"_id": 0})
    if restaurant["owner_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["name", "description", "price", "category", "image_url", "is_available"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    if update_data:
        await db.menu_items.update_one({"id": item_id}, {"$set": update_data})
    return await db.menu_items.find_one({"id": item_id}, {"_id": 0})

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, user = Depends(get_current_user)):
    """Delete menu item"""
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    restaurant = await db.restaurants.find_one({"id": item["restaurant_id"]}, {"_id": 0})
    if restaurant["owner_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.menu_items.delete_one({"id": item_id})
    return {"message": "Item deleted"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders", response_model=Order, status_code=201)
async def create_order(data: OrderCreate, user = Depends(get_current_user)):
    """Create a new order"""
    restaurant = await db.restaurants.find_one({"id": data.restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if not restaurant["is_open"]:
        raise HTTPException(status_code=400, detail="Restaurant is currently closed")
    
    # Build order items
    order_items = []
    subtotal = 0.0
    for cart_item in data.items:
        menu_item = await db.menu_items.find_one({"id": cart_item.menu_item_id}, {"_id": 0})
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {cart_item.menu_item_id} not found")
        if not menu_item["is_available"]:
            raise HTTPException(status_code=400, detail=f"{menu_item['name']} is not available")
        
        item_total = menu_item["price"] * cart_item.quantity
        subtotal += item_total
        order_items.append(OrderItem(
            menu_item_id=cart_item.menu_item_id,
            name=menu_item["name"],
            price=menu_item["price"],
            quantity=cart_item.quantity,
            special_instructions=cart_item.special_instructions
        ))
    
    if subtotal < restaurant["min_order"]:
        raise HTTPException(status_code=400, detail=f"Minimum order is ₱{restaurant['min_order']}")
    
    # Handle promo code
    discount = 0.0
    promo_code = None
    if data.promo_code:
        promo_code = data.promo_code.upper()
        promo = await db.promo_codes.find_one({"code": promo_code, "is_active": True}, {"_id": 0})
        if promo:
            discount_type = promo["discount_type"]
            discount_value = promo["discount_value"]
            if discount_type == "free_delivery":
                discount = restaurant["delivery_fee"]
            elif discount_type == "percentage":
                discount = subtotal * (discount_value / 100)
                if promo.get("max_discount"):
                    discount = min(discount, promo["max_discount"])
            elif discount_type == "fixed":
                discount = min(discount_value, subtotal + restaurant["delivery_fee"])
    
    total = subtotal + restaurant["delivery_fee"] - discount
    
    order = Order(
        customer_id=user["user_id"],
        customer_name=user["name"],
        customer_email=user["email"],
        customer_phone=user.get("phone"),
        restaurant_id=restaurant["id"],
        restaurant_name=restaurant["name"],
        items=order_items,
        subtotal=subtotal,
        delivery_fee=restaurant["delivery_fee"],
        discount=discount,
        promo_code=promo_code if discount > 0 else None,
        total=total,
        delivery_address=data.delivery_address,
        delivery_lat=data.delivery_lat,
        delivery_lng=data.delivery_lng,
        area=data.area or restaurant.get("area", "Urdaneta City"),
        payment_method=data.payment_method,
        special_instructions=data.special_instructions,
        estimated_delivery=restaurant["estimated_delivery_time"]
    )
    
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.orders.insert_one(doc)
    
    return order

@api_router.get("/orders")
async def get_orders(user = Depends(get_current_user), status: Optional[str] = None):
    """Get orders based on user role"""
    query = {}
    
    if user["role"] == "customer":
        query = {"customer_id": user["user_id"]}
    elif user["role"] == "merchant":
        restaurant = await db.restaurants.find_one({"owner_id": user["user_id"]}, {"_id": 0})
        if restaurant:
            query = {"restaurant_id": restaurant["id"]}
        else:
            return []
    elif user["role"] == "rider":
        # Show available orders (ready for pickup) or assigned orders
        query = {"$or": [
            {"rider_id": user["user_id"]},
            {"rider_id": None, "order_status": "ready"}
        ]}
    elif user["role"] == "admin":
        query = {}  # Admin sees all
    
    if status:
        query["order_status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user = Depends(get_current_user)):
    """Get order details"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user = Depends(get_current_user)):
    """Update order status"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    valid_statuses = ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status")
    
    update_data = {
        "order_status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Track timestamps
    if status == "confirmed":
        update_data["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    elif status == "ready":
        update_data["ready_at"] = datetime.now(timezone.utc).isoformat()
    elif status == "picked_up":
        update_data["picked_up_at"] = datetime.now(timezone.utc).isoformat()
    elif status == "delivered":
        update_data["delivered_at"] = datetime.now(timezone.utc).isoformat()
        # Update rider stats
        if order.get("rider_id"):
            await db.rider_profiles.update_one(
                {"user_id": order["rider_id"]},
                {
                    "$inc": {"total_deliveries": 1, "total_earnings": order["delivery_fee"]},
                    "$set": {"is_on_delivery": False, "current_order_id": None}
                }
            )
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    return await db.orders.find_one({"id": order_id}, {"_id": 0})

@api_router.put("/orders/{order_id}/assign-rider")
async def assign_rider(order_id: str, user = Depends(get_current_user)):
    """Rider accepts/assigns themselves to an order"""
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Only riders can accept orders")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("rider_id"):
        raise HTTPException(status_code=400, detail="Order already has a rider")
    
    update_data = {
        "rider_id": user["user_id"],
        "rider_name": user["name"],
        "rider_phone": user.get("phone"),
        "order_status": "picked_up" if order["order_status"] == "ready" else order["order_status"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Update rider profile
    await db.rider_profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"is_on_delivery": True, "current_order_id": order_id}}
    )
    
    return await db.orders.find_one({"id": order_id}, {"_id": 0})

# ==================== RIDER ROUTES ====================

@api_router.post("/rider/profile", response_model=RiderProfile)
async def create_rider_profile(data: RiderProfileCreate, user = Depends(get_current_user)):
    """Create rider profile"""
    existing = await db.rider_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Rider profile already exists")
    
    profile = RiderProfile(user_id=user["user_id"], **data.model_dump())
    doc = profile.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.rider_profiles.insert_one(doc)
    
    # Update user role to rider
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": "rider"}})
    
    return profile

@api_router.get("/rider/profile")
async def get_rider_profile(user = Depends(get_current_user)):
    """Get rider profile"""
    profile = await db.rider_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    return profile

@api_router.put("/rider/online")
async def toggle_rider_online(is_online: bool, user = Depends(get_current_user)):
    """Toggle rider online status"""
    await db.rider_profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"is_online": is_online}}
    )
    return {"is_online": is_online}

@api_router.put("/rider/location")
async def update_rider_location(data: RiderLocationUpdate, user = Depends(get_current_user)):
    """Update rider location"""
    await db.rider_profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "current_lat": data.lat,
            "current_lng": data.lng,
            "last_location_update": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"lat": data.lat, "lng": data.lng}

@api_router.get("/rider/earnings")
async def get_rider_earnings(user = Depends(get_current_user)):
    """Get rider earnings summary"""
    profile = await db.rider_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        return {"total_deliveries": 0, "total_earnings": 0}
    
    # Get today's deliveries
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = await db.orders.find({
        "rider_id": user["user_id"],
        "order_status": "delivered",
        "delivered_at": {"$gte": today_start.isoformat()}
    }, {"_id": 0}).to_list(100)
    
    today_earnings = sum(o.get("delivery_fee", 0) for o in today_orders)
    
    return {
        "total_deliveries": profile.get("total_deliveries", 0),
        "total_earnings": profile.get("total_earnings", 0),
        "today_deliveries": len(today_orders),
        "today_earnings": today_earnings,
        "rating": profile.get("rating", 5.0)
    }

@api_router.get("/riders/all")
async def get_all_riders(user = Depends(get_current_user)):
    """Get all riders (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    riders = await db.rider_profiles.find({}, {"_id": 0}).to_list(500)
    
    # Enrich with user data
    enriched_riders = []
    for rider in riders:
        rider_user = await db.users.find_one({"user_id": rider["user_id"]}, {"_id": 0})
        if rider_user:
            enriched_riders.append({
                **rider,
                "name": rider_user.get("name"),
                "email": rider_user.get("email"),
                "phone": rider_user.get("phone")
            })
    
    return enriched_riders

# ==================== PABILI ROUTES ====================

@api_router.post("/pabili", response_model=PabiliRequest, status_code=201)
async def create_pabili_request(data: PabiliCreate, user = Depends(get_current_user)):
    """Create a Pabili request"""
    pabili = PabiliRequest(
        customer_id=user["user_id"],
        customer_name=user["name"],
        customer_email=user["email"],
        items_list=data.items_list,
        store_location=data.store_location,
        delivery_address=data.delivery_address,
        estimated_budget=data.estimated_budget,
        payment_method=data.payment_method,
        notes=data.notes
    )
    
    doc = pabili.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.pabili_requests.insert_one(doc)
    
    return pabili

@api_router.get("/pabili")
async def get_pabili_requests(user = Depends(get_current_user)):
    """Get Pabili requests"""
    if user["role"] == "customer":
        query = {"customer_id": user["user_id"]}
    elif user["role"] == "rider":
        query = {"$or": [{"rider_id": user["user_id"]}, {"rider_id": None, "status": "pending"}]}
    elif user["role"] == "admin":
        query = {}
    else:
        query = {"customer_id": user["user_id"]}
    
    requests = await db.pabili_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return requests

@api_router.put("/pabili/{pabili_id}/accept")
async def accept_pabili(pabili_id: str, user = Depends(get_current_user)):
    """Rider accepts Pabili request"""
    if user["role"] != "rider":
        raise HTTPException(status_code=403, detail="Only riders can accept")
    
    pabili = await db.pabili_requests.find_one({"id": pabili_id}, {"_id": 0})
    if not pabili:
        raise HTTPException(status_code=404, detail="Not found")
    if pabili.get("rider_id"):
        raise HTTPException(status_code=400, detail="Already accepted")
    
    await db.pabili_requests.update_one({"id": pabili_id}, {"$set": {
        "rider_id": user["user_id"],
        "rider_name": user["name"],
        "status": "accepted",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.pabili_requests.find_one({"id": pabili_id}, {"_id": 0})

@api_router.put("/pabili/{pabili_id}/status")
async def update_pabili_status(pabili_id: str, status: str, user = Depends(get_current_user)):
    """Update Pabili status"""
    valid_statuses = ["pending", "accepted", "shopping", "delivering", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.pabili_requests.update_one({"id": pabili_id}, {"$set": {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.pabili_requests.find_one({"id": pabili_id}, {"_id": 0})

# ==================== ADMIN / OPS CENTER ====================

@api_router.get("/admin/analytics")
async def get_analytics(user = Depends(get_current_user)):
    """Get platform analytics"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({})
    total_restaurants = await db.restaurants.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_riders = await db.rider_profiles.count_documents({})
    online_riders = await db.rider_profiles.count_documents({"is_online": True})
    busy_riders = await db.rider_profiles.count_documents({"is_on_delivery": True})
    
    orders_pending = await db.orders.count_documents({"order_status": "pending"})
    orders_preparing = await db.orders.count_documents({"order_status": {"$in": ["confirmed", "preparing"]}})
    orders_ready = await db.orders.count_documents({"order_status": "ready"})
    orders_in_transit = await db.orders.count_documents({"order_status": "picked_up"})
    orders_delivered = await db.orders.count_documents({"order_status": "delivered"})
    
    # Revenue
    delivered_orders = await db.orders.find({"order_status": "delivered"}, {"_id": 0, "total": 1}).to_list(10000)
    total_revenue = sum(o.get("total", 0) for o in delivered_orders)
    
    return {
        "total_users": total_users,
        "total_restaurants": total_restaurants,
        "total_orders": total_orders,
        "total_riders": total_riders,
        "online_riders": online_riders,
        "busy_riders": busy_riders,
        "available_riders": online_riders - busy_riders,
        "orders_pending": orders_pending,
        "orders_preparing": orders_preparing,
        "orders_ready": orders_ready,
        "orders_in_transit": orders_in_transit,
        "orders_delivered": orders_delivered,
        "total_revenue": total_revenue
    }

@api_router.get("/admin/users")
async def get_all_users(user = Depends(get_current_user)):
    """Get all users"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/restaurants")
async def get_all_restaurants(user = Depends(get_current_user)):
    """Get all restaurants"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    return restaurants

@api_router.put("/admin/restaurants/{restaurant_id}/approve")
async def approve_restaurant(restaurant_id: str, is_approved: bool, user = Depends(get_current_user)):
    """Approve/reject restaurant"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    await db.restaurants.update_one({"id": restaurant_id}, {"$set": {"is_approved": is_approved}})
    return await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})

@api_router.get("/admin/live-orders")
async def get_live_orders(user = Depends(get_current_user)):
    """Get all active orders for War Room"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    active_statuses = ["pending", "confirmed", "preparing", "ready", "picked_up"]
    orders = await db.orders.find(
        {"order_status": {"$in": active_statuses}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    
    return orders

# ==================== PROMO CODES ====================

@api_router.post("/promo-codes", status_code=201)
async def create_promo_code(data: PromoCodeCreate, user = Depends(get_current_user)):
    """Create promo code (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.promo_codes.find_one({"code": data.code.upper()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    
    promo = PromoCode(code=data.code.upper(), **{k: v for k, v in data.model_dump().items() if k != 'code'})
    doc = promo.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["valid_from"] = doc["valid_from"].isoformat()
    if doc.get("valid_until"):
        doc["valid_until"] = doc["valid_until"].isoformat() if isinstance(doc["valid_until"], datetime) else doc["valid_until"]
    
    await db.promo_codes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/promo-codes")
async def get_promo_codes(user = Depends(get_current_user)):
    """Get all promo codes (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return await db.promo_codes.find({}, {"_id": 0}).to_list(100)

@api_router.get("/promo-codes/active")
async def get_active_promos():
    """Get active promos for customers"""
    promos = await db.promo_codes.find({"is_active": True}, {"_id": 0}).to_list(20)
    return [{"code": p["code"], "description": p["description"], "discount_type": p["discount_type"], 
             "discount_value": p["discount_value"], "min_order": p.get("min_order", 0),
             "first_order_only": p.get("first_order_only", False)} for p in promos]

@api_router.post("/promo-codes/validate")
async def validate_promo(data: PromoCodeApply, user = Depends(get_current_user)):
    """Validate promo code"""
    promo = await db.promo_codes.find_one({"code": data.code.upper(), "is_active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    if data.subtotal < promo.get("min_order", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order ₱{promo['min_order']} required")
    
    discount = 0.0
    if promo["discount_type"] == "free_delivery":
        discount = data.delivery_fee
    elif promo["discount_type"] == "percentage":
        discount = data.subtotal * (promo["discount_value"] / 100)
        if promo.get("max_discount"):
            discount = min(discount, promo["max_discount"])
    elif promo["discount_type"] == "fixed":
        discount = min(promo["discount_value"], data.subtotal + data.delivery_fee)
    
    return {
        "valid": True,
        "code": promo["code"],
        "description": promo["description"],
        "discount_type": promo["discount_type"],
        "discount_value": promo["discount_value"],
        "discount_amount": round(discount, 2),
        "new_total": round(data.subtotal + data.delivery_fee - discount, 2)
    }

@api_router.put("/promo-codes/{promo_id}")
async def update_promo(promo_id: str, updates: dict, user = Depends(get_current_user)):
    """Update promo code"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    allowed = ["description", "is_active", "usage_limit", "valid_until", "min_order", "max_discount"]
    update_data = {k: v for k, v in updates.items() if k in allowed}
    if update_data:
        await db.promo_codes.update_one({"id": promo_id}, {"$set": update_data})
    return await db.promo_codes.find_one({"id": promo_id}, {"_id": 0})

@api_router.delete("/promo-codes/{promo_id}")
async def delete_promo(promo_id: str, user = Depends(get_current_user)):
    """Delete promo code"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    await db.promo_codes.delete_one({"id": promo_id})
    return {"message": "Deleted"}

# ==================== CATEGORIES ====================

@api_router.get("/categories")
async def get_categories():
    """Get food categories"""
    return [
        {"id": "filipino", "name": "Filipino", "name_tl": "Pagkaing Pinoy"},
        {"id": "rice_meals", "name": "Rice Meals", "name_tl": "Mga Ulam"},
        {"id": "street_food", "name": "Street Food", "name_tl": "Tusok-tusok"},
        {"id": "chicken", "name": "Chicken", "name_tl": "Manok"},
        {"id": "seafood", "name": "Seafood", "name_tl": "Seafood"},
        {"id": "noodles", "name": "Noodles", "name_tl": "Pancit"},
        {"id": "desserts", "name": "Desserts", "name_tl": "Panghimagas"},
        {"id": "drinks", "name": "Drinks", "name_tl": "Inumin"},
    ]

# ==================== COVERAGE AREAS ====================

@api_router.get("/coverage-areas")
async def get_coverage_areas():
    """Get delivery coverage areas"""
    return {
        "center": {"lat": 15.9761, "lng": 120.5711, "name": "Urdaneta City Center"},
        "areas": [
            {"id": "urdaneta", "name": "Urdaneta City", "delivery_fee": 30.0, "is_primary": True},
            {"id": "binalonan", "name": "Binalonan", "delivery_fee": 45.0},
            {"id": "villasis", "name": "Villasis", "delivery_fee": 45.0},
            {"id": "manaoag", "name": "Manaoag", "delivery_fee": 50.0},
            {"id": "asingan", "name": "Asingan", "delivery_fee": 50.0},
            {"id": "pozorrubio", "name": "Pozorrubio", "delivery_fee": 55.0},
            {"id": "sison", "name": "Sison", "delivery_fee": 60.0},
        ]
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed sample data"""
    existing = await db.restaurants.find_one({})
    if existing:
        return {"message": "Data already seeded"}
    
    restaurants = [
        {"id": str(uuid.uuid4()), "owner_id": "system", "name": "Mang Tomas Ihaw-Ihaw", 
         "description": "Best BBQ and isaw in Urdaneta!", "cuisine_type": "street_food",
         "address": "McArthur Highway, Urdaneta City", "area": "Urdaneta City",
         "lat": 15.9785, "lng": 120.5723, "phone": "09171234567",
         "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
         "is_open": True, "is_approved": True, "rating": 4.5, "total_reviews": 128,
         "delivery_fee": 30.0, "min_order": 100.0, "estimated_delivery_time": "25-35 mins",
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "owner_id": "system", "name": "Aling Nena's Carinderia",
         "description": "Home-cooked Filipino meals - Sinigang, Adobo, Kare-kare!", "cuisine_type": "filipino",
         "address": "Rizal St., Poblacion, Urdaneta City", "area": "Urdaneta City",
         "lat": 15.9761, "lng": 120.5711, "phone": "09181234567",
         "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
         "is_open": True, "is_approved": True, "rating": 4.8, "total_reviews": 256,
         "delivery_fee": 35.0, "min_order": 150.0, "estimated_delivery_time": "30-40 mins",
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "owner_id": "system", "name": "Chicken Haus Urdaneta",
         "description": "Crispy fried chicken with unli rice!", "cuisine_type": "chicken",
         "address": "Nancayasan, Urdaneta City", "area": "Urdaneta City",
         "lat": 15.9812, "lng": 120.5689, "phone": "09191234567",
         "image_url": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800",
         "is_open": True, "is_approved": True, "rating": 4.3, "total_reviews": 89,
         "delivery_fee": 25.0, "min_order": 120.0, "estimated_delivery_time": "20-30 mins",
         "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.restaurants.insert_many(restaurants)
    
    # Add menu items
    menu_items = []
    for r in restaurants[:1]:  # Add menu to first restaurant
        menu_items.extend([
            {"id": str(uuid.uuid4()), "restaurant_id": r["id"], "name": "Pork BBQ (3 sticks)",
             "description": "Grilled pork skewers", "price": 60.0, "category": "Grilled", "is_available": True,
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "restaurant_id": r["id"], "name": "Chicken Isaw (5 sticks)",
             "description": "Grilled chicken intestines", "price": 50.0, "category": "Grilled", "is_available": True,
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "restaurant_id": r["id"], "name": "BBQ Platter",
             "description": "Assorted grilled items with rice", "price": 150.0, "category": "Meals", "is_available": True,
             "created_at": datetime.now(timezone.utc).isoformat()},
        ])
    
    if menu_items:
        await db.menu_items.insert_many(menu_items)
    
    # Add promo codes
    promos = [
        {"id": str(uuid.uuid4()), "code": "WELCOME50", "description": "50% off first order (max ₱100)",
         "discount_type": "percentage", "discount_value": 50.0, "min_order": 200.0, "max_discount": 100.0,
         "is_active": True, "first_order_only": True, "usage_count": 0,
         "valid_from": datetime.now(timezone.utc).isoformat(),
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "FREEDEL", "description": "Free delivery on ₱300+ orders",
         "discount_type": "free_delivery", "discount_value": 0, "min_order": 300.0,
         "is_active": True, "first_order_only": False, "usage_count": 0,
         "valid_from": datetime.now(timezone.utc).isoformat(),
         "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.promo_codes.insert_many(promos)
    
    # Add sample riders
    riders = [
        {"id": str(uuid.uuid4()), "user_id": "rider_sample_1", "vehicle_type": "motorcycle",
         "plate_number": "ABC 1234", "is_online": True, "is_on_delivery": False,
         "current_lat": 15.9780, "current_lng": 120.5700, "total_deliveries": 45, "total_earnings": 2250.0,
         "rating": 4.8, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "user_id": "rider_sample_2", "vehicle_type": "tricycle",
         "plate_number": "XYZ 5678", "is_online": True, "is_on_delivery": True,
         "current_lat": 15.9750, "current_lng": 120.5730, "total_deliveries": 32, "total_earnings": 1600.0,
         "rating": 4.5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "user_id": "rider_sample_3", "vehicle_type": "motorcycle",
         "plate_number": "DEF 9012", "is_online": False, "is_on_delivery": False,
         "current_lat": 15.9800, "current_lng": 120.5680, "total_deliveries": 78, "total_earnings": 3900.0,
         "rating": 4.9, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.rider_profiles.insert_many(riders)
    
    return {"message": "Data seeded", "restaurants": len(restaurants), "promos": len(promos), "riders": len(riders)}

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "KainTayo - The Sync Dashboard API", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
