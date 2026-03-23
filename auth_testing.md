# Auth-Gated App Testing Playbook for KainTayo

## Test User Credentials
- Session Token: `test_session_sync_1774272612407`
- User ID: `test-user-sync`
- Email: `test@kayntayo.com`
- Current Role: `customer`

## Step 1: Test Backend APIs
```bash
API_URL=https://pabili-connect.preview.emergentagent.com
TOKEN=test_session_sync_1774272612407

# Test auth/me
curl -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Test switch role 
curl -X PUT "$API_URL/api/auth/switch-role" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"role":"admin"}'

# Test admin analytics (after switching to admin)
curl -X GET "$API_URL/api/admin/analytics" -H "Authorization: Bearer $TOKEN"
```

## Step 2: Browser Testing with Cookie Auth
```javascript
await page.context.add_cookies([{
    "name": "session_token",
    "value": "test_session_sync_1774272612407",
    "domain": "pabili-connect.preview.emergentagent.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
}]);
// Also set localStorage:
await page.evaluate(`localStorage.setItem('kayntayo_session', 'test_session_sync_1774272612407')`);
await page.goto("https://pabili-connect.preview.emergentagent.com/dashboard");
```

## Step 3: Checklist
- [ ] /api/auth/me returns user data with session token
- [ ] /api/auth/switch-role switches between customer/rider/merchant/admin
- [ ] Google Auth login page shows "Continue with Google" button
- [ ] Dashboard loads with role-based content
- [ ] Role switcher dropdown works
- [ ] Admin Ops Center shows analytics
- [ ] Rider view shows online/offline toggle
- [ ] Customer view shows restaurants
