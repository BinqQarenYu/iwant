"""
KainTayo Auth and Role Switching Tests
Tests for:
- Auth session exchange API
- Auth /me endpoint
- Role switching API (customer, rider, merchant, admin)
- Role-specific endpoints (admin analytics, rider profile, etc.)
- Logout functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TOKEN = "test_session_sync_1774272612407"

class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")

    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "KainTayo" in data.get("message", "")
        print("✓ API root endpoint passed")


class TestAuthMe:
    """Tests for /api/auth/me endpoint"""
    
    def test_auth_me_with_valid_token(self):
        """Test /api/auth/me returns user data with valid session token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify user data structure
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert "role" in data
        assert data["email"] == "test@kayntayo.com"
        print(f"✓ Auth /me returned user: {data['name']} ({data['role']})")
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth /me correctly rejects unauthenticated requests")
    
    def test_auth_me_with_invalid_token(self):
        """Test /api/auth/me returns 401 with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401
        print("✓ Auth /me correctly rejects invalid tokens")


class TestRoleSwitching:
    """Tests for /api/auth/switch-role endpoint"""
    
    def test_switch_to_customer(self):
        """Test switching to customer role"""
        response = requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "customer"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "customer"
        print("✓ Switched to customer role")
    
    def test_switch_to_rider(self):
        """Test switching to rider role"""
        response = requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "rider"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "rider"
        print("✓ Switched to rider role")
    
    def test_switch_to_merchant(self):
        """Test switching to merchant role"""
        response = requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "merchant"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "merchant"
        print("✓ Switched to merchant role")
    
    def test_switch_to_admin(self):
        """Test switching to admin role"""
        response = requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "admin"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        print("✓ Switched to admin role")
    
    def test_switch_to_invalid_role(self):
        """Test switching to invalid role returns error"""
        response = requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "superuser"}
        )
        assert response.status_code == 400
        print("✓ Invalid role correctly rejected")
    
    def test_switch_role_without_auth(self):
        """Test switch role without authentication"""
        response = requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Content-Type": "application/json"},
            json={"role": "admin"}
        )
        assert response.status_code == 401
        print("✓ Switch role correctly requires authentication")


class TestAdminEndpoints:
    """Tests for admin-only endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_role(self):
        """Ensure user is admin before each test"""
        requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "admin"}
        )
    
    def test_admin_analytics(self):
        """Test admin analytics endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify analytics structure
        assert "total_users" in data
        assert "total_restaurants" in data
        assert "total_orders" in data
        assert "total_riders" in data
        assert "online_riders" in data
        assert "orders_pending" in data
        assert "total_revenue" in data
        print(f"✓ Admin analytics: {data['total_orders']} orders, {data['total_users']} users")
    
    def test_admin_live_orders(self):
        """Test admin live orders endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/live-orders",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin live orders: {len(data)} active orders")
    
    def test_admin_all_users(self):
        """Test admin get all users endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin users: {len(data)} users")
    
    def test_admin_all_restaurants(self):
        """Test admin get all restaurants endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/restaurants",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin restaurants: {len(data)} restaurants")
    
    def test_admin_all_riders(self):
        """Test admin get all riders endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/riders/all",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin riders: {len(data)} riders")


class TestRiderEndpoints:
    """Tests for rider-specific endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup_rider_role(self):
        """Ensure user is rider before each test"""
        requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "rider"}
        )
    
    def test_rider_profile(self):
        """Test rider profile endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/rider/profile",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        # Profile may or may not exist
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "user_id" in data
            assert "is_online" in data
            print(f"✓ Rider profile exists: online={data['is_online']}")
        else:
            print("✓ Rider profile not found (expected for new rider)")
    
    def test_rider_earnings(self):
        """Test rider earnings endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/rider/earnings",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_deliveries" in data
        assert "total_earnings" in data
        print(f"✓ Rider earnings: {data['total_deliveries']} deliveries, ₱{data['total_earnings']}")
    
    def test_rider_orders(self):
        """Test rider can see available orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Rider orders: {len(data)} orders visible")


class TestMerchantEndpoints:
    """Tests for merchant-specific endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup_merchant_role(self):
        """Ensure user is merchant before each test"""
        requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "merchant"}
        )
    
    def test_my_restaurant(self):
        """Test my-restaurant endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/my-restaurant",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        # May or may not have a restaurant
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            data = response.json()
            if data:
                assert "name" in data
                print(f"✓ Merchant restaurant: {data['name']}")
            else:
                print("✓ Merchant has no restaurant yet")
        else:
            print("✓ Merchant endpoint accessible")
    
    def test_merchant_orders(self):
        """Test merchant can see their orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Merchant orders: {len(data)} orders")


class TestCustomerEndpoints:
    """Tests for customer-specific endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup_customer_role(self):
        """Ensure user is customer before each test"""
        requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "customer"}
        )
    
    def test_restaurants_list(self):
        """Test customer can see restaurants"""
        response = requests.get(f"{BASE_URL}/api/restaurants")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Customer restaurants: {len(data)} available")
    
    def test_customer_orders(self):
        """Test customer can see their orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Customer orders: {len(data)} orders")
    
    def test_categories(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Categories: {len(data)} categories")
    
    def test_coverage_areas(self):
        """Test coverage areas endpoint"""
        response = requests.get(f"{BASE_URL}/api/coverage-areas")
        assert response.status_code == 200
        data = response.json()
        assert "center" in data
        assert "areas" in data
        print(f"✓ Coverage areas: {len(data['areas'])} areas")


class TestRoleAccessControl:
    """Tests for role-based access control"""
    
    def test_admin_endpoint_as_customer(self):
        """Test customer cannot access admin endpoints"""
        # Switch to customer
        requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "customer"}
        )
        
        # Try to access admin analytics
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 403
        print("✓ Customer correctly denied access to admin endpoints")
    
    def test_admin_endpoint_as_rider(self):
        """Test rider cannot access admin endpoints"""
        # Switch to rider
        requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "rider"}
        )
        
        # Try to access admin analytics
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        assert response.status_code == 403
        print("✓ Rider correctly denied access to admin endpoints")


class TestLogout:
    """Tests for logout functionality"""
    
    def test_logout_endpoint(self):
        """Test logout endpoint clears session"""
        # Note: We can't fully test logout as it would invalidate our test token
        # Just verify the endpoint exists and responds
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        # Logout should work even without cookie
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Logout endpoint responds correctly")


# Cleanup: Reset to customer role after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup(request):
    """Reset user to customer role after all tests"""
    def reset_role():
        requests.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"role": "customer"}
        )
    request.addfinalizer(reset_role)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
