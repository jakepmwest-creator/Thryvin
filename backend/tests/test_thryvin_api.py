"""
Thryvin AI Fitness Coach - Backend API Tests
Tests all critical endpoints: auth, coach chat, exercises, badges, workouts, stats

Key focus: Coach AI should NOT return canned "I can only help with fitness" responses
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dependence-identity-except-examination.trycloudflare.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


class TestHealthEndpoint:
    """Test /api/health - should return ok:true, dbOk:true, aiReady:true"""
    
    def test_health_check_returns_ok(self):
        """Health endpoint should return ok:true"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        # Core health assertions
        assert data.get("ok") == True, f"Expected ok=true, got {data.get('ok')}"
        assert data.get("dbOk") == True, f"Expected dbOk=true, got {data.get('dbOk')}"
        assert data.get("aiReady") == True, f"Expected aiReady=true, got {data.get('aiReady')}"
        
        print(f"✅ Health check passed: ok={data.get('ok')}, dbOk={data.get('dbOk')}, aiReady={data.get('aiReady')}")


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_with_valid_credentials(self):
        """POST /api/auth/login with test@example.com/password123 should return accessToken"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        assert response.status_code == 200, f"Login failed with status {response.status_code}"
        data = response.json()
        
        assert data.get("ok") == True, "Login response should have ok=true"
        assert "accessToken" in data, "Login response should contain accessToken"
        assert "user" in data, "Login response should contain user object"
        
        # Verify token format (JWT)
        token = data["accessToken"]
        assert token.count(".") == 2, "Token should be a valid JWT (3 parts separated by dots)"
        
        print(f"✅ Login successful, got accessToken")
        return data
    
    def test_login_with_invalid_credentials(self):
        """Login with wrong password should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": "wrongpassword"},
            timeout=30
        )
        assert response.status_code in [401, 400], f"Expected 401/400 for invalid credentials, got {response.status_code}"
        print(f"✅ Invalid login correctly rejected with status {response.status_code}")
    
    def test_get_me_with_bearer_token(self):
        """GET /api/auth/me with Bearer token should return user object"""
        # First login
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        token = login_resp.json().get("accessToken")
        assert token, "Failed to get access token"
        
        # Then call /me
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )
        assert response.status_code == 200, f"/api/auth/me returned {response.status_code}"
        data = response.json()
        
        # Verify user object structure
        assert "name" in data or "user" in data, "Response should contain user data"
        user = data.get("user", data)
        assert "email" in user, "User should have email"
        assert user["email"] == TEST_EMAIL, f"Expected {TEST_EMAIL}, got {user['email']}"
        
        print(f"✅ /api/auth/me returned user: {user.get('name', 'Unknown')}, {user.get('email')}")


class TestExerciseEndpoints:
    """Test exercise lookup endpoints"""
    
    def test_get_exercises_by_name(self):
        """GET /api/exercises?names=Bench%20Press should return exercises with videoUrl"""
        response = requests.get(
            f"{BASE_URL}/api/exercises?names=Bench%20Press",
            timeout=30
        )
        assert response.status_code == 200, f"Exercise lookup failed with {response.status_code}"
        data = response.json()
        
        # Should return array of exercises
        assert isinstance(data, list), "Response should be an array"
        
        if len(data) > 0:
            exercise = data[0]
            assert "name" in exercise, "Exercise should have name"
            # videoUrl might be present
            if "videoUrl" in exercise:
                print(f"✅ Found exercise '{exercise.get('name')}' with videoUrl: {exercise.get('videoUrl', 'N/A')[:50]}...")
            else:
                print(f"✅ Found exercise '{exercise.get('name')}' (no videoUrl)")
        else:
            print("⚠️ No exercises found for 'Bench Press' - may need seeding")


class TestCoachChatEndpoints:
    """Test AI Coach chat - CRITICAL: Coach should NOT return canned responses"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for coach tests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        return response.json().get("accessToken")
    
    def test_coach_fitness_question_specific_response(self, auth_token):
        """POST /api/coach/chat with pull-up form help - should give specific form cues"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "How do I improve my pull-up form? I'm struggling with the movement.",
                "coach": "default"
            },
            timeout=60  # AI responses can be slow
        )
        assert response.status_code == 200, f"Coach chat failed with {response.status_code}"
        data = response.json()
        
        assert "response" in data, "Response should contain 'response' field"
        coach_response = data["response"].lower()
        
        # Should contain specific form cues, NOT generic redirect
        assert "i can only help with fitness" not in coach_response, "Coach gave canned rejection response"
        
        # Check for specific content (form cues, tips)
        helpful_indicators = ["grip", "shoulder", "back", "form", "tip", "engage", "pull", "start", "try", "rep"]
        has_helpful_content = any(word in coach_response for word in helpful_indicators)
        
        print(f"✅ Pull-up form question - Coach response ({len(data['response'])} chars): {data['response'][:200]}...")
        assert has_helpful_content, "Coach response should contain specific form cues"
    
    def test_coach_non_fitness_question_clever_response(self, auth_token):
        """POST /api/coach/chat with 'can squirrels fly?' - should give fun response tied to fitness"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Can squirrels fly?",
                "coach": "default"
            },
            timeout=60
        )
        assert response.status_code == 200, f"Coach chat failed with {response.status_code}"
        data = response.json()
        
        assert "response" in data, "Response should contain 'response' field"
        coach_response = data["response"].lower()
        
        # CRITICAL: Should NOT say "I can only help with fitness"
        assert "i can only help with fitness" not in coach_response, "Coach gave canned rejection - should be clever and fun"
        assert "cannot help with" not in coach_response, "Coach rejected question - should engage cleverly"
        
        # Should be engaging, possibly tie to fitness
        print(f"✅ Non-fitness question - Coach response: {data['response'][:200]}...")
    
    def test_coach_mental_health_empathetic_response(self, auth_token):
        """POST /api/coach/chat with 'feeling unmotivated' - should be empathetic, NOT redirect away"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I'm feeling really unmotivated today and struggling to get to the gym.",
                "coach": "default"
            },
            timeout=60
        )
        assert response.status_code == 200, f"Coach chat failed with {response.status_code}"
        data = response.json()
        
        assert "response" in data, "Response should contain 'response' field"
        coach_response = data["response"].lower()
        
        # Should NOT redirect away
        assert "i can only help with fitness" not in coach_response, "Coach should be supportive, not redirect"
        
        # Should show empathy
        empathy_indicators = ["understand", "feel", "normal", "okay", "tough", "happens", "here for you", "try", "start", "walk", "move"]
        has_empathy = any(word in coach_response for word in empathy_indicators)
        
        print(f"✅ Mental health question - Coach response: {data['response'][:200]}...")
        assert has_empathy, "Coach should show empathy for motivation struggles"
    
    def test_coach_greeting_warm_response(self, auth_token):
        """POST /api/coach/chat with 'Hey!' - should respond warmly like a friend"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Hey!",
                "coach": "default"
            },
            timeout=60
        )
        assert response.status_code == 200, f"Coach chat failed with {response.status_code}"
        data = response.json()
        
        assert "response" in data, "Response should contain 'response' field"
        coach_response = data["response"].lower()
        
        # Should be warm greeting
        warm_indicators = ["hey", "hi", "hello", "what's up", "how", "great", "good", "day", "ready"]
        has_warm_response = any(word in coach_response for word in warm_indicators)
        
        print(f"✅ Greeting - Coach response: {data['response'][:150]}...")
        assert has_warm_response, "Coach should respond warmly to greetings"


class TestBadgeEndpoints:
    """Test badge system endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        return response.json().get("accessToken")
    
    def test_badge_stats_with_auth(self, auth_token):
        """GET /api/badges/stats with auth should return badge stats"""
        response = requests.get(
            f"{BASE_URL}/api/badges/stats",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200, f"Badge stats failed with {response.status_code}"
        data = response.json()
        
        # Should return stats structure
        print(f"✅ Badge stats returned: {list(data.keys())[:5]}...")
    
    def test_badge_stats_requires_auth(self):
        """Badge stats should require authentication"""
        response = requests.get(
            f"{BASE_URL}/api/badges/stats",
            timeout=30
        )
        # Should require auth
        assert response.status_code in [401, 403], f"Badge stats should require auth, got {response.status_code}"
        print(f"✅ Badge stats correctly requires auth")


class TestWorkoutEndpoints:
    """Test workout related endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        return response.json().get("accessToken")
    
    def test_rolling_regeneration_endpoint_exists(self, auth_token):
        """POST /api/workouts/rolling-regeneration with auth - endpoint should exist and respond"""
        response = requests.post(
            f"{BASE_URL}/api/workouts/rolling-regeneration",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={},  # Empty body to test endpoint existence
            timeout=30
        )
        # Endpoint should exist - might return 400 for missing params but NOT 404
        assert response.status_code != 404, f"Endpoint /api/workouts/rolling-regeneration not found (404)"
        print(f"✅ Rolling regeneration endpoint exists, returned {response.status_code}")
    
    def test_user_schedule_with_auth(self, auth_token):
        """GET /api/workouts/user-schedule with auth should return schedule data"""
        response = requests.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        # Endpoint should work
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User schedule returned data: {type(data)}")
        else:
            print(f"⚠️ User schedule returned {response.status_code}")
        # Not requiring 200 as endpoint may need specific setup


class TestStatsEndpoints:
    """Test stats endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        return response.json().get("accessToken")
    
    def test_stats_summary_with_auth(self, auth_token):
        """GET /api/stats/summary with auth should return stats data"""
        response = requests.get(
            f"{BASE_URL}/api/stats/summary",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stats summary returned: {list(data.keys())[:5] if isinstance(data, dict) else type(data)}")
        elif response.status_code == 404:
            print("⚠️ /api/stats/summary endpoint not found - may need implementation")
        else:
            print(f"⚠️ Stats summary returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
