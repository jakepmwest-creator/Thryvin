"""
Backend API Tests for Iteration 17:
Testing features as specified by main agent for Thryvin Fitness app on Railway backend:

1. GET /api/health returns ok:true
2. POST /api/auth/login returns accessToken for test@example.com/password123
3. GET /api/exercises?limit=5 returns exercises with videoUrl field
4. GET /api/stats/favorites returns favorites array with exerciseId, exerciseName, actualPB fields
5. GET /api/badges/progress returns badges array with completion data

Note: Frontend is React Native Expo (cannot be browser tested)
RevenueCat is MOCKED

Backend: Express.js + TypeScript on Railway
"""

import pytest
import requests
import os

# Railway production backend URL
BASE_URL = "https://thryvin-production-fbdd.up.railway.app"

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
        print(f"\n✅ Auth token obtained: {token[:30]}...")
        return token
    pytest.skip(f"Authentication failed - status {response.status_code}")


# ==================== FEATURE 1: Health Endpoint ====================
class TestFeature1_HealthEndpoint:
    """Test 1: GET /api/health returns ok:true on Railway"""

    def test_health_returns_ok_true(self):
        """GET /api/health returns {ok: true}"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok:true, got ok:{data.get('ok')}"
        print(f"✅ /api/health returns ok:true")
    
    def test_health_has_required_fields(self):
        """Health endpoint returns required fields"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields are present
        assert "ok" in data, "Missing 'ok' field"
        assert "dbOk" in data, "Missing 'dbOk' field"
        assert "features" in data, "Missing 'features' field"
        assert data.get("dbOk") == True, f"Database not healthy: dbOk={data.get('dbOk')}"
        
        print(f"✅ Health endpoint has all required fields: ok={data.get('ok')}, dbOk={data.get('dbOk')}")
    
    def test_health_shows_features_enabled(self):
        """Health endpoint shows AI/Coach features enabled"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        features = data.get("features", {})
        
        # Check AI/Coach features
        ai_enabled = features.get("AI_ENABLED", False)
        awards_enabled = features.get("AWARDS_ENABLED", False)
        
        assert ai_enabled, f"AI_ENABLED should be true. Features: {features}"
        assert awards_enabled, f"AWARDS_ENABLED should be true for badge system. Features: {features}"
        
        print(f"✅ Features enabled - AI: {ai_enabled}, AWARDS: {awards_enabled}")


# ==================== FEATURE 2: Auth Login ====================
class TestFeature2_AuthLogin:
    """Test 2: POST /api/auth/login returns accessToken"""

    def test_login_returns_access_token(self):
        """Login with valid credentials returns accessToken"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}. Response: {response.text[:200]}"
        
        data = response.json()
        assert data.get("ok") == True, f"Login ok:false - {data}"
        assert "accessToken" in data, f"Missing accessToken in response"
        assert isinstance(data["accessToken"], str), "accessToken should be string"
        assert len(data["accessToken"]) > 50, "accessToken seems too short for JWT"
        
        print(f"✅ Login successful, accessToken length: {len(data['accessToken'])}")
    
    def test_login_returns_user_data(self):
        """Login returns user data with id and email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        user = data.get("user", {})
        
        assert "id" in user, "Missing user.id"
        assert user.get("email") == TEST_EMAIL, f"User email mismatch: {user.get('email')}"
        
        print(f"✅ Login returned user: id={user.get('id')}, email={user.get('email')}")

    def test_login_invalid_credentials_fails(self):
        """Login with invalid credentials returns error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@example.com", "password": "wrongpassword"},
            timeout=30
        )
        # Should not return 200 with valid token
        if response.status_code == 200:
            data = response.json()
            assert data.get("ok") != True, "Login succeeded with invalid credentials!"
        else:
            assert response.status_code in [401, 400, 404], f"Unexpected error code: {response.status_code}"
        
        print(f"✅ Invalid credentials correctly rejected with status {response.status_code}")


# ==================== FEATURE 3: Exercises with VideoUrl ====================
class TestFeature3_ExercisesWithVideoURL:
    """Test 3: GET /api/exercises?limit=5 returns exercises with videoUrl"""

    def test_exercises_returns_array(self):
        """Exercises endpoint returns array with correct limit"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"limit": 5},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        assert isinstance(exercises, list), "exercises should be an array"
        assert len(exercises) == 5, f"Expected 5 exercises, got {len(exercises)}"
        
        print(f"✅ /api/exercises returns {len(exercises)} exercises")

    def test_exercises_have_video_urls(self):
        """Each exercise has a valid videoUrl field"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"limit": 5},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        for i, exercise in enumerate(exercises):
            assert "videoUrl" in exercise, f"Exercise {i} missing videoUrl field"
            assert exercise["videoUrl"] is not None, \
                f"Exercise '{exercise.get('name', 'unknown')}' has null videoUrl"
            assert exercise["videoUrl"].startswith("http"), \
                f"Exercise videoUrl not valid URL: {exercise['videoUrl']}"
            print(f"  ✓ '{exercise['name']}': video URL present")
        
        print(f"✅ All {len(exercises)} exercises have valid videoUrl fields")

    def test_exercises_have_required_fields(self):
        """Exercises have all required fields for the app"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"limit": 5},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        required_fields = ["id", "name", "videoUrl"]
        for exercise in exercises:
            for field in required_fields:
                assert field in exercise, f"Exercise missing required field: {field}"
        
        print(f"✅ All exercises have required fields: {required_fields}")


# ==================== FEATURE 4: Stats/Favorites ====================
class TestFeature4_StatsFavorites:
    """Test 4: GET /api/stats/favorites returns favorites array with exerciseId, exerciseName, actualPB"""

    def test_favorites_requires_auth(self):
        """Favorites endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/stats/favorites",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"✅ Favorites endpoint correctly requires authentication")

    def test_favorites_returns_array(self, auth_token):
        """Favorites endpoint returns favorites array"""
        response = requests.get(
            f"{BASE_URL}/api/stats/favorites",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text[:200]}"
        
        data = response.json()
        assert "favorites" in data, "Response missing 'favorites' field"
        assert isinstance(data["favorites"], list), "favorites should be an array"
        
        print(f"✅ Favorites endpoint returns array with {len(data['favorites'])} items")

    def test_favorites_have_required_fields(self, auth_token):
        """Each favorite has exerciseId, exerciseName, and actualPB fields"""
        response = requests.get(
            f"{BASE_URL}/api/stats/favorites",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        favorites = data.get("favorites", [])
        
        if len(favorites) == 0:
            print("⚠️ No favorites to test - user has no favorite exercises set")
            return
        
        required_fields = ["exerciseId", "exerciseName", "actualPB"]
        for fav in favorites:
            for field in required_fields:
                assert field in fav, f"Favorite missing required field: {field}. Got: {list(fav.keys())}"
            print(f"  ✓ {fav['exerciseName']}: PB={fav['actualPB']}")
        
        print(f"✅ All {len(favorites)} favorites have required fields: {required_fields}")

    def test_favorites_actualPB_is_numeric(self, auth_token):
        """actualPB field contains numeric values"""
        response = requests.get(
            f"{BASE_URL}/api/stats/favorites",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        favorites = data.get("favorites", [])
        
        for fav in favorites:
            pb = fav.get("actualPB")
            assert pb is None or isinstance(pb, (int, float)), \
                f"actualPB should be numeric, got: {type(pb)} for {fav.get('exerciseName')}"
        
        print(f"✅ All actualPB values are numeric")


# ==================== FEATURE 5: Badges Progress ====================
class TestFeature5_BadgesProgress:
    """Test 5: GET /api/badges/progress returns badges array with completion data"""

    def test_badges_progress_requires_auth(self):
        """Badges progress endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"✅ Badges progress endpoint correctly requires authentication")

    def test_badges_progress_returns_array(self, auth_token):
        """Badges progress returns badges array"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text[:200]}"
        
        data = response.json()
        assert "badges" in data, "Response missing 'badges' field"
        assert isinstance(data["badges"], list), "badges should be an array"
        assert len(data["badges"]) > 0, "badges array is empty"
        
        print(f"✅ Badges progress returns array with {len(data['badges'])} badges")

    def test_badges_have_completion_fields(self, auth_token):
        """Each badge has badgeId, progress, completed fields"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        badges = data.get("badges", [])
        
        required_fields = ["badgeId", "progress", "completed"]
        for badge in badges[:5]:  # Check first 5 badges
            for field in required_fields:
                assert field in badge, f"Badge missing required field: {field}. Got: {list(badge.keys())}"
        
        print(f"✅ Badges have required fields: {required_fields}")

    def test_badges_completed_status(self, auth_token):
        """Check badge completion status structure"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        badges = data.get("badges", [])
        
        completed_count = 0
        for badge in badges:
            assert isinstance(badge.get("completed"), bool), \
                f"'completed' should be boolean for {badge.get('badgeId')}"
            assert isinstance(badge.get("progress"), (int, float)), \
                f"'progress' should be numeric for {badge.get('badgeId')}"
            if badge.get("completed"):
                completed_count += 1
                # Completed badges should have unlockedAt
                if "unlockedAt" in badge:
                    print(f"  ✓ {badge['badgeId']}: completed at {badge.get('unlockedAt', 'N/A')[:10]}")
        
        print(f"✅ Badges structure valid. Completed: {completed_count}/{len(badges)}")

    def test_badges_island_data(self, auth_token):
        """Check island progression data is present"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have totalXP and currentIsland for island progression
        assert "totalXP" in data, "Missing 'totalXP' field for island progression"
        assert "currentIsland" in data, "Missing 'currentIsland' field for island progression"
        assert isinstance(data["currentIsland"], int), "currentIsland should be integer"
        
        print(f"✅ Island data present: currentIsland={data['currentIsland']}, totalXP={data['totalXP']}")


# ==================== Additional Integration Tests ====================
class TestIntegration_AuthenticatedFlow:
    """Integration tests for authenticated user flows"""

    def test_full_auth_flow(self):
        """Test complete authentication and data retrieval flow"""
        # 1. Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        assert login_response.status_code == 200
        token = login_response.json().get("accessToken")
        
        # 2. Get favorites
        favorites_response = requests.get(
            f"{BASE_URL}/api/stats/favorites",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        assert favorites_response.status_code == 200
        
        # 3. Get badges
        badges_response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        assert badges_response.status_code == 200
        
        print(f"✅ Full auth flow works: login → favorites → badges")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
