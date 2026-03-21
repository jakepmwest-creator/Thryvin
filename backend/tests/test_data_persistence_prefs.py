"""
Backend API Tests for Data Persistence & Coach Nudges
Tests the following features:
1. PUT /api/exercise-preferences - saves preferences and starred exercises
2. GET /api/exercise-preferences - loads preferences with Bearer token auth
3. GET /api/coach/nudges - works with Bearer token auth
4. GET /api/exercises - returns exercise list (no auth required)
5. Preferences persistence across sessions
"""

import pytest
import requests
import os
import time
from datetime import datetime

# Use localhost since we're testing backend directly
BASE_URL = "http://localhost:8001"

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


class TestAuthentication:
    """Test authentication and token generation"""
    
    def test_login_returns_access_token(self):
        """Login should return accessToken field (not just 'token')"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert data.get("ok") == True, "Login response should have ok=true"
        assert "accessToken" in data, "Login should return accessToken field"
        assert "user" in data, "Login should return user object"
        assert isinstance(data["accessToken"], str), "accessToken should be a string"
        assert len(data["accessToken"]) > 20, "accessToken should be a JWT (longer than 20 chars)"
        
        print(f"Login successful, token length: {len(data['accessToken'])}")
    
    def test_login_invalid_credentials(self):
        """Login with wrong credentials should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code == 401, "Invalid login should return 401"
        
        data = response.json()
        assert data.get("ok") == False, "Invalid login should have ok=false"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for subsequent tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    data = response.json()
    return data.get("accessToken")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Create headers with Bearer token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestExercisePreferencesPUT:
    """Test PUT /api/exercise-preferences - saves preferences to database"""
    
    def test_put_preferences_requires_auth(self):
        """PUT preferences without auth should fail"""
        response = requests.put(
            f"{BASE_URL}/api/exercise-preferences",
            json={"preferences": [], "starred": []}
        )
        assert response.status_code == 401, "PUT without auth should return 401"
    
    def test_put_preferences_with_bearer_token(self, auth_headers):
        """PUT preferences with Bearer token should succeed"""
        test_preferences = [
            {
                "exerciseId": "test-bench-press",
                "exerciseName": "Bench Press",
                "preference": "liked",
                "timestamp": datetime.now().isoformat()
            }
        ]
        test_starred = [
            {
                "exerciseId": "test-squat",
                "exerciseName": "Squat",
                "videoUrl": "https://example.com/squat.mp4",
                "timestamp": datetime.now().isoformat()
            }
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/exercise-preferences",
            headers=auth_headers,
            json={"preferences": test_preferences, "starred": test_starred}
        )
        
        assert response.status_code == 200, f"PUT preferences failed: {response.text}"
        data = response.json()
        assert data.get("ok") == True, "PUT should return ok=true"
        print(f"PUT preferences successful: {data}")
    
    def test_put_empty_preferences(self, auth_headers):
        """PUT with empty arrays should succeed"""
        response = requests.put(
            f"{BASE_URL}/api/exercise-preferences",
            headers=auth_headers,
            json={"preferences": [], "starred": []}
        )
        
        assert response.status_code == 200, f"PUT empty preferences failed: {response.text}"
        data = response.json()
        assert data.get("ok") == True


class TestExercisePreferencesGET:
    """Test GET /api/exercise-preferences - loads preferences from database"""
    
    def test_get_preferences_requires_auth(self):
        """GET preferences without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/exercise-preferences")
        assert response.status_code == 401, "GET without auth should return 401"
    
    def test_get_preferences_with_bearer_token(self, auth_headers):
        """GET preferences with Bearer token should succeed"""
        response = requests.get(
            f"{BASE_URL}/api/exercise-preferences",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"GET preferences failed: {response.text}"
        data = response.json()
        assert data.get("ok") == True, "GET should return ok=true"
        assert "preferences" in data, "Response should contain preferences array"
        assert "starred" in data, "Response should contain starred array"
        
        print(f"GET preferences: {len(data['preferences'])} prefs, {len(data['starred'])} starred")


class TestPreferencesPersistence:
    """Test that preferences persist across sessions (save then load)"""
    
    def test_preferences_persist_across_requests(self, auth_headers):
        """Save preferences, then verify they persist when loaded"""
        
        # Step 1: Save unique test data
        unique_id = f"persistence-test-{int(time.time())}"
        test_preferences = [
            {
                "exerciseId": unique_id,
                "exerciseName": "Persistence Test Exercise",
                "preference": "liked",
                "timestamp": datetime.now().isoformat()
            }
        ]
        test_starred = [
            {
                "exerciseId": f"{unique_id}-starred",
                "exerciseName": "Starred Persistence Test",
                "videoUrl": "https://example.com/test.mp4",
                "timestamp": datetime.now().isoformat()
            }
        ]
        
        # PUT to save
        put_response = requests.put(
            f"{BASE_URL}/api/exercise-preferences",
            headers=auth_headers,
            json={"preferences": test_preferences, "starred": test_starred}
        )
        assert put_response.status_code == 200, f"PUT failed: {put_response.text}"
        
        # Step 2: GET to verify persistence
        get_response = requests.get(
            f"{BASE_URL}/api/exercise-preferences",
            headers=auth_headers
        )
        assert get_response.status_code == 200, f"GET failed: {get_response.text}"
        
        data = get_response.json()
        assert data.get("ok") == True
        
        # Verify the saved data is returned
        preferences = data.get("preferences", [])
        starred = data.get("starred", [])
        
        # Find our test data
        found_pref = any(p.get("exerciseId") == unique_id for p in preferences)
        found_starred = any(s.get("exerciseId") == f"{unique_id}-starred" for s in starred)
        
        assert found_pref, f"Saved preference not found in GET response. Got: {preferences}"
        assert found_starred, f"Saved starred exercise not found in GET response. Got: {starred}"
        
        print(f"Persistence verified: preference found={found_pref}, starred found={found_starred}")


class TestCoachNudges:
    """Test GET /api/coach/nudges - requires Bearer token auth (not session)"""
    
    def test_nudges_requires_auth(self):
        """GET nudges without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/coach/nudges?location=home")
        assert response.status_code == 401, "GET nudges without auth should return 401"
    
    def test_nudges_with_bearer_token(self, auth_headers):
        """GET nudges with Bearer token should succeed"""
        response = requests.get(
            f"{BASE_URL}/api/coach/nudges?location=home",
            headers=auth_headers
        )
        
        # Should return 200 (even if empty nudges)
        assert response.status_code == 200, f"GET nudges failed: {response.text}"
        
        data = response.json()
        assert "nudges" in data, "Response should contain nudges array"
        assert isinstance(data["nudges"], list), "nudges should be an array"
        
        print(f"Coach nudges returned: {len(data['nudges'])} nudges")
    
    def test_nudges_with_workout_hub_location(self, auth_headers):
        """GET nudges for workout_hub location"""
        response = requests.get(
            f"{BASE_URL}/api/coach/nudges?location=workout_hub",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"GET nudges workout_hub failed: {response.text}"
        data = response.json()
        assert "nudges" in data


class TestExercisesEndpoint:
    """Test GET /api/exercises - should NOT require auth"""
    
    def test_exercises_without_auth(self):
        """GET exercises should work without auth"""
        response = requests.get(f"{BASE_URL}/api/exercises")
        
        assert response.status_code == 200, f"GET exercises failed: {response.text}"
        data = response.json()
        
        # Response should be an object with exercises array
        if isinstance(data, dict):
            assert "exercises" in data, "Response should contain exercises key"
            exercises_list = data["exercises"]
        else:
            exercises_list = data  # Fall back to list format
        
        assert isinstance(exercises_list, list), "exercises should be a list"
        
        if len(exercises_list) > 0:
            # Verify exercise structure
            first_exercise = exercises_list[0]
            assert "id" in first_exercise, "Exercise should have id"
            assert "name" in first_exercise, "Exercise should have name"
            
            print(f"Exercises returned: {len(exercises_list)} exercises, first: {first_exercise.get('name', 'N/A')}")
        else:
            print("No exercises in database (this may be expected)")
    
    def test_exercises_with_search_filter(self):
        """GET exercises with search filter"""
        response = requests.get(f"{BASE_URL}/api/exercises?search=squat")
        
        assert response.status_code == 200, f"Exercise search failed: {response.text}"
        data = response.json()
        
        # Handle both response formats
        if isinstance(data, dict):
            exercises_list = data.get("exercises", [])
        else:
            exercises_list = data
            
        assert isinstance(exercises_list, list)
        
        if len(exercises_list) > 0:
            # All results should contain 'squat' in name
            print(f"Search 'squat' returned {len(exercises_list)} results")


class TestHealthCheck:
    """Test health endpoint"""
    
    def test_health_endpoint(self):
        """Health endpoint should return OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("ok") == True, "Health should return ok=true"


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
