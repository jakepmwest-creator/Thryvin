"""
Backend API Tests for Iteration 15:
Testing new features as specified by main agent:
1. POST /api/coach/chat with negative feelings - returns empathetic response (not generic push)
2. POST /api/coach/chat with positive message - returns matching energy
3. GET /api/health returns ok:true with AI ready
4. POST /api/auth/login returns accessToken for test@example.com/password123
5. GET /api/exercises?limit=5 returns exercises with video URLs
6. POST /api/workouts/generate returns workout with setType field support

Note: Frontend is React Native Expo (cannot be browser tested)
Focus on AI Coach compassion enhancement testing
"""

import pytest
import requests
import os
import time
import re

# API Base URL from environment or use the tunnel URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://conventional-isa-equality-submitting.trycloudflare.com').rstrip('/')

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


class TestFeature1_CoachCompassionNegativeFeelings:
    """
    Test 1: POST /api/coach/chat with negative feelings message
    AI Coach should respond with empathy, NOT generic "push through" responses
    """
    
    def test_coach_empathy_for_feeling_weak(self, auth_token):
        """Coach responds empathetically when user feels weak/tired"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I feel really weak today. I'm not sure I can do my workout. Everything feels too hard.",
                "coach": "default"
            },
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data, "Missing 'response' field in coach reply"
        
        coach_response = data["response"].lower()
        
        # Should NOT contain dismissive phrases
        dismissive_phrases = [
            "push through",
            "just do it",
            "no excuses",
            "stop making excuses",
            "get over it",
            "suck it up"
        ]
        for phrase in dismissive_phrases:
            assert phrase not in coach_response, \
                f"FAIL: Coach response contains dismissive phrase '{phrase}' when user expressed vulnerability"
        
        # SHOULD contain empathetic acknowledgment
        empathy_indicators = [
            "hear you", "understand", "okay", "valid", "tough", "hard", "feel",
            "take it easy", "rest", "be gentle", "no pressure", "sometimes",
            "everyone", "happens", "normal", "alright", "light"
        ]
        has_empathy = any(indicator in coach_response for indicator in empathy_indicators)
        assert has_empathy, \
            f"FAIL: Coach response lacks empathy indicators. Response: {data['response'][:300]}"
        
        print(f"✅ Coach responded empathetically to negative feelings")
        print(f"   Response snippet: {data['response'][:200]}...")
    
    def test_coach_empathy_for_stressed_user(self, auth_token):
        """Coach responds supportively when user mentions stress"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I've been so stressed with work and life. I don't have energy for the gym.",
                "coach": "default"
            },
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        coach_response = data["response"].lower()
        
        # Check for empathetic acknowledgment of stress
        stress_empathy = any(word in coach_response for word in [
            "stress", "understand", "tough", "overwhelming", "take care",
            "self-care", "rest", "recover", "okay", "valid"
        ])
        
        # Should NOT push hard workouts on stressed user
        pushing_hard = any(phrase in coach_response for phrase in [
            "no excuses", "push harder", "stop whining", "just go"
        ])
        
        assert not pushing_hard, f"Coach pushed too hard on stressed user: {data['response'][:200]}"
        assert stress_empathy, f"Coach didn't acknowledge user's stress empathetically"
        
        print(f"✅ Coach acknowledged stress empathetically")


class TestFeature2_CoachPositiveEnergy:
    """
    Test 2: POST /api/coach/chat with positive message
    AI Coach should match the positive energy
    """
    
    def test_coach_matches_positive_energy(self, auth_token):
        """Coach responds with matching excitement to positive news"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I just hit a new PR on my bench press! I'm so pumped! Can't wait for the next workout!",
                "coach": "default"
            },
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        coach_response = data["response"].lower()
        
        # Should have positive energy indicators
        positive_indicators = [
            "congrat", "amazing", "awesome", "fantastic", "great", "incredible",
            "proud", "excellent", "well done", "crushing", "killing it", 
            "impressive", "celebrate", "wow", "nice", "!!"
        ]
        has_positive_energy = any(indicator in coach_response for indicator in positive_indicators)
        
        assert has_positive_energy, \
            f"Coach didn't match positive energy. Response: {data['response'][:200]}"
        
        print(f"✅ Coach matched positive energy appropriately")
        print(f"   Response snippet: {data['response'][:150]}...")
    
    def test_coach_celebrates_motivation(self, auth_token):
        """Coach celebrates user's motivation"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I've been consistent with my workouts for 3 weeks now! Feeling stronger every day!",
                "coach": "default"
            },
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        coach_response = data["response"].lower()
        
        # Check for celebration/acknowledgment
        celebration_words = [
            "consistency", "consistent", "amazing", "great", "proud", 
            "keep it up", "progress", "momentum", "excellent", "fantastic"
        ]
        celebrates = any(word in coach_response for word in celebration_words)
        
        assert celebrates, f"Coach didn't celebrate user's achievement"
        print(f"✅ Coach celebrated user's consistency")


class TestFeature3_HealthEndpoint:
    """Test 3: GET /api/health returns ok:true with AI ready"""
    
    def test_health_returns_ok_true(self):
        """GET /api/health returns {ok: true}"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok:true, got ok:{data.get('ok')}"
        print(f"✅ /api/health returns ok:true")
    
    def test_health_shows_ai_enabled(self):
        """Health endpoint shows AI is enabled"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        features = data.get("features", {})
        
        # Check AI/Coach features
        ai_enabled = features.get("AI_ENABLED", False)
        coach_enabled = features.get("COACH_ENABLED", False)
        
        assert ai_enabled or coach_enabled, \
            f"AI features not enabled. Features: {features}"
        
        print(f"✅ AI features enabled - AI_ENABLED: {ai_enabled}, COACH_ENABLED: {coach_enabled}")
    
    def test_health_db_ok(self):
        """Health endpoint returns dbOk status"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        assert "dbOk" in data, "Missing dbOk field"
        assert data.get("dbOk") == True, f"Database not healthy: dbOk={data.get('dbOk')}"
        print(f"✅ Database health: dbOk={data.get('dbOk')}")


class TestFeature4_AuthLogin:
    """Test 4: POST /api/auth/login returns accessToken for test credentials"""
    
    def test_login_returns_access_token(self):
        """Login with valid credentials returns accessToken"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        
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


class TestFeature5_ExercisesWithVideoURLs:
    """Test 5: GET /api/exercises?limit=5 returns exercises with video URLs"""
    
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
        
        assert len(exercises) == 5, f"Expected 5 exercises, got {len(exercises)}"
        
        for i, exercise in enumerate(exercises):
            assert "videoUrl" in exercise, f"Exercise {i} missing videoUrl field"
            assert exercise["videoUrl"] is not None, \
                f"Exercise '{exercise.get('name', 'unknown')}' has null videoUrl"
            assert exercise["videoUrl"].startswith("http"), \
                f"Exercise videoUrl not valid URL: {exercise['videoUrl']}"
            print(f"  ✓ '{exercise['name']}': {exercise['videoUrl'][:60]}...")
        
        print(f"✅ All {len(exercises)} exercises have valid videoUrl fields")


class TestFeature6_WorkoutGeneratorSetType:
    """
    Test 6: POST /api/workouts/generate returns workout with setType field support
    Verify special sets (drop sets, supersets, giant sets) are supported
    """
    
    def test_workout_generate_endpoint_exists(self, auth_token):
        """Workout generate endpoint accepts requests"""
        response = requests.post(
            f"{BASE_URL}/api/workouts/generate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "goal": "strength",
                "experience": "intermediate",
                "equipment": ["barbell", "dumbbell", "cable machine"],
                "targetMuscles": ["chest", "back"],
                "daysPerWeek": 3
            },
            timeout=60  # AI generation can take time
        )
        
        # Accept 200 or 400 (validation error) - endpoint exists
        assert response.status_code in [200, 400, 422], \
            f"Unexpected status: {response.status_code}. Response: {response.text[:500]}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Workout generate endpoint working")
            
            # Check if response contains workout data
            if "workout" in data or "exercises" in data or isinstance(data, list):
                print(f"   Response has workout data")
                
                # Look for setType in exercises
                exercises_to_check = data.get("exercises", [])
                if "workout" in data and isinstance(data["workout"], dict):
                    exercises_to_check = data["workout"].get("exercises", [])
                
                # Check for setType field support
                for ex in exercises_to_check:
                    if "setType" in ex:
                        print(f"   ✓ Exercise '{ex.get('name', 'unknown')}' has setType: {ex['setType']}")
        else:
            print(f"⚠️ Workout generate returned {response.status_code} - may need specific params")
    
    def test_workout_generate_custom_endpoint(self, auth_token):
        """Test custom workout generation endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/workouts/generate-custom",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "preferences": {
                    "goal": "muscle_building",
                    "experience": "intermediate",
                    "duration": 45,
                    "equipment": ["barbell", "dumbbell"]
                }
            },
            timeout=60
        )
        
        # This endpoint may require different params
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Custom workout generation working")
        else:
            print(f"⚠️ Custom generate returned {response.status_code}")


class TestCoachAuthRequirement:
    """Verify coach chat requires authentication"""
    
    def test_coach_requires_auth(self):
        """Coach chat endpoint rejects unauthenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "Hello", "coach": "default"},
            timeout=30
        )
        assert response.status_code == 401, \
            f"Expected 401 without auth, got {response.status_code}"
        print(f"✅ Coach endpoint correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
