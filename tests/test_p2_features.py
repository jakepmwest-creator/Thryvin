"""
P2 Features Backend Tests - Exercise Stats & Workout Summary Enhancements

Tests for P2 implementation:
1. Complete workout with 2 exercises + 3 sets
2. Workout summary shows volume > 0
3. Exercise Detail (/api/stats/exercise/:id) returns lastSession + pbs + history
4. Stats exercise list (/api/stats/exercises) returns user's exercises with hasPerformed=true
5. Pin from Exercise Detail -> favorites persist

Test credentials: test@example.com / password123
API Base URL: https://workout-data-cleanup.preview.emergentagent.com
"""

import pytest
import requests
import os
import time
import uuid

# API Base URL from environment or default
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://workout-data-cleanup.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


class TestP2Authentication:
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
        print(f"✅ Authentication successful, token length: {len(auth_token)}")


class TestAcceptance1And2_CompleteWorkoutWithSummary:
    """
    ACCEPTANCE 1: Complete workout with 2 exercises + 3 sets
    ACCEPTANCE 2: Workout summary shows volume > 0
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
        return f"p2_test_workout_{int(time.time())}"
    
    def test_acceptance1_complete_workout_with_2_exercises_3_sets(self, headers, unique_workout_id):
        """
        ACCEPTANCE 1: Complete workout with 2 exercises + 3 sets
        Log sets for 2 different exercises with at least 3 total sets
        """
        # Define sets: 2 exercises, 3 total sets (2 for first exercise, 1 for second)
        sets_to_log = [
            {"exerciseName": "P2 Bench Press", "exerciseId": "p2_bench_press", "setNumber": 1, "weight": 80, "reps": 10},
            {"exerciseName": "P2 Bench Press", "exerciseId": "p2_bench_press", "setNumber": 2, "weight": 85, "reps": 8},
            {"exerciseName": "P2 Squat", "exerciseId": "p2_squat", "setNumber": 1, "weight": 100, "reps": 8},
        ]
        
        logged_sets = []
        
        for set_data in sets_to_log:
            payload = {
                **set_data,
                "workoutId": unique_workout_id
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
        
        # Verify we have 2 unique exercises
        unique_exercises = set(s['exerciseId'] for s in logged_sets)
        assert len(unique_exercises) == 2, f"Should have 2 unique exercises, got {len(unique_exercises)}"
        
        print(f"✅ ACCEPTANCE 1 PASSED: Completed workout with 2 exercises ({unique_exercises}) and 3 sets")
        print(f"   WorkoutId: {unique_workout_id}")
    
    def test_acceptance2_workout_summary_shows_volume_greater_than_zero(self, headers, unique_workout_id):
        """
        ACCEPTANCE 2: Workout summary shows volume > 0
        After completing workout, verify summary endpoint returns correct stats
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
        assert len(exercises) == 2, f"Expected 2 exercises, got {len(exercises)}"
        
        # Verify stats
        stats = data.get("stats")
        assert stats is not None, f"No stats in summary. Response: {data}"
        
        # ACCEPTANCE CRITERIA: volume > 0
        total_volume = stats.get("totalVolume", 0)
        assert total_volume > 0, f"Total volume should be > 0, got {total_volume}"
        
        # Calculate expected volume: (80*10) + (85*8) + (100*8) = 800 + 680 + 800 = 2280
        expected_min_volume = 2000  # Allow some tolerance
        assert total_volume >= expected_min_volume, f"Volume {total_volume} seems too low, expected >= {expected_min_volume}"
        
        # Verify exercise count
        exercise_count = stats.get("exerciseCount", 0)
        assert exercise_count == 2, f"Exercise count should be 2, got {exercise_count}"
        
        # Verify total sets
        total_sets = stats.get("totalSets", 0)
        assert total_sets == 3, f"Total sets should be 3, got {total_sets}"
        
        print(f"✅ ACCEPTANCE 2 PASSED: Workout Summary Stats:")
        print(f"   - Total Volume: {total_volume} (expected >= {expected_min_volume})")
        print(f"   - Exercises Completed: {exercise_count}")
        print(f"   - Total Sets: {total_sets}")
        
        # Verify each exercise has sets with proper structure
        for exercise in exercises:
            assert "exerciseName" in exercise, "Exercise missing name"
            assert "sets" in exercise, "Exercise missing sets"
            assert len(exercise["sets"]) > 0, f"Exercise {exercise.get('exerciseName')} has no sets"
            
            # Verify set structure includes setNumber, weight, reps, volume
            for set_data in exercise["sets"]:
                assert "setNumber" in set_data, f"Set missing setNumber in {exercise.get('exerciseName')}"
                assert "weight" in set_data, f"Set missing weight in {exercise.get('exerciseName')}"
                assert "reps" in set_data, f"Set missing reps in {exercise.get('exerciseName')}"
            
            print(f"   - {exercise['exerciseName']}: {len(exercise['sets'])} sets, volume={exercise.get('totalVolume', 0)}")


class TestAcceptance3_ExerciseDetailEndpoint:
    """
    ACCEPTANCE 3: Exercise Detail (/api/stats/exercise/:id) returns lastSession + pbs + history
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
    def setup_exercise_data(self, headers):
        """Setup: Log some sets for a specific exercise to test detail endpoint"""
        exercise_id = f"p2_detail_test_{int(time.time())}"
        workout_id = f"p2_detail_workout_{int(time.time())}"
        
        sets_to_log = [
            {"exerciseName": "P2 Detail Test Exercise", "exerciseId": exercise_id, "setNumber": 1, "weight": 60, "reps": 12},
            {"exerciseName": "P2 Detail Test Exercise", "exerciseId": exercise_id, "setNumber": 2, "weight": 65, "reps": 10},
            {"exerciseName": "P2 Detail Test Exercise", "exerciseId": exercise_id, "setNumber": 3, "weight": 70, "reps": 8},
        ]
        
        for set_data in sets_to_log:
            payload = {**set_data, "workoutId": workout_id}
            response = requests.post(
                f"{BASE_URL}/api/workout/log-set",
                json=payload,
                headers=headers
            )
            assert response.status_code == 200, f"Setup failed: {response.text}"
        
        time.sleep(0.5)  # Allow data to persist
        return {"exercise_id": exercise_id, "workout_id": workout_id, "sets": sets_to_log}
    
    def test_acceptance3_exercise_detail_returns_last_session(self, headers, setup_exercise_data):
        """
        ACCEPTANCE 3a: Exercise Detail returns lastSession with individual sets
        """
        exercise_id = setup_exercise_data["exercise_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/{exercise_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get exercise detail: {response.status_code} - {response.text}"
        data = response.json()
        
        assert data.get("ok") == True, f"Exercise detail failed: {data}"
        assert data.get("exerciseId") == exercise_id, f"Wrong exerciseId returned"
        
        # Verify lastSession exists and has sets array
        last_session = data.get("lastSession")
        assert last_session is not None, f"lastSession is missing. Response: {data}"
        
        # Verify lastSession has sets array with individual set data
        session_sets = last_session.get("sets", [])
        assert len(session_sets) >= 3, f"lastSession should have at least 3 sets, got {len(session_sets)}"
        
        # Verify each set has required fields
        for set_data in session_sets:
            assert "setNumber" in set_data, f"Set missing setNumber: {set_data}"
            assert "weight" in set_data, f"Set missing weight: {set_data}"
            assert "reps" in set_data, f"Set missing reps: {set_data}"
            assert "volume" in set_data, f"Set missing volume: {set_data}"
        
        print(f"✅ ACCEPTANCE 3a PASSED: lastSession returned with {len(session_sets)} sets")
        for s in session_sets:
            print(f"   - Set {s['setNumber']}: {s['weight']}kg x {s['reps']} = {s['volume']}kg volume")
    
    def test_acceptance3_exercise_detail_returns_pbs(self, headers, setup_exercise_data):
        """
        ACCEPTANCE 3b: Exercise Detail returns pbs with maxWeight/maxReps/maxVolume
        """
        exercise_id = setup_exercise_data["exercise_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/{exercise_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get exercise detail: {response.status_code}"
        data = response.json()
        
        # Verify pbs exists
        pbs = data.get("pbs")
        assert pbs is not None, f"pbs is missing. Response: {data}"
        
        # Verify pbs has required fields
        assert "maxWeight" in pbs, f"pbs missing maxWeight: {pbs}"
        assert "maxReps" in pbs, f"pbs missing maxReps: {pbs}"
        assert "maxVolume" in pbs, f"pbs missing maxVolume: {pbs}"
        
        # Verify values are correct based on logged data
        # Logged: 60x12, 65x10, 70x8
        # maxWeight should be 70
        # maxReps should be 12
        # maxVolume should be max(60*12=720, 65*10=650, 70*8=560) = 720
        assert pbs["maxWeight"] == 70, f"maxWeight should be 70, got {pbs['maxWeight']}"
        assert pbs["maxReps"] == 12, f"maxReps should be 12, got {pbs['maxReps']}"
        assert pbs["maxVolume"] == 720, f"maxVolume should be 720, got {pbs['maxVolume']}"
        
        # Verify estimated 1RM is calculated
        assert "estimatedOneRM" in pbs, f"pbs missing estimatedOneRM: {pbs}"
        assert pbs["estimatedOneRM"] > 0, f"estimatedOneRM should be > 0"
        
        print(f"✅ ACCEPTANCE 3b PASSED: pbs returned correctly")
        print(f"   - maxWeight: {pbs['maxWeight']}kg")
        print(f"   - maxReps: {pbs['maxReps']}")
        print(f"   - maxVolume: {pbs['maxVolume']}kg")
        print(f"   - estimatedOneRM: {pbs['estimatedOneRM']}kg")
    
    def test_acceptance3_exercise_detail_returns_history(self, headers, setup_exercise_data):
        """
        ACCEPTANCE 3c: Exercise Detail returns history array
        """
        exercise_id = setup_exercise_data["exercise_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/{exercise_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get exercise detail: {response.status_code}"
        data = response.json()
        
        # Verify history exists
        history = data.get("history")
        assert history is not None, f"history is missing. Response: {data}"
        assert isinstance(history, list), f"history should be a list, got {type(history)}"
        assert len(history) >= 1, f"history should have at least 1 entry"
        
        # Verify history entry structure
        for entry in history:
            assert "date" in entry, f"history entry missing date: {entry}"
            assert "maxWeight" in entry, f"history entry missing maxWeight: {entry}"
            assert "totalVolume" in entry, f"history entry missing totalVolume: {entry}"
        
        print(f"✅ ACCEPTANCE 3c PASSED: history returned with {len(history)} entries")
        for h in history:
            print(f"   - {h['date']}: maxWeight={h['maxWeight']}kg, volume={h['totalVolume']}kg")


class TestAcceptance4_StatsExercisesList:
    """
    ACCEPTANCE 4: Stats exercise list (/api/stats/exercises) returns user's exercises with hasPerformed=true
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
    
    def test_acceptance4_stats_exercises_returns_list_with_has_performed(self, headers):
        """
        ACCEPTANCE 4: GET /api/stats/exercises returns user's exercises with hasPerformed=true
        """
        response = requests.get(
            f"{BASE_URL}/api/stats/exercises",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get exercises list: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify exercises array exists
        exercises = data.get("exercises", [])
        assert isinstance(exercises, list), f"exercises should be a list"
        
        # We should have at least some exercises from previous tests
        # (P2 Bench Press, P2 Squat, P2 Detail Test Exercise)
        assert len(exercises) >= 1, f"Should have at least 1 exercise, got {len(exercises)}"
        
        # Verify each exercise has hasPerformed=true
        for exercise in exercises:
            assert "exerciseId" in exercise, f"Exercise missing exerciseId: {exercise}"
            assert "exerciseName" in exercise, f"Exercise missing exerciseName: {exercise}"
            assert "hasPerformed" in exercise, f"Exercise missing hasPerformed flag: {exercise}"
            assert exercise["hasPerformed"] == True, f"hasPerformed should be True for {exercise['exerciseName']}"
            
            # Verify other expected fields
            assert "maxWeight" in exercise, f"Exercise missing maxWeight: {exercise}"
            assert "lastPerformed" in exercise, f"Exercise missing lastPerformed: {exercise}"
        
        print(f"✅ ACCEPTANCE 4 PASSED: /api/stats/exercises returned {len(exercises)} exercises")
        print(f"   All exercises have hasPerformed=true")
        
        # Print first few exercises
        for ex in exercises[:5]:
            print(f"   - {ex['exerciseName']}: maxWeight={ex['maxWeight']}kg, hasPerformed={ex['hasPerformed']}")
        
        if len(exercises) > 5:
            print(f"   ... and {len(exercises) - 5} more exercises")


class TestAcceptance5_PinFromExerciseDetail:
    """
    ACCEPTANCE 5: Pin from Exercise Detail -> favorites persist
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
    
    def test_acceptance5_pin_exercise_from_detail_persists(self, headers):
        """
        ACCEPTANCE 5: Pin exercise from Exercise Detail -> favorites persist
        Simulates the flow: View exercise detail -> Pin as favorite -> Verify persistence
        """
        # First, get the list of exercises to find one to pin
        response = requests.get(
            f"{BASE_URL}/api/stats/exercises",
            headers=headers
        )
        assert response.status_code == 200, f"Failed to get exercises: {response.status_code}"
        exercises = response.json().get("exercises", [])
        
        if len(exercises) < 1:
            pytest.skip("No exercises available to pin")
        
        # Select exercises to pin (up to 3)
        exercises_to_pin = [ex["exerciseId"] for ex in exercises[:3]]
        
        print(f"📌 Pinning {len(exercises_to_pin)} exercises as favorites: {exercises_to_pin}")
        
        # Step 1: PUT favorites (simulating pin action from Exercise Detail)
        response = requests.put(
            f"{BASE_URL}/api/stats/favorites",
            json={"exerciseIds": exercises_to_pin},
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to PUT favorites: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"PUT favorites failed: {data}"
        
        print(f"✅ PUT favorites successful")
        
        # Step 2: GET favorites to verify persistence
        time.sleep(0.5)  # Allow data to persist
        
        response = requests.get(
            f"{BASE_URL}/api/stats/favorites",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to GET favorites: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify favoriteIds are returned and match what we pinned
        favorite_ids = data.get("favoriteIds", [])
        assert len(favorite_ids) == len(exercises_to_pin), f"Expected {len(exercises_to_pin)} favorites, got {len(favorite_ids)}"
        
        for ex_id in exercises_to_pin:
            assert ex_id in favorite_ids, f"Exercise {ex_id} not in favoriteIds: {favorite_ids}"
        
        print(f"✅ ACCEPTANCE 5 PASSED: Favorites persisted correctly")
        print(f"   Pinned: {exercises_to_pin}")
        print(f"   Retrieved: {favorite_ids}")
        
        # Verify favorites array (with stats) is also returned
        favorites = data.get("favorites", [])
        print(f"   Favorites with stats: {len(favorites)} items")
        
        for fav in favorites:
            print(f"   - {fav.get('exerciseName', fav.get('exerciseId'))}: PB={fav.get('actualPB', 'N/A')}kg")


class TestExerciseDetailEdgeCases:
    """Edge case tests for Exercise Detail endpoint"""
    
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
    
    def test_exercise_detail_nonexistent_exercise(self, headers):
        """Test exercise detail endpoint with non-existent exercise ID"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/nonexistent_exercise_xyz_12345",
            headers=headers
        )
        
        assert response.status_code == 200, f"Should return 200 with empty data: {response.status_code}"
        data = response.json()
        
        # Should return ok=true with empty/null data
        assert data.get("ok") == True, f"Should return ok=true"
        assert data.get("history") == [] or data.get("history") is None, "Should have empty history"
        assert data.get("pbs") is None, "Should have null pbs"
        assert data.get("lastSession") is None, "Should have null lastSession"
        
        print(f"✅ Non-existent exercise returns empty data correctly")
    
    def test_exercise_detail_without_auth(self):
        """Test that exercise detail endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/some_exercise",
            headers={"Content-Type": "application/json"}  # No auth header
        )
        
        assert response.status_code == 401, f"Should require auth: {response.status_code}"
        print(f"✅ Authentication required for exercise detail endpoint")
    
    def test_stats_exercises_without_auth(self):
        """Test that stats exercises endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercises",
            headers={"Content-Type": "application/json"}  # No auth header
        )
        
        assert response.status_code == 401, f"Should require auth: {response.status_code}"
        print(f"✅ Authentication required for stats exercises endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
