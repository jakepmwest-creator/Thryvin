"""
Backend API Tests for Iteration 18:
Testing features as specified for Thryvin Fitness app on Railway backend:

1. GET /api/health returns ok:true
2. POST /api/auth/login returns accessToken for test@example.com/password123
3. GET /api/exercises?limit=5 returns exercises
4. GET /api/stats/exercise/{id} returns stats with history array
5. GET /api/stats/exercise/nonexistent_exercise returns empty history array (NOT error)
6. GET /api/stats/favorites returns favorites data

Key features tested:
- Explore modal exercise detail now fetches stats via /api/stats/exercise/{id}
- Exercise stats show PB, 1RM, sessions, last sets if user has done it
- Shows 'Never completed' if no history exists (empty history array)

Note: Frontend is React Native Expo (cannot be browser tested)
RevenueCat is MOCKED

Backend: Express.js + TypeScript on Railway
"""

import pytest
import requests

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
class TestHealthEndpoint:
    """Test 1: GET /api/health returns ok:true on Railway"""

    def test_health_returns_ok_true(self):
        """GET /api/health returns {ok: true}"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok:true, got ok:{data.get('ok')}"
        print(f"✅ /api/health returns ok:true")


# ==================== FEATURE 2: Auth Login ====================
class TestAuthLogin:
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


# ==================== FEATURE 3: Exercises Endpoint ====================
class TestExercisesEndpoint:
    """Test 3: GET /api/exercises?limit=5 returns exercises"""

    def test_exercises_returns_array_with_limit(self):
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
        
        # Verify each exercise has required fields
        for ex in exercises:
            assert "id" in ex, "Exercise missing id"
            assert "name" in ex, "Exercise missing name"
        
        print(f"✅ /api/exercises?limit=5 returns {len(exercises)} exercises")


# ==================== FEATURE 4: Exercise Stats with History ====================
class TestExerciseStatsWithHistory:
    """Test 4: GET /api/stats/exercise/{id} returns stats with history array"""

    def test_exercise_stats_returns_history_array(self, auth_token):
        """Exercise stats endpoint returns history array for known exercise"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/bench_press",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text[:300]}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok:true, got ok:{data.get('ok')}"
        assert "history" in data, "Response missing 'history' field"
        assert isinstance(data["history"], list), f"history should be array, got {type(data['history'])}"
        
        print(f"✅ /api/stats/exercise/bench_press returns history array with {len(data['history'])} sessions")

    def test_exercise_stats_has_required_fields(self, auth_token):
        """Exercise stats contains required fields for UI display"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/bench_press",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields for ExerciseDetail component
        required_fields = ["exerciseId", "name", "history"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # If history exists, verify history entry structure
        if len(data["history"]) > 0:
            history_entry = data["history"][0]
            history_fields = ["date", "maxWeight", "totalSets"]
            for field in history_fields:
                assert field in history_entry, f"History entry missing field: {field}"
            print(f"  ✓ History entry has: date={history_entry.get('date')}, maxWeight={history_entry.get('maxWeight')}, totalSets={history_entry.get('totalSets')}")
        
        print(f"✅ Exercise stats has all required fields")

    def test_exercise_stats_has_pbs_for_completed_exercise(self, auth_token):
        """Exercise stats shows PB/1RM for exercises the user has done"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/bench_press",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # For exercises with history, should have pbs data
        if len(data.get("history", [])) > 0:
            assert "pbs" in data, "Should have 'pbs' field for completed exercise"
            pbs = data.get("pbs")
            if pbs:
                assert "maxWeight" in pbs or "estimatedOneRM" in pbs, "pbs should have maxWeight or estimatedOneRM"
                print(f"  ✓ PBs: maxWeight={pbs.get('maxWeight')}, estimatedOneRM={pbs.get('estimatedOneRM')}")
        
        print(f"✅ Exercise stats shows PB data for completed exercise")

    def test_exercise_stats_has_last_session(self, auth_token):
        """Exercise stats includes lastSession for exercises the user has done"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/bench_press",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # For exercises with history, should have lastSession data
        if len(data.get("history", [])) > 0:
            assert "lastSession" in data, "Should have 'lastSession' field for completed exercise"
            if data.get("lastSession"):
                last_session = data["lastSession"]
                assert "date" in last_session, "lastSession should have date"
                assert "sets" in last_session, "lastSession should have sets"
                print(f"  ✓ Last session: date={last_session.get('date')}, sets count={len(last_session.get('sets', []))}")
        
        print(f"✅ Exercise stats shows lastSession data")


# ==================== FEATURE 5: Exercise Stats for Nonexistent Exercise ====================
class TestExerciseStatsNonexistent:
    """Test 5: GET /api/stats/exercise/nonexistent_exercise returns empty history array (NOT error)"""

    def test_nonexistent_exercise_returns_200_not_error(self, auth_token):
        """Nonexistent exercise ID should return 200, NOT an error"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/nonexistent_exercise_xyz123",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        # CRITICAL: Should return 200, not 404 or 500
        assert response.status_code == 200, f"Expected 200 for nonexistent exercise, got {response.status_code}"
        
        print(f"✅ Nonexistent exercise returns 200, not error")

    def test_nonexistent_exercise_returns_empty_history_array(self, auth_token):
        """Nonexistent exercise should return empty history array"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/nonexistent_exercise_xyz123",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok:true, got ok:{data.get('ok')}"
        assert "history" in data, "Response should have 'history' field"
        assert isinstance(data["history"], list), f"history should be array, got {type(data['history'])}"
        assert len(data["history"]) == 0, f"Expected empty history array, got {len(data['history'])} items"
        
        print(f"✅ Nonexistent exercise returns empty history array: {data['history']}")

    def test_nonexistent_exercise_has_null_pbs_and_lastSession(self, auth_token):
        """Nonexistent exercise should have null pbs and lastSession"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/never_done_exercise",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # For exercises never completed, pbs and lastSession should be null
        assert data.get("pbs") is None, f"pbs should be null for never-completed exercise, got {data.get('pbs')}"
        assert data.get("lastSession") is None, f"lastSession should be null for never-completed exercise, got {data.get('lastSession')}"
        
        print(f"✅ Never-completed exercise correctly shows pbs=null, lastSession=null")

    def test_nonexistent_exercise_structure_for_ui(self, auth_token):
        """Verify response structure allows UI to show 'Never completed' message"""
        response = requests.get(
            f"{BASE_URL}/api/stats/exercise/some_random_exercise_id",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # UI checks: hasHistory = stats?.history && stats.history.length > 0
        # If hasHistory is false, UI shows "Never completed this exercise"
        history = data.get("history", [])
        has_history = isinstance(history, list) and len(history) > 0
        
        assert has_history == False, "Non-existent exercise should have no history"
        print(f"✅ Response structure supports 'Never completed' UI state: history={history}")


# ==================== FEATURE 6: Stats Favorites ====================
class TestStatsFavorites:
    """Test 6: GET /api/stats/favorites returns favorites data"""

    def test_favorites_returns_array(self, auth_token):
        """Favorites endpoint returns favorites array"""
        response = requests.get(
            f"{BASE_URL}/api/stats/favorites",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "favorites" in data, "Response missing 'favorites' field"
        assert isinstance(data["favorites"], list), "favorites should be an array"
        
        print(f"✅ /api/stats/favorites returns array with {len(data['favorites'])} favorites")

    def test_favorites_have_required_fields(self, auth_token):
        """Each favorite has exerciseId, exerciseName, actualPB fields"""
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
        
        print(f"✅ All {len(favorites)} favorites have required fields")


# ==================== Integration Test ====================
class TestExerciseStatsIntegration:
    """Integration test for exercise stats flow used by ExploreWorkoutsModal"""

    def test_full_exercise_detail_flow(self, auth_token):
        """Test complete flow: exercises list -> select one -> get stats"""
        # 1. Get exercises list
        exercises_response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"limit": 5},
            timeout=30
        )
        assert exercises_response.status_code == 200
        exercises = exercises_response.json().get("exercises", [])
        
        if len(exercises) == 0:
            pytest.skip("No exercises returned")
        
        # 2. Select first exercise
        exercise = exercises[0]
        exercise_id = exercise.get("id") or exercise.get("slug") or exercise.get("name", "").lower().replace(" ", "_")
        print(f"  Selected exercise: {exercise.get('name')} (id: {exercise_id})")
        
        # 3. Get stats for that exercise
        stats_response = requests.get(
            f"{BASE_URL}/api/stats/exercise/{exercise_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        
        # Should always return 200, whether user has done exercise or not
        assert stats_response.status_code == 200, f"Stats endpoint should return 200, got {stats_response.status_code}"
        
        stats = stats_response.json()
        assert stats.get("ok") == True
        assert "history" in stats
        
        # UI can now determine if user has completed this exercise
        has_history = len(stats.get("history", [])) > 0
        print(f"  User has {'completed' if has_history else 'never completed'} this exercise")
        print(f"✅ Full exercise detail flow works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
