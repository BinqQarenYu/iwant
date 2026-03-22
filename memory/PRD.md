# KainTayo - Urdaneta City Food Delivery App

## Original Problem Statement
PC and mobile app for food delivery in Urdaneta City, Pangasinan, Philippines and its perimeter towns. Caters to small food businesses and taps small transport drivers (trike, motor) as part-time delivery riders. Similar to Keeta Qatar / Talabat Qatar.

## User Personas
1. **Customer** - Residents of Urdaneta and nearby towns ordering food/groceries
2. **Restaurant Owner** - Small food business owners managing menus and orders
3. **Driver** - Trike/motorcycle riders doing deliveries as part-time work
4. **Admin** - Platform managers overseeing operations

## Core Requirements
- 4 user roles with role-based dashboards
- Phone OTP authentication (bilingual EN/Filipino)
- Food ordering with cart, checkout, payment selection
- Real-time order tracking
- Pabili (grocery errand) service
- Driver assignment and earnings tracking
- Coverage for Urdaneta + 7 perimeter towns

## What's Been Implemented (March 2026)

### Backend (FastAPI + MongoDB)
- [x] User authentication with phone OTP (mock for testing)
- [x] JWT token-based auth with role support
- [x] Restaurant CRUD with menu management
- [x] Order management with status tracking
- [x] Pabili request system
- [x] Driver profile and availability
- [x] Admin analytics endpoint
- [x] Coverage areas API (Urdaneta + 7 towns)
- [x] Location-based delivery fee calculation
- [x] **Promo Code System** - full CRUD, validation, usage tracking

### Promo Codes Added
- **WELCOME50**: 50% off first order (max ₱100, min order ₱200)
- **FREEDEL**: Free delivery on orders ₱300+
- **URDANETA20**: ₱20 off for Urdaneta City orders
- **PABILI10**: ₱10 off Pabili service fee
- **MERYENDA**: 15% off afternoon orders (max ₱50)

### Frontend (React + Tailwind + Shadcn)
- [x] Homepage with Keeta/Talabat-style design
- [x] Location selector modal with coverage areas
- [x] Area filter tabs
- [x] Category filtering
- [x] Restaurant cards with ratings, delivery info
- [x] Restaurant detail page with menu
- [x] Cart and checkout flow
- [x] Payment method selection (COD, GCash, PayMaya)
- [x] Order tracking page
- [x] Pabili service form
- [x] Profile management
- [x] Restaurant dashboard (orders, menu management)
- [x] Driver dashboard (deliveries, earnings, availability)
- [x] Admin dashboard (users, restaurants, analytics, **promo codes**)
- [x] Bilingual support (EN/Filipino toggle)
- [x] Bottom navigation
- [x] **Checkout promo code input with available promos display**

### Coverage Areas
- Urdaneta City (Main) - ₱30 delivery
- Binalonan - ₱45 delivery
- Asingan - ₱50 delivery
- Villasis - ₱45 delivery
- Manaoag - ₱50 delivery
- San Manuel - ₱45 delivery
- Pozorrubio - ₱55 delivery
- Sison - ₱60 delivery

## Prioritized Backlog

### P0 (Critical)
- [ ] Twilio SMS integration for real OTP
- [ ] PayMongo integration for GCash/PayMaya payments
- [ ] Real-time order updates (WebSocket)

### P1 (High Priority)
- [ ] Google Maps integration for address autocomplete
- [ ] Driver location tracking
- [ ] Push notifications
- [ ] Order rating/review system

### P2 (Medium Priority)
- [ ] Restaurant analytics dashboard
- [ ] Loyalty points program
- [ ] Favorite restaurants
- [ ] Order history export
- [ ] Multi-language (Ilocano, Pangasinan)
- [ ] Scheduled delivery time selection

### P3 (Nice to Have)
- [ ] Restaurant recommendations
- [ ] Loyalty points program
- [ ] Scheduled orders
- [ ] Group ordering

## Tech Stack
- Backend: FastAPI, MongoDB, PyJWT
- Frontend: React 18, Tailwind CSS, Shadcn/UI
- Auth: Phone OTP (Twilio ready)
- Payments: PayMongo ready (GCash, PayMaya)

## Next Tasks
1. Integrate Twilio for real SMS OTP
2. Add PayMongo for actual payment processing
3. Implement real-time order tracking with WebSocket
4. Add Google Maps for address selection
