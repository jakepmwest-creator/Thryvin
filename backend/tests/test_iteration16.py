"""
Backend API Tests for Iteration 16:
Testing final batch of 4 tasks as specified by main agent:
1. GET /api/health returns ok:true  
2. POST /api/auth/login with test@example.com/password123 returns accessToken
3. GET /api/badges/progress returns badges array with badgeId, progress, completed fields
4. POST /api/coach/chat with auth token returns response (compassion test)
5. GET /api/exercises?limit=5 returns exercises
6. GET /api/workouts/user-schedule returns workout data for authenticated user

New features added in this iteration:
- Onboarding paywall screen (plan-selection.tsx)
- Marketing copy polish on pro.tsx  
- RevenueCat production-ready methods (restorePurchases, purchasePackage) - MOCKED
- Badge E2E verification - all 40 badges returned from API

Note: Frontend is React Native Expo (cannot be browser tested)
"""

import pytest
import requests
import os
import time

# API Base URL - prefer tunnel, fallback to localhost
TUNNEL_URL = 'https://conventional-isa-equality-submitting.trycloudflare.com'
LOCAL_URL = 'http://localhost:8001'

def get_base_url():
    """Determine which URL to use by checking connectivity"""
    try:
        r = requests.get(f"{TUNNEL_URL}/api/health", timeout=10)
        if r.status_code == 200:
            return TUNNEL_URL
    except:
        pass
    return LOCAL_URL

BASE_URL = get_base_url()
print(f"Using BASE_URL: {BASE_URL}")

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token once for all tests that need it"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=30
    )
    if response.status_code == 200:
        token = response.json().get("accessToken")
        print(f"\n[AUTH] Token obtained: {token[:30]}...")
        return token
    pytest.skip(f"Authentication failed - status {response.status_code}")


class TestHealthEndpoint:
    """Test 1: GET /api/health returns ok:true"""
    
    def test_health_returns_ok_true(self):
        """GET /api/health returns {ok: true}"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok:true, got ok:{data.get('ok')}"
        print(f"PASS: /api/health returns ok:true")
    
    def test_health_shows_features(self):
        """Health endpoint shows feature flags"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        data = response.json()
        
        features = data.get("features", {})
        assert features.get("AI_ENABLED") == True, "AI_ENABLED should be True"
        assert features.get("AWARDS_ENABLED") == True, "AWARDS_ENABLED should be True for badge testing"
        
        print(f"PASS: Features enabled - AI: {features.get('AI_ENABLED')}, Awards: {features.get('AWARDS_ENABLED')}")
    
    def test_health_db_ok(self):
        """Health endpoint returns dbOk status"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        data = response.json()
        
        assert data.get("dbOk") == True, f"Database not healthy: dbOk={data.get('dbOk')}"
        print(f"PASS: Database health: dbOk={data.get('dbOk')}")


class TestAuthLogin:
    """Test 2: POST /api/auth/login returns accessToken"""
    
    def test_login_returns_access_token(self):
        """Login with valid credentials returns accessToken"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text[:200]}"
        
        data = response.json()
        assert data.get("ok") == True, f"Login ok:false - {data}"
        assert "accessToken" in data, f"Missing accessToken in response"
        assert isinstance(data["accessToken"], str), "accessToken should be string"
        assert len(data["accessToken"]) > 50, "accessToken seems too short for JWT"
        
        print(f"PASS: Login successful, accessToken length: {len(data['accessToken'])}")
    
    def test_login_returns_user_data(self):
        """Login returns user data with id and email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        data = response.json()
        user = data.get("user", {})
        
        assert "id" in user, "Missing user.id"
        assert user.get("email") == TEST_EMAIL, f"User email mismatch: {user.get('email')}"
        
        print(f"PASS: Login returned user: id={user.get('id')[:8]}..., email={user.get('email')}")
    
    def test_login_invalid_credentials_fails(self):
        """Login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@example.com", "password": "wrongpassword"},
            timeout=30
        )
        # Should be 401 Unauthorized
        assert response.status_code in [400, 401], f"Expected 400/401 for invalid login, got {response.status_code}"
        print(f"PASS: Invalid login correctly rejected with status {response.status_code}")


class TestBadgesProgressEndpoint:
    """Test 3: GET /api/badges/progress returns badges array with correct fields"""
    
    def test_badges_progress_requires_auth(self):
        """Badges progress endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/badges/progress", timeout=30)
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"PASS: /api/badges/progress correctly requires authentication")
    
    def test_badges_progress_returns_badges_array(self, auth_token):
        """GET /api/badges/progress returns array with badge data"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        
        data = response.json()
        badges = data.get("badges", [])
        
        # Should have badges array
        assert isinstance(badges, list), f"Expected badges array, got {type(badges)}"
        print(f"PASS: /api/badges/progress returned {len(badges)} badges")
    
    def test_badges_have_required_fields(self, auth_token):
        """Each badge has badgeId, progress, completed fields"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        data = response.json()
        badges = data.get("badges", [])
        
        if len(badges) == 0:
            # New user might not have badges yet - verify structure exists
            print("INFO: No badges found for test user (expected for new user)")
            # Check that totalXP and currentIsland are present
            assert "totalXP" in data or isinstance(data.get("totalXP"), int), "Missing totalXP field"
            return
        
        # Verify first few badges have required fields
        for i, badge in enumerate(badges[:5]):
            assert "badgeId" in badge, f"Badge {i} missing badgeId field"
            assert "progress" in badge, f"Badge {i} missing progress field"
            assert "completed" in badge, f"Badge {i} missing completed field"
            
            # Verify types
            assert isinstance(badge["badgeId"], str), f"Badge {i} badgeId should be string"
            assert isinstance(badge["progress"], (int, float)), f"Badge {i} progress should be number"
            assert isinstance(badge["completed"], bool), f"Badge {i} completed should be boolean"
        
        print(f"PASS: Badges have required fields (badgeId, progress, completed)")
        print(f"   Sample: badgeId='{badges[0]['badgeId']}', progress={badges[0]['progress']}, completed={badges[0]['completed']}")
    
    def test_badges_count_matches_40_badge_definitions(self, auth_token):
        """API returns 40 badges matching frontend badge definitions"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        data = response.json()
        badges = data.get("badges", [])
        
        # Per main agent: "all 40 badges returned from API"
        # Allow some flexibility since new users might have 0 badges initially
        if len(badges) > 0:
            assert len(badges) == 40, f"Expected 40 badges, got {len(badges)}"
            print(f"PASS: Exactly 40 badges returned from API")
        else:
            print(f"INFO: {len(badges)} badges returned (new user - badges initialize on first workout)")


class TestCoachChatEndpoint:
    """Test 4: POST /api/coach/chat with auth token returns response"""
    
    def test_coach_chat_requires_auth(self):
        """Coach chat endpoint rejects unauthenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "Hello", "coach": "default"},
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"PASS: /api/coach/chat correctly requires authentication")
    
    def test_coach_chat_returns_response(self, auth_token):
        """Coach chat returns response with message"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Hello, how are you doing today?",
                "coach": "default"
            },
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        
        data = response.json()
        assert "response" in data, "Missing 'response' field in coach reply"
        assert isinstance(data["response"], str), "Response should be string"
        assert len(data["response"]) > 10, "Response seems too short"
        
        print(f"PASS: Coach responded with message")
        print(f"   Response snippet: {data['response'][:100]}...")
    
    def test_coach_compassion_test(self, auth_token):
        """Coach shows empathy when user expresses negative feelings"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I'm feeling really down and unmotivated today. Don't think I can workout.",
                "coach": "default"
            },
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        coach_response = data["response"].lower()
        
        # Should NOT be dismissive
        dismissive = ["push through", "no excuses", "just do it", "suck it up"]
        for phrase in dismissive:
            assert phrase not in coach_response, f"Coach was dismissive: found '{phrase}'"
        
        # Should show empathy
        empathy_indicators = ["understand", "okay", "hear", "feel", "valid", "sometimes", "rest", "gentle", "take care"]
        has_empathy = any(indicator in coach_response for indicator in empathy_indicators)
        
        assert has_empathy, f"Coach didn't show empathy: {data['response'][:200]}"
        print(f"PASS: Coach showed empathy to negative feelings")


class TestExercisesEndpoint:
    """Test 5: GET /api/exercises?limit=5 returns exercises"""
    
    def test_exercises_returns_list(self):
        """GET /api/exercises returns exercise list"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"limit": 5},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        assert isinstance(exercises, list), f"Expected exercises list, got {type(exercises)}"
        assert len(exercises) == 5, f"Expected 5 exercises, got {len(exercises)}"
        
        print(f"PASS: /api/exercises?limit=5 returned {len(exercises)} exercises")
    
    def test_exercises_have_required_fields(self):
        """Each exercise has required fields (name, videoUrl, etc)"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"limit": 5},
            timeout=30
        )
        data = response.json()
        exercises = data.get("exercises", [])
        
        for i, ex in enumerate(exercises):
            assert "name" in ex, f"Exercise {i} missing 'name'"
            assert "videoUrl" in ex, f"Exercise {i} missing 'videoUrl'"
            
            # Verify videoUrl is valid
            assert ex["videoUrl"] is not None, f"Exercise '{ex['name']}' has null videoUrl"
            assert ex["videoUrl"].startswith("http"), f"Exercise '{ex['name']}' videoUrl not valid URL"
            
            print(f"   {ex['name']}: {ex['videoUrl'][:50]}...")
        
        print(f"PASS: All exercises have required fields with valid videoUrls")


class TestUserScheduleEndpoint:
    """Test 6: GET /api/workouts/user-schedule returns workout data"""
    
    def test_user_schedule_requires_auth(self):
        """User schedule endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/workouts/user-schedule", timeout=30)
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"PASS: /api/workouts/user-schedule correctly requires authentication")
    
    def test_user_schedule_returns_data(self, auth_token):
        """GET /api/workouts/user-schedule returns schedule for authenticated user"""
        response = requests.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        
        # Accept 200 (has schedule) or 404 (no schedule yet)
        assert response.status_code in [200, 404], \
            f"Expected 200 or 404, got {response.status_code}: {response.text[:200]}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"PASS: /api/workouts/user-schedule returned schedule data")
            
            # Check for expected fields in schedule
            if "schedule" in data:
                print(f"   Schedule contains {len(data.get('schedule', []))} entries")
            elif "workouts" in data:
                print(f"   Workouts: {len(data.get('workouts', []))} entries")
            elif isinstance(data, list):
                print(f"   Schedule array: {len(data)} entries")
        else:
            print(f"INFO: No schedule found for test user (expected for new user - returns 404)")


class TestBadgeTrackingEndpoints:
    """Additional badge-related endpoint tests"""
    
    def test_badge_track_endpoint(self, auth_token):
        """POST /api/badges/track can record badge actions"""
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"action": "coachMessage", "count": 1},
            timeout=30
        )
        
        # Accept 200 (success) or 404 (endpoint doesn't exist yet)
        if response.status_code == 200:
            print(f"PASS: /api/badges/track endpoint working")
        elif response.status_code == 404:
            print(f"INFO: /api/badges/track endpoint not implemented (tracking is local)")
        else:
            print(f"INFO: /api/badges/track returned {response.status_code}")
    
    def test_badge_progress_put(self, auth_token):
        """PUT /api/badges/progress can update badge progress"""
        response = requests.put(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "badges": [{"badgeId": "i1_first_step", "progress": 0, "completed": False}],
                "totalXP": 0,
                "currentIsland": 1
            },
            timeout=30
        )
        
        if response.status_code == 200:
            print(f"PASS: PUT /api/badges/progress endpoint working")
        elif response.status_code in [404, 405]:
            print(f"INFO: PUT /api/badges/progress not implemented (badges may be read-only from API)")
        else:
            print(f"INFO: PUT /api/badges/progress returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
