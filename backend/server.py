from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
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
import jwt
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'kayntayo-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

# Create the main app
app = FastAPI(title="KainTayo - Urdaneta Food Delivery")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: str
    role: str = "customer"  # customer, restaurant_owner, driver, admin
    language: str = "en"  # en, tl (Tagalog)
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    phone: str
    name: str
    role: str = "customer"
    language: str = "en"
    address: Optional[str] = None

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    role: str = "customer"

class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    name: str
    description: str
    cuisine_type: str
    address: str
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
    customer_phone: str
    restaurant_id: str
    restaurant_name: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    discount: float = 0.0
    promo_code: Optional[str] = None
    total: float
    delivery_address: str
    area: Optional[str] = None
    payment_method: str  # cod, gcash, paymaya
    payment_status: str = "pending"  # pending, paid, failed
    order_status: str = "pending"  # pending, confirmed, preparing, ready, picked_up, delivered, cancelled
    special_instructions: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    restaurant_id: str
    items: List[CartItem]
    delivery_address: str
    area: Optional[str] = None
    payment_method: str
    promo_code: Optional[str] = None
    special_instructions: Optional[str] = None

class PabiliRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    customer_phone: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    items_list: str  # Text description of items to buy
    store_location: str
    delivery_address: str
    estimated_budget: float
    service_fee: float = 50.0
    actual_cost: Optional[float] = None
    total: Optional[float] = None
    payment_method: str
    payment_status: str = "pending"
    status: str = "pending"  # pending, accepted, shopping, delivering, completed, cancelled
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

class DriverProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    vehicle_type: str  # motorcycle, tricycle
    plate_number: str
    is_available: bool = False
    current_location: Optional[str] = None
    total_deliveries: int = 0
    total_earnings: float = 0.0
    rating: float = 5.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DriverProfileCreate(BaseModel):
    vehicle_type: str
    plate_number: str

class PromoCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # e.g., "WELCOME50", "FREEDEL"
    description: str
    discount_type: str  # "percentage", "fixed", "free_delivery"
    discount_value: float  # percentage (0-100) or fixed amount
    min_order: float = 0.0  # minimum order to apply
    max_discount: Optional[float] = None  # cap for percentage discounts
    usage_limit: Optional[int] = None  # total uses allowed
    usage_count: int = 0
    per_user_limit: int = 1  # uses per user
    valid_from: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    valid_until: Optional[datetime] = None
    is_active: bool = True
    applicable_areas: Optional[List[str]] = None  # None = all areas
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

class PromoUsage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    promo_id: str
    promo_code: str
    user_id: str
    order_id: Optional[str] = None
    discount_applied: float
    used_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

otp_store = {}  # In production, use Redis

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def create_token(user_id: str, role: str):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

# Mock OTP storage for simulation/demo purposes
LAST_SENT_OTP = {}

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/send-otp")
async def send_otp_endpoint(request: OTPRequest):
    """Send OTP to phone number (mock - in production use Twilio)"""
    otp = generate_otp()
    # Save for simulation
    LAST_SENT_OTP[request.phone] = otp
    
    otp_store[request.phone] = {
        "otp": otp,
        "expires": datetime.now(timezone.utc) + timedelta(minutes=5)
    }
    # In production, send via Twilio SMS
    logger.info(f"OTP for {request.phone}: {otp}")  # For testing
    return {"message": "OTP sent successfully", "debug_otp": otp}  # Remove debug_otp in production

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerify):
    """Verify OTP and login/register user"""
    stored = otp_store.get(request.phone)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new one.")
    
    if datetime.now(timezone.utc) > stored["expires"]:
        del otp_store[request.phone]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    if stored["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    del otp_store[request.phone]
    
    # Check if user exists
    user = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    
    if user:
        token = create_token(user["id"], user["role"])
        return {"token": token, "user": user, "is_new": False}
    
    # Create new user
    if not request.name:
        raise HTTPException(status_code=400, detail="Name is required for new users")
    
    new_user = UserBase(
        phone=request.phone,
        name=request.name,
        role=request.role
    )
    user_dict = new_user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    await db.users.insert_one(user_dict)
    
    # Remove _id if it was added by MongoDB
    user_dict.pop("_id", None)
    
    token = create_token(new_user.id, new_user.role)
    return {"token": token, "user": user_dict, "is_new": True}

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    """Get current user profile"""
    return user

@api_router.put("/auth/profile")
async def update_profile(updates: dict, user = Depends(get_current_user)):
    """Update user profile"""
    allowed_fields = ["name", "address", "language"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return updated_user

# ==================== RESTAURANT ROUTES ====================

@api_router.get("/restaurants")
async def get_restaurants(cuisine: Optional[str] = None, search: Optional[str] = None):
    """Get all approved restaurants"""
    query = {"is_approved": True}
    if cuisine:
        query["cuisine_type"] = cuisine
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
    """Create a new restaurant (for restaurant owners)"""
    if user["role"] not in ["restaurant_owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only restaurant owners can create restaurants")
    
    restaurant = Restaurant(owner_id=user["id"], **data.model_dump())
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
    if restaurant["owner_id"] != user["id"] and user["role"] != "admin":
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
    if user["role"] not in ["restaurant_owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not a restaurant owner")
    
    # Simulation Bypass: If it's the demo merchant, give them a mock store
    if user["id"] == "sim-user-restaurant_owner":
        restaurant = await db.restaurants.find_one({"owner_id": "system"}, {"_id": 0})
        return restaurant
        
    restaurant = await db.restaurants.find_one({"owner_id": user["id"]}, {"_id": 0})
    return restaurant

# ==================== MENU ROUTES ====================

@api_router.post("/restaurants/{restaurant_id}/menu", response_model=MenuItem)
async def add_menu_item(restaurant_id: str, data: MenuItemCreate, user = Depends(get_current_user)):
    """Add menu item to restaurant"""
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant["owner_id"] != user["id"] and user["role"] != "admin":
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
    if restaurant["owner_id"] != user["id"] and user["role"] != "admin":
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
    if restaurant["owner_id"] != user["id"] and user["role"] != "admin":
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
        promo = await db.promo_codes.find_one({"code": promo_code}, {"_id": 0})
        
        if promo and promo.get("is_active", False):
            # Validate promo
            now = datetime.now(timezone.utc)
            valid = True
            
            # Check per-user limit
            user_usage = await db.promo_usage.count_documents({
                "promo_id": promo["id"],
                "user_id": user["id"]
            })
            if user_usage >= promo.get("per_user_limit", 1):
                valid = False
            
            # Check first order only
            if promo.get("first_order_only", False):
                user_orders = await db.orders.count_documents({"customer_id": user["id"]})
                if user_orders > 0:
                    valid = False
            
            # Check min order
            if subtotal < promo.get("min_order", 0):
                valid = False
            
            if valid:
                # Calculate discount
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
                
                # Record promo usage
                await db.promo_codes.update_one(
                    {"id": promo["id"]},
                    {"$inc": {"usage_count": 1}}
                )
    
    total = subtotal + restaurant["delivery_fee"] - discount
    
    order = Order(
        customer_id=user["id"],
        customer_name=user["name"],
        customer_phone=user["phone"],
        restaurant_id=restaurant["id"],
        restaurant_name=restaurant["name"],
        items=order_items,
        subtotal=subtotal,
        delivery_fee=restaurant["delivery_fee"],
        discount=discount,
        promo_code=promo_code if discount > 0 else None,
        total=total,
        delivery_address=data.delivery_address,
        area=data.area,
        payment_method=data.payment_method,
        special_instructions=data.special_instructions
    )
    
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.orders.insert_one(doc)
    
    # Record promo usage with order ID
    if promo_code and discount > 0:
        promo = await db.promo_codes.find_one({"code": promo_code}, {"_id": 0})
        if promo:
            usage = PromoUsage(
                promo_id=promo["id"],
                promo_code=promo_code,
                user_id=user["id"],
                order_id=order.id,
                discount_applied=discount
            )
            usage_doc = usage.model_dump()
            usage_doc["used_at"] = usage_doc["used_at"].isoformat()
            await db.promo_usage.insert_one(usage_doc)
    
    return order

@api_router.get("/orders")
async def get_orders(user = Depends(get_current_user)):
    """Get orders based on user role"""
    if user["role"] == "customer":
        query = {"customer_id": user["id"]}
    elif user["role"] == "restaurant_owner":
        restaurant = await db.restaurants.find_one({"owner_id": user["id"]}, {"_id": 0})
        if not restaurant:
            return []
        query = {"restaurant_id": restaurant["id"]}
    elif user["role"] == "driver":
        query = {"$or": [{"driver_id": user["id"]}, {"driver_id": None, "order_status": "ready"}]}
    elif user["role"] == "admin":
        query = {}
    else:
        query = {"customer_id": user["id"]}
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user = Depends(get_current_user)):
    """Get order details"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if user["role"] == "customer" and order["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user = Depends(get_current_user)):
    """Update order status"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    valid_statuses = ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update_data = {
        "order_status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    return await db.orders.find_one({"id": order_id}, {"_id": 0})

@api_router.put("/orders/{order_id}/assign-driver")
async def assign_driver(order_id: str, user = Depends(get_current_user)):
    """Driver accepts/assigns themselves to an order"""
    if user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can accept orders")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["driver_id"]:
        raise HTTPException(status_code=400, detail="Order already has a driver")
    
    update_data = {
        "driver_id": user["id"],
        "driver_name": user["name"],
        "order_status": "picked_up" if order["order_status"] == "ready" else order["order_status"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    return await db.orders.find_one({"id": order_id}, {"_id": 0})

# ==================== PABILI ROUTES ====================

@api_router.post("/pabili", response_model=PabiliRequest, status_code=201)
async def create_pabili_request(data: PabiliCreate, user = Depends(get_current_user)):
    """Create a Pabili (grocery/errand) request"""
    pabili = PabiliRequest(
        customer_id=user["id"],
        customer_name=user["name"],
        customer_phone=user["phone"],
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
    """Get Pabili requests based on user role"""
    if user["role"] == "customer":
        query = {"customer_id": user["id"]}
    elif user["role"] == "driver":
        query = {"$or": [{"driver_id": user["id"]}, {"driver_id": None, "status": "pending"}]}
    elif user["role"] == "admin":
        query = {}
    else:
        query = {"customer_id": user["id"]}
    
    requests = await db.pabili_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return requests

@api_router.get("/pabili/{pabili_id}")
async def get_pabili_request(pabili_id: str, user = Depends(get_current_user)):
    """Get Pabili request details"""
    pabili = await db.pabili_requests.find_one({"id": pabili_id}, {"_id": 0})
    if not pabili:
        raise HTTPException(status_code=404, detail="Pabili request not found")
    return pabili

@api_router.put("/pabili/{pabili_id}/accept")
async def accept_pabili_request(pabili_id: str, user = Depends(get_current_user)):
    """Driver accepts a Pabili request"""
    if user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can accept Pabili requests")
    
    pabili = await db.pabili_requests.find_one({"id": pabili_id}, {"_id": 0})
    if not pabili:
        raise HTTPException(status_code=404, detail="Pabili request not found")
    
    if pabili["driver_id"]:
        raise HTTPException(status_code=400, detail="Request already accepted by another driver")
    
    update_data = {
        "driver_id": user["id"],
        "driver_name": user["name"],
        "status": "accepted",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pabili_requests.update_one({"id": pabili_id}, {"$set": update_data})
    return await db.pabili_requests.find_one({"id": pabili_id}, {"_id": 0})

@api_router.put("/pabili/{pabili_id}/status")
async def update_pabili_status(pabili_id: str, status: str, actual_cost: Optional[float] = None, user = Depends(get_current_user)):
    """Update Pabili request status"""
    pabili = await db.pabili_requests.find_one({"id": pabili_id}, {"_id": 0})
    if not pabili:
        raise HTTPException(status_code=404, detail="Pabili request not found")
    
    valid_statuses = ["pending", "accepted", "shopping", "delivering", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if actual_cost is not None:
        update_data["actual_cost"] = actual_cost
        update_data["total"] = actual_cost + pabili["service_fee"]
    
    await db.pabili_requests.update_one({"id": pabili_id}, {"$set": update_data})
    return await db.pabili_requests.find_one({"id": pabili_id}, {"_id": 0})

# ==================== DRIVER ROUTES ====================

@api_router.post("/driver/profile", response_model=DriverProfile)
async def create_driver_profile(data: DriverProfileCreate, user = Depends(get_current_user)):
    """Create driver profile"""
    if user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can create driver profiles")
    
    existing = await db.driver_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Driver profile already exists")
    
    profile = DriverProfile(user_id=user["id"], **data.model_dump())
    doc = profile.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.driver_profiles.insert_one(doc)
    return profile

@api_router.get("/driver/profile")
async def get_driver_profile(user = Depends(get_current_user)):
    """Get driver profile"""
    profile = await db.driver_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return profile

@api_router.put("/driver/availability")
async def toggle_driver_availability(is_available: bool, user = Depends(get_current_user)):
    """Toggle driver availability"""
    if user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can update availability")
    
    await db.driver_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": {"is_available": is_available}}
    )
    return {"is_available": is_available}

@api_router.get("/driver/earnings")
async def get_driver_earnings(user = Depends(get_current_user)):
    """Get driver earnings summary"""
    if user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can view earnings")
    
    # Get completed orders
    orders = await db.orders.find(
        {"driver_id": user["id"], "order_status": "delivered"},
        {"_id": 0}
    ).to_list(1000)
    
    # Get completed pabili requests
    pabili = await db.pabili_requests.find(
        {"driver_id": user["id"], "status": "completed"},
        {"_id": 0}
    ).to_list(1000)
    
    total_deliveries = len(orders) + len(pabili)
    order_earnings = sum(o.get("delivery_fee", 0) for o in orders)
    pabili_earnings = sum(p.get("service_fee", 0) for p in pabili)
    total_earnings = order_earnings + pabili_earnings
    
    return {
        "total_deliveries": total_deliveries,
        "order_deliveries": len(orders),
        "pabili_deliveries": len(pabili),
        "order_earnings": order_earnings,
        "pabili_earnings": pabili_earnings,
        "total_earnings": total_earnings
    }

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users")
async def get_all_users(user = Depends(get_current_user)):
    """Get all users (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/restaurants")
async def get_all_restaurants(user = Depends(get_current_user)):
    """Get all restaurants including unapproved (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    return restaurants

@api_router.put("/admin/restaurants/{restaurant_id}/approve")
async def approve_restaurant(restaurant_id: str, is_approved: bool, user = Depends(get_current_user)):
    """Approve/reject restaurant (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.restaurants.update_one({"id": restaurant_id}, {"$set": {"is_approved": is_approved}})
    return await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})

@api_router.get("/admin/analytics")
async def get_analytics(user = Depends(get_current_user)):
    """Get platform analytics (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({})
    total_restaurants = await db.restaurants.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_pabili = await db.pabili_requests.count_documents({})
    
    # Orders by status
    orders_pending = await db.orders.count_documents({"order_status": "pending"})
    orders_delivered = await db.orders.count_documents({"order_status": "delivered"})
    
    # Revenue
    orders = await db.orders.find({"order_status": "delivered"}, {"_id": 0, "total": 1}).to_list(10000)
    total_revenue = sum(o.get("total", 0) for o in orders)
    
    return {
        "total_users": total_users,
        "total_restaurants": total_restaurants,
        "total_orders": total_orders,
        "total_pabili": total_pabili,
        "orders_pending": orders_pending,
        "orders_delivered": orders_delivered,
        "total_revenue": total_revenue
    }

# ==================== PROMO CODES ====================

@api_router.post("/promo-codes", status_code=201)
async def create_promo_code(data: PromoCodeCreate, user = Depends(get_current_user)):
    """Create a new promo code (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if code already exists
    existing = await db.promo_codes.find_one({"code": data.code.upper()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    
    promo = PromoCode(
        code=data.code.upper(),
        description=data.description,
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        min_order=data.min_order,
        max_discount=data.max_discount,
        usage_limit=data.usage_limit,
        per_user_limit=data.per_user_limit,
        valid_until=datetime.fromisoformat(data.valid_until) if data.valid_until else None,
        applicable_areas=data.applicable_areas,
        first_order_only=data.first_order_only
    )
    
    doc = promo.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["valid_from"] = doc["valid_from"].isoformat()
    if doc["valid_until"]:
        doc["valid_until"] = doc["valid_until"].isoformat()
    
    await db.promo_codes.insert_one(doc)
    doc.pop("_id", None)
    
    return doc

@api_router.get("/promo-codes")
async def get_promo_codes(user = Depends(get_current_user)):
    """Get all promo codes (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    promos = await db.promo_codes.find({}, {"_id": 0}).to_list(100)
    return promos

@api_router.get("/promo-codes/active")
async def get_active_promo_codes():
    """Get active promo codes for display"""
    now = datetime.now(timezone.utc).isoformat()
    promos = await db.promo_codes.find({
        "is_active": True,
        "valid_from": {"$lte": now},
        "$or": [
            {"valid_until": None},
            {"valid_until": {"$gte": now}}
        ]
    }, {"_id": 0}).to_list(20)
    
    # Filter out codes that have reached usage limit
    active_promos = []
    for p in promos:
        if p.get("usage_limit") is None or p.get("usage_count", 0) < p["usage_limit"]:
            # Return limited info for public display
            active_promos.append({
                "code": p["code"],
                "description": p["description"],
                "discount_type": p["discount_type"],
                "discount_value": p["discount_value"],
                "min_order": p.get("min_order", 0),
                "first_order_only": p.get("first_order_only", False)
            })
    
    return active_promos

@api_router.post("/promo-codes/validate")
async def validate_promo_code(data: PromoCodeApply, user = Depends(get_current_user)):
    """Validate and calculate discount for a promo code"""
    code = data.code.upper()
    
    promo = await db.promo_codes.find_one({"code": code}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    # Check if active
    if not promo.get("is_active", False):
        raise HTTPException(status_code=400, detail="This promo code is no longer active")
    
    # Check validity period
    now = datetime.now(timezone.utc)
    valid_from = datetime.fromisoformat(promo["valid_from"].replace("Z", "+00:00")) if isinstance(promo["valid_from"], str) else promo["valid_from"]
    if now < valid_from:
        raise HTTPException(status_code=400, detail="This promo code is not yet valid")
    
    if promo.get("valid_until"):
        valid_until = datetime.fromisoformat(promo["valid_until"].replace("Z", "+00:00")) if isinstance(promo["valid_until"], str) else promo["valid_until"]
        if now > valid_until:
            raise HTTPException(status_code=400, detail="This promo code has expired")
    
    # Check usage limit
    if promo.get("usage_limit") and promo.get("usage_count", 0) >= promo["usage_limit"]:
        raise HTTPException(status_code=400, detail="This promo code has reached its usage limit")
    
    # Check per-user limit
    user_usage = await db.promo_usage.count_documents({
        "promo_id": promo["id"],
        "user_id": user["id"]
    })
    if user_usage >= promo.get("per_user_limit", 1):
        raise HTTPException(status_code=400, detail="You have already used this promo code")
    
    # Check first order only
    if promo.get("first_order_only", False):
        user_orders = await db.orders.count_documents({"customer_id": user["id"]})
        if user_orders > 0:
            raise HTTPException(status_code=400, detail="This promo code is for first orders only")
    
    # Check minimum order
    if data.subtotal < promo.get("min_order", 0):
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order of ₱{promo['min_order']} required for this promo"
        )
    
    # Check applicable areas
    if promo.get("applicable_areas") and data.area:
        if data.area not in promo["applicable_areas"]:
            raise HTTPException(status_code=400, detail="This promo code is not valid for your area")
    
    # Calculate discount
    discount = 0.0
    discount_type = promo["discount_type"]
    discount_value = promo["discount_value"]
    
    if discount_type == "free_delivery":
        discount = data.delivery_fee
    elif discount_type == "percentage":
        discount = data.subtotal * (discount_value / 100)
        if promo.get("max_discount"):
            discount = min(discount, promo["max_discount"])
    elif discount_type == "fixed":
        discount = min(discount_value, data.subtotal + data.delivery_fee)
    
    return {
        "valid": True,
        "code": code,
        "description": promo["description"],
        "discount_type": discount_type,
        "discount_value": discount_value,
        "discount_amount": round(discount, 2),
        "new_total": round(data.subtotal + data.delivery_fee - discount, 2)
    }

@api_router.put("/promo-codes/{promo_id}")
async def update_promo_code(promo_id: str, updates: dict, user = Depends(get_current_user)):
    """Update a promo code (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    promo = await db.promo_codes.find_one({"id": promo_id}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    allowed_fields = ["description", "is_active", "usage_limit", "valid_until", "min_order", "max_discount"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.promo_codes.update_one({"id": promo_id}, {"$set": update_data})
    
    return await db.promo_codes.find_one({"id": promo_id}, {"_id": 0})

@api_router.delete("/promo-codes/{promo_id}")
async def delete_promo_code(promo_id: str, user = Depends(get_current_user)):
    """Delete a promo code (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.promo_codes.delete_one({"id": promo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    return {"message": "Promo code deleted"}

# ==================== COVERAGE AREAS ====================

@api_router.get("/coverage-areas")
async def get_coverage_areas():
    """Get delivery coverage areas - Urdaneta City and perimeter towns"""
    return {
        "service_area": "Urdaneta City & Surrounding Areas",
        "center": {
            "lat": 15.9761,
            "lng": 120.5711,
            "name": "Urdaneta City Center"
        },
        "areas": [
            {
                "id": "urdaneta",
                "name": "Urdaneta City",
                "name_tl": "Lungsod ng Urdaneta",
                "type": "city",
                "is_primary": True,
                "lat": 15.9761,
                "lng": 120.5711,
                "delivery_fee": 30.0,
                "estimated_time": "20-35 mins",
                "barangays": [
                    "Poblacion", "Nancayasan", "San Vicente", "Cabuloan", "Cabaruan",
                    "Camantiles", "Casantaan", "Consolacion", "Dilan Paurido", "Dr. Pedro T. Orata",
                    "Labit Proper", "Labit West", "Mabanogbog", "Macalong", "Nancalobasaan",
                    "Parayao", "Pinmaludpod", "San Jose", "Santa Lucia", "Santo Domingo",
                    "Sugcong", "Tiparo", "Tulong"
                ]
            },
            {
                "id": "binalonan",
                "name": "Binalonan",
                "name_tl": "Binalonan",
                "type": "municipality",
                "is_primary": False,
                "lat": 16.0525,
                "lng": 120.5969,
                "delivery_fee": 45.0,
                "estimated_time": "30-45 mins",
                "barangays": ["Poblacion", "Balangobong", "San Felipe", "San Juan"]
            },
            {
                "id": "asingan",
                "name": "Asingan",
                "name_tl": "Asingan",
                "type": "municipality",
                "is_primary": False,
                "lat": 16.0042,
                "lng": 120.6683,
                "delivery_fee": 50.0,
                "estimated_time": "35-50 mins",
                "barangays": ["Poblacion", "Ariston East", "Ariston West", "Bantog"]
            },
            {
                "id": "villasis",
                "name": "Villasis",
                "name_tl": "Villasis",
                "type": "municipality",
                "is_primary": False,
                "lat": 15.9083,
                "lng": 120.5878,
                "delivery_fee": 45.0,
                "estimated_time": "30-45 mins",
                "barangays": ["Poblacion", "Bacag", "Barangobong", "Puelay"]
            },
            {
                "id": "manaoag",
                "name": "Manaoag",
                "name_tl": "Manaoag",
                "type": "municipality",
                "is_primary": False,
                "lat": 16.0439,
                "lng": 120.4861,
                "delivery_fee": 50.0,
                "estimated_time": "35-50 mins",
                "barangays": ["Poblacion", "Babasit", "Baguinay", "Licsi"]
            },
            {
                "id": "san_manuel",
                "name": "San Manuel",
                "name_tl": "San Manuel",
                "type": "municipality",
                "is_primary": False,
                "lat": 15.9883,
                "lng": 120.6644,
                "delivery_fee": 45.0,
                "estimated_time": "30-45 mins",
                "barangays": ["Poblacion", "San Antonio", "San Juan", "San Roque"]
            },
            {
                "id": "sison",
                "name": "Sison",
                "name_tl": "Sison",
                "type": "municipality",
                "is_primary": False,
                "lat": 16.1742,
                "lng": 120.5117,
                "delivery_fee": 60.0,
                "estimated_time": "40-55 mins",
                "barangays": ["Poblacion", "Amagbagan", "Artacho", "Asan Norte"]
            },
            {
                "id": "pozorrubio",
                "name": "Pozorrubio",
                "name_tl": "Pozorrubio",
                "type": "municipality",
                "is_primary": False,
                "lat": 16.1094,
                "lng": 120.5489,
                "delivery_fee": 55.0,
                "estimated_time": "35-50 mins",
                "barangays": ["Poblacion", "Alipangpang", "Amagbagan", "Balacag"]
            }
        ],
        "polygon": [
            {"lat": 16.20, "lng": 120.40},
            {"lat": 16.20, "lng": 120.75},
            {"lat": 15.85, "lng": 120.75},
            {"lat": 15.85, "lng": 120.40}
        ]
    }

@api_router.post("/check-delivery")
async def check_delivery_availability(lat: float, lng: float):
    """Check if a location is within delivery coverage"""
    # Simple bounding box check for Urdaneta area
    min_lat, max_lat = 15.85, 16.20
    min_lng, max_lng = 120.40, 120.75
    
    if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
        # Calculate approximate distance from Urdaneta center
        center_lat, center_lng = 15.9761, 120.5711
        # Rough distance calculation
        lat_diff = abs(lat - center_lat)
        lng_diff = abs(lng - center_lng)
        
        if lat_diff < 0.05 and lng_diff < 0.05:
            return {"available": True, "zone": "urdaneta", "delivery_fee": 30.0, "estimated_time": "20-35 mins"}
        elif lat_diff < 0.10 and lng_diff < 0.10:
            return {"available": True, "zone": "nearby", "delivery_fee": 45.0, "estimated_time": "30-45 mins"}
        else:
            return {"available": True, "zone": "perimeter", "delivery_fee": 55.0, "estimated_time": "40-55 mins"}
    
    return {"available": False, "message": "Sorry, we don't deliver to this location yet."}

# ==================== CUISINE CATEGORIES ====================

@api_router.get("/categories")
async def get_categories():
    """Get food categories"""
    return [
        {"id": "filipino", "name": "Filipino", "name_tl": "Pagkaing Pinoy", "icon": "utensils"},
        {"id": "rice_meals", "name": "Rice Meals", "name_tl": "Mga Ulam", "icon": "bowl-rice"},
        {"id": "street_food", "name": "Street Food", "name_tl": "Tusok-tusok", "icon": "flame"},
        {"id": "chicken", "name": "Chicken", "name_tl": "Manok", "icon": "drumstick-bite"},
        {"id": "pork", "name": "Pork", "name_tl": "Baboy", "icon": "bacon"},
        {"id": "seafood", "name": "Seafood", "name_tl": "Seafood", "icon": "fish"},
        {"id": "noodles", "name": "Noodles", "name_tl": "Pancit", "icon": "bowl-food"},
        {"id": "desserts", "name": "Desserts", "name_tl": "Panghimagas", "icon": "ice-cream"},
        {"id": "drinks", "name": "Drinks", "name_tl": "Inumin", "icon": "cup-soda"},
        {"id": "snacks", "name": "Snacks", "name_tl": "Meryenda", "icon": "cookie"}
    ]

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed sample data for testing"""
    # Check if already seeded
    existing = await db.restaurants.find_one({})
    if existing:
        return {"message": "Data already seeded"}
    
    # Create sample restaurants with locations
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
            "description": "Home-cooked Filipino meals just like lola used to make. Sinigang, Adobo, Kare-kare and more!",
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
        },
        {
            "id": str(uuid.uuid4()),
            "owner_id": "system",
            "name": "Panciteria de Urdaneta",
            "description": "Pancit Canton, Bihon, Palabok, Malabon. Perfect for parties and everyday meals!",
            "cuisine_type": "noodles",
            "address": "San Vicente, Urdaneta City",
            "area": "Urdaneta City",
            "lat": 15.9733,
            "lng": 120.5756,
            "phone": "09201234567",
            "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
            "is_open": True,
            "is_approved": True,
            "rating": 4.6,
            "total_reviews": 167,
            "delivery_fee": 30.0,
            "min_order": 100.0,
            "estimated_delivery_time": "25-35 mins",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "owner_id": "system",
            "name": "Kuya Eddie's Sisig",
            "description": "The best sizzling sisig in Pangasinan! Pork, Chicken, Bangus, Tofu sisig available.",
            "cuisine_type": "filipino",
            "address": "Binalonan Road, Binalonan",
            "area": "Binalonan",
            "lat": 16.0525,
            "lng": 120.5969,
            "phone": "09211234567",
            "image_url": "https://images.unsplash.com/photo-1599321329467-7be3840f23a3?w=800",
            "is_open": True,
            "is_approved": True,
            "rating": 4.7,
            "total_reviews": 203,
            "delivery_fee": 45.0,
            "min_order": 150.0,
            "estimated_delivery_time": "35-45 mins",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "owner_id": "system",
            "name": "Manaoag Longganisa House",
            "description": "Famous Vigan-style longganisa and tapsilog meals. Breakfast all day!",
            "cuisine_type": "filipino",
            "address": "Main Road, Manaoag",
            "area": "Manaoag",
            "lat": 16.0439,
            "lng": 120.4861,
            "phone": "09221234567",
            "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
            "is_open": True,
            "is_approved": True,
            "rating": 4.4,
            "total_reviews": 145,
            "delivery_fee": 50.0,
            "min_order": 120.0,
            "estimated_delivery_time": "40-50 mins",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.restaurants.insert_many(restaurants_data)
    
    # Create menu items for each restaurant
    menu_items_data = []
    
    # Mang Tomas menu
    mang_tomas_id = restaurants_data[0]["id"]
    menu_items_data.extend([
        {"id": str(uuid.uuid4()), "restaurant_id": mang_tomas_id, "name": "Pork BBQ (3 sticks)", "description": "Grilled pork skewers with special sauce", "price": 60.0, "category": "Grilled", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": mang_tomas_id, "name": "Chicken Isaw (5 sticks)", "description": "Grilled chicken intestines", "price": 50.0, "category": "Grilled", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": mang_tomas_id, "name": "Pork Isaw (5 sticks)", "description": "Grilled pork intestines", "price": 55.0, "category": "Grilled", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": mang_tomas_id, "name": "Betamax (5 pcs)", "description": "Grilled coagulated pork blood", "price": 45.0, "category": "Grilled", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": mang_tomas_id, "name": "BBQ Platter", "description": "Assorted grilled items with rice", "price": 150.0, "category": "Meals", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    # Aling Nena menu
    aling_nena_id = restaurants_data[1]["id"]
    menu_items_data.extend([
        {"id": str(uuid.uuid4()), "restaurant_id": aling_nena_id, "name": "Sinigang na Baboy", "description": "Pork in sour tamarind soup", "price": 120.0, "category": "Soups", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": aling_nena_id, "name": "Chicken Adobo", "description": "Braised chicken in soy sauce and vinegar", "price": 95.0, "category": "Main", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": aling_nena_id, "name": "Kare-Kare", "description": "Oxtail stew in peanut sauce", "price": 180.0, "category": "Main", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": aling_nena_id, "name": "Pinakbet", "description": "Mixed vegetables with shrimp paste", "price": 85.0, "category": "Vegetables", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": aling_nena_id, "name": "Plain Rice", "description": "Steamed white rice", "price": 15.0, "category": "Sides", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    # Chicken Haus menu
    chicken_id = restaurants_data[2]["id"]
    menu_items_data.extend([
        {"id": str(uuid.uuid4()), "restaurant_id": chicken_id, "name": "1pc Chicken with Rice", "description": "Crispy fried chicken with unlimited rice", "price": 99.0, "category": "Meals", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": chicken_id, "name": "2pc Chicken with Rice", "description": "Two pieces of crispy fried chicken", "price": 159.0, "category": "Meals", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": chicken_id, "name": "Buffalo Wings (6pcs)", "description": "Spicy buffalo-style wings", "price": 129.0, "category": "Wings", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": chicken_id, "name": "Chicken Burger", "description": "Crispy chicken patty burger", "price": 89.0, "category": "Burgers", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    # Panciteria menu
    pancit_id = restaurants_data[3]["id"]
    menu_items_data.extend([
        {"id": str(uuid.uuid4()), "restaurant_id": pancit_id, "name": "Pancit Canton", "description": "Stir-fried egg noodles with vegetables", "price": 75.0, "category": "Noodles", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": pancit_id, "name": "Pancit Bihon", "description": "Rice noodles with vegetables and meat", "price": 70.0, "category": "Noodles", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": pancit_id, "name": "Palabok", "description": "Rice noodles in shrimp sauce", "price": 85.0, "category": "Noodles", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": pancit_id, "name": "Pancit Malabon", "description": "Thick rice noodles with seafood", "price": 95.0, "category": "Noodles", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "restaurant_id": pancit_id, "name": "Party Tray (10pax)", "description": "Large tray of mixed pancit", "price": 450.0, "category": "Party", "is_available": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    
    await db.menu_items.insert_many(menu_items_data)
    
    return {"message": "Sample data seeded successfully", "restaurants": len(restaurants_data), "menu_items": len(menu_items_data)}

# ==================== SIMULATION ROUTES ====================

@api_router.post("/simulate/order")
async def simulate_order():
    """Create a random order for demonstration purposes"""
    # 1. Get a random restaurant
    restaurants = await db.restaurants.find({"is_open": True}).to_list(100)
    if not restaurants:
        return {"error": "No open restaurants found to simulate an order"}
    
    import random
    restaurant = random.choice(restaurants)
    
    # 2. Get menu items for this restaurant
    menu_items = await db.menu_items.find({"restaurant_id": restaurant["id"], "is_available": True}).to_list(100)
    if not menu_items:
        return {"error": f"No available menu items for restaurant {restaurant['name']}"}
    
    # 3. Select 1-3 random items
    num_items = random.randint(1, 3)
    selected_items = random.sample(menu_items, min(num_items, len(menu_items)))
    
    order_items = []
    total = 0
    for item in selected_items:
        qty = random.randint(1, 3)
        order_items.append({
            "menu_item_id": item["id"],
            "name": item["name"],
            "price": item["price"],
            "quantity": qty
        })
        total += item["price"] * qty
    
    # 4. Create order doc
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "customer_id": "sim-user",
        "customer_name": "Demo Customer",
        "restaurant_id": restaurant["id"],
        "restaurant_name": restaurant["name"],
        "items": order_items,
        "total": total + restaurant["delivery_fee"],
        "delivery_fee": restaurant["delivery_fee"],
        "delivery_address": "Demo Address, Urdaneta City",
        "payment_method": "cod",
        "order_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return order_doc

@api_router.post("/simulate/pabili")
async def simulate_pabili():
    """Create a random pabili request for demonstration purposes"""
    import random
    
    items = [
        "2kg Rice, 1L Cooking Oil, 1 doz Eggs",
        "Medicine from Mercury Drug (Paracetamol, Vit C)",
        "Milk Tea (2 large pearls, 50% sugar)",
        "Groceries: Bread, Milk, Coffee, Sugar",
        "Document delivery to City Hall"
    ]
    
    pabili_id = str(uuid.uuid4())
    pabili_doc = {
        "id": pabili_id,
        "customer_id": "sim-user",
        "customer_name": "Demo Ghost",
        "customer_phone": "09170000000",
        "items_list": random.choice(items),
        "store_location": "Nearby Supermarket / Botika",
        "delivery_address": "Demo Drop-off Point, Urdaneta",
        "estimated_budget": random.randint(200, 1000),
        "payment_method": "cod",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pabili_requests.insert_one(pabili_doc)
    pabili_doc.pop("_id", None)
    return pabili_doc

@api_router.post("/seed-promos")
async def seed_promo_codes():
    """Seed sample promo codes for testing"""
    existing = await db.promo_codes.find_one({})
    if existing:
        return {"message": "Promo codes already seeded"}
    
    now = datetime.now(timezone.utc)
    next_month = now + timedelta(days=30)
    
    promo_codes = [
        {
            "id": str(uuid.uuid4()),
            "code": "WELCOME50",
            "description": "50% off your first order! Maximum ₱100 discount.",
            "discount_type": "percentage",
            "discount_value": 50.0,
            "min_order": 200.0,
            "max_discount": 100.0,
            "usage_limit": 1000,
            "usage_count": 0,
            "per_user_limit": 1,
            "valid_from": now.isoformat(),
            "valid_until": next_month.isoformat(),
            "is_active": True,
            "first_order_only": True,
            "applicable_areas": None,
            "created_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "code": "FREEDEL",
            "description": "Free delivery on orders ₱300+",
            "discount_type": "free_delivery",
            "discount_value": 0,
            "min_order": 300.0,
            "max_discount": None,
            "usage_limit": 500,
            "usage_count": 0,
            "per_user_limit": 3,
            "valid_from": now.isoformat(),
            "valid_until": next_month.isoformat(),
            "is_active": True,
            "first_order_only": False,
            "applicable_areas": None,
            "created_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "code": "URDANETA20",
            "description": "₱20 off for Urdaneta City orders",
            "discount_type": "fixed",
            "discount_value": 20.0,
            "min_order": 150.0,
            "max_discount": None,
            "usage_limit": None,
            "usage_count": 0,
            "per_user_limit": 5,
            "valid_from": now.isoformat(),
            "valid_until": next_month.isoformat(),
            "is_active": True,
            "first_order_only": False,
            "applicable_areas": ["Urdaneta City"],
            "created_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "code": "PABILI10",
            "description": "₱10 off Pabili service fee",
            "discount_type": "fixed",
            "discount_value": 10.0,
            "min_order": 0,
            "max_discount": None,
            "usage_limit": 200,
            "usage_count": 0,
            "per_user_limit": 2,
            "valid_from": now.isoformat(),
            "valid_until": next_month.isoformat(),
            "is_active": True,
            "first_order_only": False,
            "applicable_areas": None,
            "created_at": now.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "code": "MERYENDA",
            "description": "15% off afternoon orders (2-5 PM)",
            "discount_type": "percentage",
            "discount_value": 15.0,
            "min_order": 100.0,
            "max_discount": 50.0,
            "usage_limit": 300,
            "usage_count": 0,
            "per_user_limit": 3,
            "valid_from": now.isoformat(),
            "valid_until": next_month.isoformat(),
            "is_active": True,
            "first_order_only": False,
            "applicable_areas": None,
            "created_at": now.isoformat()
        }
    ]
    
    await db.promo_codes.insert_many(promo_codes)
    
    return {"message": "Promo codes seeded successfully", "count": len(promo_codes)}

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "KainTayo API - Urdaneta City Food Delivery", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "KainTayo API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
