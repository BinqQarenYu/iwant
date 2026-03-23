import requests
import sys
import json
from datetime import datetime

class KainTayoAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_id = None
        self.restaurant_id = None
        self.menu_item_id = None
        self.order_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_seed_data(self):
        """Test seeding sample data"""
        print("\n🔍 Testing Data Seeding...")
        success, response = self.run_test("Seed Data", "POST", "seed", 200)
        return success

    def test_categories(self):
        """Test categories endpoint"""
        print("\n🔍 Testing Categories...")
        success, response = self.run_test("Get Categories", "GET", "categories", 200)
        if success and response:
            categories = response
            if len(categories) > 0:
                self.log_test("Categories Data Validation", True, f"Found {len(categories)} categories")
            else:
                self.log_test("Categories Data Validation", False, "No categories returned")
        return success

    def test_restaurants(self):
        """Test restaurant endpoints"""
        print("\n🔍 Testing Restaurants...")
        success, response = self.run_test("Get Restaurants", "GET", "restaurants", 200)
        
        if success and response:
            restaurants = response
            if len(restaurants) > 0:
                self.log_test("Restaurants Data Validation", True, f"Found {len(restaurants)} restaurants")
                self.restaurant_id = restaurants[0]['id']
                
                # Test individual restaurant
                success2, restaurant_data = self.run_test(
                    "Get Restaurant Details", 
                    "GET", 
                    f"restaurants/{self.restaurant_id}", 
                    200
                )
                
                if success2 and restaurant_data:
                    if 'restaurant' in restaurant_data and 'menu' in restaurant_data:
                        self.log_test("Restaurant Details Structure", True, "Has restaurant and menu data")
                        if len(restaurant_data['menu']) > 0:
                            self.menu_item_id = restaurant_data['menu'][0]['id']
                            self.log_test("Menu Items Available", True, f"Found {len(restaurant_data['menu'])} menu items")
                        else:
                            self.log_test("Menu Items Available", False, "No menu items found")
                    else:
                        self.log_test("Restaurant Details Structure", False, "Missing restaurant or menu data")
            else:
                self.log_test("Restaurants Data Validation", False, "No restaurants returned")
        
        # Test search functionality
        self.run_test("Search Restaurants", "GET", "restaurants?search=chicken", 200)
        self.run_test("Filter by Cuisine", "GET", "restaurants?cuisine=filipino", 200)
        
        return success

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n🔍 Testing Authentication Flow...")
        
        # Test phone number
        test_phone = "+639171234567"
        
        # Send OTP
        success, response = self.run_test(
            "Send OTP", 
            "POST", 
            "auth/send-otp", 
            200, 
            {"phone": test_phone}
        )
        
        if not success:
            return False
            
        # Get debug OTP from response
        debug_otp = response.get('debug_otp', '123456')
        
        # Verify OTP (new user)
        success, response = self.run_test(
            "Verify OTP (New User)", 
            "POST", 
            "auth/verify-otp", 
            200, 
            {
                "phone": test_phone,
                "otp": debug_otp,
                "name": "Test User",
                "role": "customer"
            }
        )
        
        if success and response:
            self.token = response.get('token')
            user_data = response.get('user', {})
            self.user_id = user_data.get('id')
            
            if self.token:
                self.log_test("Token Generation", True, "Token received")
                
                # Test protected endpoint
                success2, user_profile = self.run_test("Get User Profile", "GET", "auth/me", 200)
                if success2:
                    self.log_test("Protected Endpoint Access", True, "Can access protected routes")
                else:
                    self.log_test("Protected Endpoint Access", False, "Cannot access protected routes")
            else:
                self.log_test("Token Generation", False, "No token received")
        
        return success

    def test_orders_flow(self):
        """Test order creation and management"""
        print("\n🔍 Testing Orders Flow...")
        
        if not self.token or not self.restaurant_id or not self.menu_item_id:
            self.log_test("Order Flow Prerequisites", False, "Missing auth token, restaurant, or menu item")
            return False
        
        # Create order
        order_data = {
            "restaurant_id": self.restaurant_id,
            "items": [
                {
                    "menu_item_id": self.menu_item_id,
                    "quantity": 2,
                    "special_instructions": "Test order"
                }
            ],
            "delivery_address": "123 Test Street, Urdaneta City",
            "payment_method": "cod",
            "special_instructions": "Test delivery"
        }
        
        success, response = self.run_test(
            "Create Order", 
            "POST", 
            "orders", 
            201, 
            order_data
        )
        
        if success and response:
            self.order_id = response.get('id')
            self.log_test("Order Creation", True, f"Order ID: {self.order_id}")
            
            # Get orders list
            success2, orders = self.run_test("Get Orders List", "GET", "orders", 200)
            if success2 and orders:
                self.log_test("Orders List", True, f"Found {len(orders)} orders")
            
            # Get specific order
            if self.order_id:
                success3, order_details = self.run_test(
                    "Get Order Details", 
                    "GET", 
                    f"orders/{self.order_id}", 
                    200
                )
                if success3:
                    self.log_test("Order Details", True, "Can retrieve order details")
        
        return success

    def test_pabili_flow(self):
        """Test Pabili (grocery errand) functionality"""
        print("\n🔍 Testing Pabili Flow...")
        
        if not self.token:
            self.log_test("Pabili Flow Prerequisites", False, "Missing auth token")
            return False
        
        # Create Pabili request
        pabili_data = {
            "items_list": "1kg rice, 2 bottles cooking oil, vegetables",
            "store_location": "SM City Urdaneta",
            "delivery_address": "123 Test Street, Urdaneta City",
            "estimated_budget": 500.0,
            "payment_method": "cod",
            "notes": "Please call when you arrive"
        }
        
        success, response = self.run_test(
            "Create Pabili Request", 
            "POST", 
            "pabili", 
            201, 
            pabili_data
        )
        
        if success and response:
            pabili_id = response.get('id')
            self.log_test("Pabili Creation", True, f"Pabili ID: {pabili_id}")
            
            # Get Pabili requests
            success2, requests_list = self.run_test("Get Pabili Requests", "GET", "pabili", 200)
            if success2:
                self.log_test("Pabili List", True, f"Found {len(requests_list)} requests")
        
        return success

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n🔍 Testing Error Handling...")
        
        # Test invalid endpoints
        self.run_test("Invalid Endpoint", "GET", "nonexistent", 404)
        
        # Test invalid restaurant ID
        self.run_test("Invalid Restaurant ID", "GET", "restaurants/invalid-id", 404)
        
        # Test unauthorized access
        old_token = self.token
        self.token = None
        self.run_test("Unauthorized Access", "GET", "auth/me", 401)
        self.token = old_token
        
        # Test invalid OTP
        self.run_test(
            "Invalid OTP", 
            "POST", 
            "auth/verify-otp", 
            400, 
            {"phone": "+639171234567", "otp": "000000"}
        )

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting KainTayo API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run test suites in order
        self.test_health_check()
        self.test_seed_data()
        self.test_categories()
        self.test_restaurants()
        self.test_auth_flow()
        self.test_orders_flow()
        self.test_pabili_flow()
        self.test_error_handling()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": self.tests_passed/self.tests_run*100 if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = KainTayoAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    if results["failed_tests"] == 0:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {results['failed_tests']} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())