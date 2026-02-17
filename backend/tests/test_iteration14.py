"""
Backend API Tests for Iteration 14:
Testing the 5 features specified by main agent:
1. GET /api/exercises?limit=5 returns exercises with video URLs
2. GET /api/health returns ok:true
3. GET /api/workouts/user-schedule returns workout data for authenticated user
4. Backend server runs without errors on port 8001
5. POST /api/auth/login with test@example.com/password123 returns accessToken

Note: Frontend is React Native Expo (cannot be browser tested)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token once for all tests that need it"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        token = response.json().get("accessToken")
        print(f"✅ Auth token obtained: {token[:20]}...")
        return token
    pytest.skip("Authentication failed - skipping authenticated tests")


class TestFeature1_ExercisesWithVideoURLs:
    """Test 1: GET /api/exercises?limit=5 returns exercises with video URLs"""
    
    def test_exercises_endpoint_returns_5_exercises(self):
        """GET /api/exercises?limit=5 returns 5 exercises"""
        response = requests.get(f"{BASE_URL}/api/exercises", params={"limit": 5})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        assert len(exercises) == 5, f"Expected 5 exercises, got {len(exercises)}"
        print(f"✅ /api/exercises?limit=5 returned {len(exercises)} exercises")
    
    def test_exercises_have_video_urls(self):
        """Each exercise has a videoUrl field"""
        response = requests.get(f"{BASE_URL}/api/exercises", params={"limit": 5})
        assert response.status_code == 200
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        for i, exercise in enumerate(exercises):
            assert "videoUrl" in exercise, f"Exercise {i} missing videoUrl field"
            assert exercise["videoUrl"] is not None, f"Exercise {i} ({exercise.get('name', 'unknown')}) has null videoUrl"
            assert exercise["videoUrl"].startswith("http"), f"Exercise {i} videoUrl not a valid URL: {exercise['videoUrl']}"
            print(f"  ✓ Exercise '{exercise['name']}' has videoUrl: {exercise['videoUrl'][:50]}...")
        
        print(f"✅ All {len(exercises)} exercises have valid videoUrl fields")
    
    def test_exercises_response_structure(self):
        """Exercises response has proper structure with id, name, slug, bodyPart"""
        response = requests.get(f"{BASE_URL}/api/exercises", params={"limit": 5})
        assert response.status_code == 200
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        required_fields = ["id", "name", "slug", "bodyPart", "category", "videoUrl"]
        
        for exercise in exercises:
            for field in required_fields:
                assert field in exercise, f"Exercise missing field: {field}"
        
        print(f"✅ All exercises have required fields: {required_fields}")


class TestFeature2_HealthEndpoint:
    """Test 2: GET /api/health returns ok:true"""
    
    def test_health_returns_ok_true(self):
        """GET /api/health returns {ok: true}"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok:true, got ok:{data.get('ok')}"
        print(f"✅ /api/health returns ok:true")
    
    def test_health_has_timestamp(self):
        """Health endpoint returns timestamp"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "timestamp" in data, "Missing timestamp field"
        print(f"✅ Health check timestamp: {data.get('timestamp')}")
    
    def test_health_has_feature_flags(self):
        """Health endpoint returns feature flags"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "features" in data, "Missing features field"
        
        features = data.get("features", {})
        expected_features = ["AI_ENABLED", "COACH_ENABLED", "SOCIAL_ENABLED", "AWARDS_ENABLED"]
        
        for feature in expected_features:
            assert feature in features, f"Missing feature flag: {feature}"
        
        print(f"✅ Health check features: {list(features.keys())}")
    
    def test_health_db_ok(self):
        """Health endpoint returns dbOk status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "dbOk" in data, "Missing dbOk field"
        assert data.get("dbOk") == True, f"Database not healthy: dbOk={data.get('dbOk')}"
        print(f"✅ Database health check passed: dbOk={data.get('dbOk')}")


class TestFeature3_UserScheduleEndpoint:
    """Test 3: GET /api/workouts/user-schedule returns workout data for authenticated user"""
    
    def test_user_schedule_requires_auth(self):
        """User schedule endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/workouts/user-schedule")
        assert response.status_code in [401, 400], f"Expected 401/400 without auth, got {response.status_code}"
        print(f"✅ /api/workouts/user-schedule requires auth (status: {response.status_code})")
    
    def test_user_schedule_requires_date_params(self, auth_token):
        """User schedule requires start and end date parameters"""
        response = requests.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400, f"Expected 400 without dates, got {response.status_code}"
        
        data = response.json()
        assert "start and end date" in data.get("error", "").lower(), \
            f"Expected date requirement error, got: {data}"
        print(f"✅ User schedule requires date parameters")
    
    def test_user_schedule_returns_workouts(self, auth_token):
        """User schedule with auth and dates returns workout array"""
        response = requests.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={
                "start": "2026-02-17",
                "end": "2026-02-23"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        assert len(data) > 0, "Expected at least one workout day"
        print(f"✅ User schedule returned {len(data)} workout days")
    
    def test_user_schedule_workout_structure(self, auth_token):
        """Each workout in schedule has required fields"""
        response = requests.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={
                "start": "2026-02-17",
                "end": "2026-02-23"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Check first non-rest workout for structure
        for workout in data:
            if not workout.get("isRestDay", False):
                required_fields = ["id", "date", "title", "type", "duration", "exercises"]
                for field in required_fields:
                    assert field in workout, f"Workout missing field: {field}"
                
                # Check exercises have video URLs
                exercises = workout.get("exercises", [])
                assert len(exercises) > 0, f"Workout has no exercises: {workout.get('title')}"
                
                for exercise in exercises:
                    if exercise.get("category") != "warmup" and exercise.get("category") != "cooldown":
                        assert "videoUrl" in exercise, f"Exercise missing videoUrl: {exercise.get('name')}"
                
                print(f"✅ Workout '{workout['title']}' has {len(exercises)} exercises with video URLs")
                break


class TestFeature4_BackendServerRunning:
    """Test 4: Backend server runs without errors on port 8001"""
    
    def test_server_responding(self):
        """Server is responding to requests"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Server not responding correctly: {response.status_code}"
        print(f"✅ Backend server is running and responding")
    
    def test_version_endpoint(self):
        """Server version endpoint works"""
        response = requests.get(f"{BASE_URL}/api/version")
        assert response.status_code == 200, f"Version endpoint failed: {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, "Version endpoint ok:false"
        assert "commit" in data or "version" in data, "Missing version/commit info"
        print(f"✅ Server version: commit={data.get('commit', 'unknown')}")
    
    def test_multiple_endpoints_respond(self):
        """Multiple API endpoints are functional"""
        endpoints = [
            "/api/health",
            "/api/version",
            "/api/exercises?limit=1",
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            assert response.status_code == 200, f"Endpoint {endpoint} failed: {response.status_code}"
            print(f"  ✓ {endpoint} - OK")
        
        print(f"✅ All {len(endpoints)} endpoints responding correctly")


class TestFeature5_AuthLogin:
    """Test 5: POST /api/auth/login with test@example.com/password123 returns accessToken"""
    
    def test_login_success(self):
        """Login with valid credentials returns accessToken"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, f"Login ok:false - {data}"
        assert "accessToken" in data, f"Missing accessToken in response"
        assert isinstance(data["accessToken"], str), "accessToken should be string"
        assert len(data["accessToken"]) > 50, "accessToken seems too short for JWT"
        
        print(f"✅ Login successful, accessToken length: {len(data['accessToken'])}")
    
    def test_login_returns_user_data(self):
        """Login returns user data with required fields"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        
        data = response.json()
        user = data.get("user", {})
        
        assert "id" in user, "Missing user.id"
        assert user.get("email") == TEST_EMAIL, f"User email mismatch: {user.get('email')}"
        
        print(f"✅ Login returned user: id={user.get('id')}, email={user.get('email')}")
    
    def test_login_invalid_credentials(self):
        """Login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401 for invalid login, got {response.status_code}"
        print(f"✅ Invalid login correctly rejected with 401")
    
    def test_login_missing_password(self):
        """Login with missing password returns error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL}
        )
        assert response.status_code in [400, 401], f"Expected 400/401 for missing password, got {response.status_code}"
        print(f"✅ Missing password correctly rejected with {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
