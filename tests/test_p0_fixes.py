"""
P0 Fixes Backend Tests - Workout Logging & Favorites Pinning

Tests for two critical P0 fixes:
1. WorkoutId mismatch - all logged sets should share same workoutId
2. Favorites pinning - PUT/GET /api/stats/favorites should persist exercise IDs

Test credentials: test@example.com / password123
API Base URL: https://fitness-stats-8.preview.emergentagent.com
"""

import pytest
import requests
import os
import time
import uuid

# API Base URL from environment or default
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fitness-stats-8.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


class TestAuthentication:
    """Authentication tests - must pass before other tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
        
        data = response.json()
        assert data.get("ok") == True, f"Login failed: {data}"
        assert "accessToken" in data, "No accessToken in login response"
        
        return data["accessToken"]
    
    def test_login_returns_token(self, auth_token):
        """Verify login returns a valid access token"""
        assert auth_token is not None
        assert len(auth_token) > 20  # JWT tokens are typically longer


class TestWorkoutLogging:
    """
    ACCEPTANCE TEST 1: Workout logging - log 3 sets, verify all share same workoutId
    ACCEPTANCE TEST 1b: Workout summary shows volume > 0 and exercisesCompleted > 0
    """
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.status_code}")
        return response.json().get("accessToken")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        }
    
    @pytest.fixture(scope="class")
    def unique_workout_id(self):
        """Generate unique workout ID for this test run"""
        return f"test_workout_{int(time.time())}"
    
    def test_log_three_sets_same_workout_id(self, headers, unique_workout_id):
        """
        ACCEPTANCE TEST 1: Log 3 sets with same workoutId
        All sets should be logged successfully with the same workoutId
        """
        sets_to_log = [
            {"exerciseName": "Bench Press", "exerciseId": "bench_press", "setNumber": 1, "weight": 75, "reps": 10},
            {"exerciseName": "Bench Press", "exerciseId": "bench_press", "setNumber": 2, "weight": 75, "reps": 8},
            {"exerciseName": "Squat", "exerciseId": "squat", "setNumber": 1, "weight": 100, "reps": 8},
        ]
        
        logged_sets = []
        
        for set_data in sets_to_log:
            payload = {
                **set_data,
                "workoutId": unique_workout_id  # Same workoutId for all sets
            }
            
            response = requests.post(
                f"{BASE_URL}/api/workout/log-set",
                json=payload,
                headers=headers
            )
            
            assert response.status_code == 200, f"Failed to log set: {response.status_code} - {response.text}"
            data = response.json()
            assert data.get("success") == True, f"Set logging failed: {data}"
            logged_sets.append(payload)
            
            print(f"✅ Logged: {set_data['exerciseName']} Set {set_data['setNumber']} - {set_data['weight']}kg x {set_data['reps']}")
        
        assert len(logged_sets) == 3, "Should have logged 3 sets"
        
        # Store workout_id for next test
        self.__class__.test_workout_id = unique_workout_id
        print(f"✅ All 3 sets logged with workoutId: {unique_workout_id}")
    
    def test_workout_summary_shows_correct_stats(self, headers, unique_workout_id):
        """
        ACCEPTANCE TEST 1b: Workout summary shows volume > 0 and exercisesCompleted > 0
        After logging sets, the summary endpoint should return correct stats
        """
        # Small delay to ensure data is persisted
        time.sleep(0.5)
        
        response = requests.get(
            f"{BASE_URL}/api/stats/workout-summary/{unique_workout_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get summary: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify exercises array exists and has data
        exercises = data.get("exercises", [])
        assert len(exercises) > 0, f"No exercises in summary. Response: {data}"
        
        # Verify stats
        stats = data.get("stats")
        assert stats is not None, f"No stats in summary. Response: {data}"
        
        # ACCEPTANCE CRITERIA: volume > 0
        total_volume = stats.get("totalVolume", 0)
        assert total_volume > 0, f"Total volume should be > 0, got {total_volume}"
        
        # ACCEPTANCE CRITERIA: exercisesCompleted > 0 (exerciseCount in API)
        exercise_count = stats.get("exerciseCount", 0)
        assert exercise_count > 0, f"Exercise count should be > 0, got {exercise_count}"
        
        # Verify total sets
        total_sets = stats.get("totalSets", 0)
        assert total_sets >= 3, f"Total sets should be >= 3, got {total_sets}"
        
        print(f"✅ Workout Summary Stats:")
        print(f"   - Total Volume: {total_volume}")
        print(f"   - Exercises Completed: {exercise_count}")
        print(f"   - Total Sets: {total_sets}")
        
        # Verify each exercise has correct data
        for exercise in exercises:
            assert "exerciseName" in exercise, "Exercise missing name"
            assert "sets" in exercise, "Exercise missing sets"
            assert len(exercise["sets"]) > 0, f"Exercise {exercise.get('exerciseName')} has no sets"
            
            # Verify volume calculation
            ex_volume = exercise.get("totalVolume", 0)
            assert ex_volume > 0, f"Exercise {exercise.get('exerciseName')} has 0 volume"
            
            print(f"   - {exercise['exerciseName']}: {len(exercise['sets'])} sets, volume={ex_volume}")


class TestFavoritesPinning:
    """
    ACCEPTANCE TEST 2: Favorites pinning - PUT /api/stats/favorites persists 3 exercise IDs
    ACCEPTANCE TEST 2b: GET /api/stats/favorites returns persisted favorites
    """
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.status_code}")
        return response.json().get("accessToken")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        }
    
    @pytest.fixture(scope="class")
    def test_exercise_ids(self):
        """Test exercise IDs to pin as favorites"""
        return ["bench_press", "squat", "deadlift"]
    
    def test_put_favorites_persists_three_exercises(self, headers, test_exercise_ids):
        """
        ACCEPTANCE TEST 2: PUT /api/stats/favorites persists 3 exercise IDs
        """
        response = requests.put(
            f"{BASE_URL}/api/stats/favorites",
            json={"exerciseIds": test_exercise_ids},
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to PUT favorites: {response.status_code} - {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"PUT favorites failed: {data}"
        
        # Verify returned favorites match what we sent
        returned_favorites = data.get("favorites", [])
        assert len(returned_favorites) == 3, f"Expected 3 favorites, got {len(returned_favorites)}"
        
        for ex_id in test_exercise_ids:
            assert ex_id in returned_favorites, f"Exercise {ex_id} not in returned favorites"
        
        print(f"✅ PUT favorites successful: {returned_favorites}")
    
    def test_get_favorites_returns_persisted_data(self, headers, test_exercise_ids):
        """
        ACCEPTANCE TEST 2b: GET /api/stats/favorites returns persisted favorites
        """
        # Small delay to ensure data is persisted
        time.sleep(0.5)
        
        response = requests.get(
            f"{BASE_URL}/api/stats/favorites",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to GET favorites: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify favoriteIds are returned
        favorite_ids = data.get("favoriteIds", [])
        assert len(favorite_ids) == 3, f"Expected 3 favoriteIds, got {len(favorite_ids)}: {favorite_ids}"
        
        # Verify all test exercise IDs are present
        for ex_id in test_exercise_ids:
            assert ex_id in favorite_ids, f"Exercise {ex_id} not in favoriteIds: {favorite_ids}"
        
        print(f"✅ GET favorites returned: {favorite_ids}")
        
        # Verify favorites array (with stats) is also returned
        favorites = data.get("favorites", [])
        print(f"   - Favorites with stats: {len(favorites)} items")
        
        for fav in favorites:
            print(f"   - {fav.get('exerciseName', fav.get('exerciseId'))}: PB={fav.get('actualPB', 'N/A')}")


class TestEdgeCases:
    """Edge case tests for robustness"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.status_code}")
        return response.json().get("accessToken")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        }
    
    def test_favorites_max_three_limit(self, headers):
        """Test that favorites endpoint enforces max 3 limit"""
        response = requests.put(
            f"{BASE_URL}/api/stats/favorites",
            json={"exerciseIds": ["ex1", "ex2", "ex3", "ex4"]},  # 4 exercises
            headers=headers
        )
        
        assert response.status_code == 400, f"Should reject >3 favorites: {response.status_code}"
        data = response.json()
        assert "error" in data, "Should return error message"
        print(f"✅ Max 3 favorites limit enforced: {data.get('error')}")
    
    def test_workout_summary_nonexistent_workout(self, headers):
        """Test summary endpoint with non-existent workout ID"""
        response = requests.get(
            f"{BASE_URL}/api/stats/workout-summary/nonexistent_workout_12345",
            headers=headers
        )
        
        assert response.status_code == 200, f"Should return 200 with empty data: {response.status_code}"
        data = response.json()
        
        # Should return empty exercises array
        exercises = data.get("exercises", [])
        assert len(exercises) == 0, f"Should have no exercises for non-existent workout"
        print(f"✅ Non-existent workout returns empty data correctly")
    
    def test_log_set_without_auth(self):
        """Test that log-set endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/workout/log-set",
            json={
                "exerciseName": "Test",
                "exerciseId": "test",
                "setNumber": 1,
                "weight": 50,
                "reps": 10,
                "workoutId": "test"
            },
            headers={"Content-Type": "application/json"}  # No auth header
        )
        
        assert response.status_code == 401, f"Should require auth: {response.status_code}"
        print(f"✅ Authentication required for log-set endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
