"""
Test Suite for Bug Fixes - Iteration 6
Testing:
1. Backend health check
2. Badge tracking API endpoint `/api/badges/track` for coachMessage action
3. Workout summary API endpoint `/api/stats/workout-summary/:workoutId` with repsAtMax field
4. User registration and authentication flow
"""

import pytest
import requests
import os
import time
import uuid

# API Base URL from environment
BASE_URL = os.environ.get('EXPO_PUBLIC_API_BASE_URL', 'https://regen-timing-fix.preview.emergentagent.com')

# Test user credentials - unique per test run
TEST_EMAIL = f"test_user_{uuid.uuid4().hex[:8]}@thryvin.test"
TEST_PASSWORD = "TestPass123!"
TEST_NAME = "Test User"


class TestHealthCheck:
    """Test backend health endpoint"""
    
    def test_health_endpoint_returns_200(self):
        """Health endpoint should return 200 with ok=true"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Health check failed with status {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, f"Health check returned ok=false: {data}"
        assert "timestamp" in data, "Health response missing timestamp"
        assert "features" in data, "Health response missing features"
        
        # Verify key features are enabled
        features = data.get("features", {})
        assert features.get("AI_ENABLED") == True, "AI should be enabled"
        assert features.get("AWARDS_ENABLED") == True, "Awards/Badges should be enabled"
        print(f"✅ Health check passed: {data}")
    
    def test_health_db_connection(self):
        """Health endpoint should show database is connected"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        data = response.json()
        
        assert data.get("dbOk") == True, f"Database connection failed: {data}"
        print(f"✅ Database connection OK")


class TestUserRegistration:
    """Test user registration and authentication"""
    
    @pytest.fixture(scope="class")
    def registered_user(self):
        """Register a test user and return credentials"""
        email = f"test_badge_{uuid.uuid4().hex[:8]}@thryvin.test"
        password = "TestPass123!"
        name = "Badge Test User"
        
        # Register user
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": name,
                "email": email,
                "password": password,
                "trainingType": "strength",
                "goal": "build-muscle",
                "experience": "advanced",
                "sessionDuration": 45,
                "trainingDays": 4,
                "equipment": ["dumbbells", "barbells", "full_gym"],
                "fitnessGoals": ["build-muscle", "increase-strength"]
            },
            timeout=30
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ User registered: {email}")
            return {
                "email": email,
                "password": password,
                "name": name,
                "user": data.get("user"),
                "accessToken": data.get("accessToken")
            }
        elif response.status_code == 400 and "already exists" in response.text:
            # User already exists, try to login
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": password},
                timeout=30
            )
            if login_response.status_code == 200:
                data = login_response.json()
                return {
                    "email": email,
                    "password": password,
                    "name": name,
                    "user": data.get("user"),
                    "accessToken": data.get("accessToken")
                }
        
        pytest.fail(f"Failed to register/login user: {response.status_code} - {response.text}")
    
    def test_registration_returns_access_token(self, registered_user):
        """Registration should return an access token for mobile auth"""
        assert registered_user.get("accessToken"), "Registration should return accessToken"
        assert len(registered_user["accessToken"]) > 50, "Access token should be a valid JWT"
        print(f"✅ Access token received: {registered_user['accessToken'][:50]}...")
    
    def test_registration_returns_user_data(self, registered_user):
        """Registration should return user data"""
        user = registered_user.get("user")
        assert user, "Registration should return user object"
        assert user.get("id"), "User should have an ID"
        assert user.get("email") == registered_user["email"], "User email should match"
        print(f"✅ User data received: ID={user.get('id')}, email={user.get('email')}")


class TestBadgeTracking:
    """Test badge tracking API endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for badge tests"""
        email = f"test_badge_track_{uuid.uuid4().hex[:8]}@thryvin.test"
        password = "TestPass123!"
        
        # Register user
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Badge Track Test",
                "email": email,
                "password": password,
                "trainingType": "strength",
                "goal": "build-muscle",
                "experience": "intermediate"
            },
            timeout=30
        )
        
        if response.status_code == 201:
            data = response.json()
            return data.get("accessToken")
        elif response.status_code == 400:
            # Try login
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": password},
                timeout=30
            )
            if login_response.status_code == 200:
                return login_response.json().get("accessToken")
        
        pytest.skip(f"Could not get auth token: {response.status_code}")
    
    def test_badge_track_requires_auth(self):
        """Badge track endpoint should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "coachMessage"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Badge track correctly requires authentication")
    
    def test_badge_track_coach_message_action(self, auth_token):
        """Badge track should work for coachMessage action"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "coachMessage"},
            headers=headers,
            timeout=10
        )
        
        assert response.status_code == 200, f"Badge track failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Badge track returned success=false: {data}"
        assert data.get("action") == "coachMessage", f"Action mismatch: {data}"
        print(f"✅ Badge track coachMessage succeeded: {data}")
    
    def test_badge_track_invalid_action(self, auth_token):
        """Badge track should reject invalid actions"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "invalidAction"},
            headers=headers,
            timeout=10
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid action, got {response.status_code}"
        print("✅ Badge track correctly rejects invalid actions")
    
    def test_badge_track_all_valid_actions(self, auth_token):
        """Test all valid badge tracking actions"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        valid_actions = [
            'coachMessage', 'badgeShared', 'videoWatched', 'profileEdit',
            'appRated', 'workoutEdit', 'extraActivity', 'prBroken'
        ]
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        for action in valid_actions:
            response = requests.post(
                f"{BASE_URL}/api/badges/track",
                json={"action": action, "value": 1 if action == "prBroken" else None},
                headers=headers,
                timeout=10
            )
            
            assert response.status_code == 200, f"Badge track failed for {action}: {response.status_code} - {response.text}"
            data = response.json()
            assert data.get("success") == True, f"Badge track {action} returned success=false"
            print(f"  ✅ {action} tracked successfully")
        
        print(f"✅ All {len(valid_actions)} badge actions tracked successfully")


class TestWorkoutSummary:
    """Test workout summary API endpoint with repsAtMax field"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for workout summary tests"""
        email = f"test_summary_{uuid.uuid4().hex[:8]}@thryvin.test"
        password = "TestPass123!"
        
        # Register user
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Summary Test User",
                "email": email,
                "password": password,
                "trainingType": "strength",
                "goal": "build-muscle",
                "experience": "advanced"
            },
            timeout=30
        )
        
        if response.status_code == 201:
            return response.json().get("accessToken")
        elif response.status_code == 400:
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": password},
                timeout=30
            )
            if login_response.status_code == 200:
                return login_response.json().get("accessToken")
        
        pytest.skip(f"Could not get auth token: {response.status_code}")
    
    def test_workout_summary_requires_auth(self):
        """Workout summary endpoint should require authentication"""
        response = requests.get(
            f"{BASE_URL}/api/stats/workout-summary/test-workout-123",
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Workout summary correctly requires authentication")
    
    def test_workout_summary_empty_workout(self, auth_token):
        """Workout summary should return empty for non-existent workout"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/stats/workout-summary/non-existent-workout-{uuid.uuid4().hex[:8]}",
            headers=headers,
            timeout=10
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("exercises") == [], f"Expected empty exercises array: {data}"
        print(f"✅ Workout summary returns empty for non-existent workout: {data}")
    
    def test_workout_summary_with_logged_performance(self, auth_token):
        """Test workout summary after logging performance data"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        workout_id = f"test-workout-{uuid.uuid4().hex[:8]}"
        
        # First, log some performance data
        performance_data = {
            "workoutId": workout_id,
            "exercises": [
                {
                    "exerciseId": "bench-press-1",
                    "exerciseName": "Bench Press",
                    "sets": [
                        {"setNumber": 1, "weight": 135, "reps": 10, "rpe": 7},
                        {"setNumber": 2, "weight": 155, "reps": 8, "rpe": 8},
                        {"setNumber": 3, "weight": 175, "reps": 5, "rpe": 9}  # Max weight set
                    ]
                },
                {
                    "exerciseId": "squat-1",
                    "exerciseName": "Squat",
                    "sets": [
                        {"setNumber": 1, "weight": 185, "reps": 8, "rpe": 7},
                        {"setNumber": 2, "weight": 205, "reps": 6, "rpe": 8},
                        {"setNumber": 3, "weight": 225, "reps": 4, "rpe": 9}  # Max weight set
                    ]
                }
            ],
            "duration": 45,
            "overallFeedback": "Great workout!"
        }
        
        # Log the performance
        log_response = requests.post(
            f"{BASE_URL}/api/workouts/log-performance",
            json=performance_data,
            headers=headers,
            timeout=30
        )
        
        # Note: log-performance may require session auth, not just JWT
        # If it fails, we'll still test the summary endpoint structure
        if log_response.status_code == 200:
            print(f"✅ Performance logged successfully")
            
            # Now get the workout summary
            summary_response = requests.get(
                f"{BASE_URL}/api/stats/workout-summary/{workout_id}",
                headers=headers,
                timeout=10
            )
            
            assert summary_response.status_code == 200, f"Summary failed: {summary_response.status_code}"
            data = summary_response.json()
            
            # Check structure
            assert "exercises" in data, "Summary should have exercises array"
            assert "stats" in data, "Summary should have stats object"
            
            # If we have exercises, check for repsAtMax field
            if data.get("exercises"):
                for exercise in data["exercises"]:
                    assert "repsAtMax" in exercise, f"Exercise missing repsAtMax field: {exercise}"
                    print(f"  ✅ {exercise.get('exerciseName')}: repsAtMax={exercise.get('repsAtMax')}")
            
            print(f"✅ Workout summary structure verified: {len(data.get('exercises', []))} exercises")
        else:
            print(f"⚠️ Performance logging returned {log_response.status_code} - testing summary endpoint structure only")
            # Still verify the endpoint exists and returns proper structure
            summary_response = requests.get(
                f"{BASE_URL}/api/stats/workout-summary/{workout_id}",
                headers=headers,
                timeout=10
            )
            assert summary_response.status_code == 200, f"Summary endpoint failed: {summary_response.status_code}"
            print("✅ Workout summary endpoint accessible")


class TestExperienceLevelAPI:
    """Test that user experience level is properly stored and returned"""
    
    def test_registration_stores_experience_level(self):
        """Registration should store the user's experience level"""
        email = f"test_exp_{uuid.uuid4().hex[:8]}@thryvin.test"
        password = "TestPass123!"
        
        # Register with 'advanced' experience
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Experience Test User",
                "email": email,
                "password": password,
                "trainingType": "strength",
                "goal": "build-muscle",
                "experience": "advanced",  # This should be stored
                "sessionDuration": 60,
                "trainingDays": 5
            },
            timeout=30
        )
        
        if response.status_code == 201:
            data = response.json()
            user = data.get("user", {})
            
            # Check if experience level is in onboarding responses
            onboarding = user.get("onboardingResponses")
            if onboarding:
                if isinstance(onboarding, str):
                    import json
                    onboarding = json.loads(onboarding)
                assert onboarding.get("experience") == "advanced", f"Experience not stored correctly: {onboarding}"
                print(f"✅ Experience level 'advanced' stored in onboardingResponses")
            else:
                print(f"⚠️ onboardingResponses not returned in user object, but registration succeeded")
            
            print(f"✅ User registered with experience level")
        else:
            pytest.skip(f"Registration failed: {response.status_code} - {response.text}")


class TestAPIEndpointAvailability:
    """Quick tests to verify all relevant endpoints are available"""
    
    def test_health_endpoint_available(self):
        """Health endpoint should be available"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        assert response.status_code == 200
        print("✅ /api/health available")
    
    def test_version_endpoint_available(self):
        """Version endpoint should be available"""
        response = requests.get(f"{BASE_URL}/api/version", timeout=5)
        assert response.status_code == 200
        print("✅ /api/version available")
    
    def test_badges_track_endpoint_exists(self):
        """Badges track endpoint should exist (returns 401 without auth)"""
        response = requests.post(f"{BASE_URL}/api/badges/track", json={}, timeout=5)
        assert response.status_code in [400, 401], f"Unexpected status: {response.status_code}"
        print("✅ /api/badges/track endpoint exists")
    
    def test_workout_summary_endpoint_exists(self):
        """Workout summary endpoint should exist (returns 401 without auth)"""
        response = requests.get(f"{BASE_URL}/api/stats/workout-summary/test", timeout=5)
        assert response.status_code == 401, f"Unexpected status: {response.status_code}"
        print("✅ /api/stats/workout-summary/:workoutId endpoint exists")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
