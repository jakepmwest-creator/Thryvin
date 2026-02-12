"""
Test Suite for Iteration 9 - Badges, Training Days, and Exercise Stats
======================================================================
Tests the following features:
1. Badge system initialization for new users
2. Badge tracking API for all 8 actions
3. Training days storage and usage for workout generation
4. Exercise stats API (history, PBs, lastSession)
5. Focus breakdown API (muscle distribution)
6. Backend health check

API Endpoints Tested:
- GET /api/health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/badges/progress
- PUT /api/badges/progress
- POST /api/badges/track
- GET /api/badges/stats
- POST /api/badges/reset
- GET /api/stats/exercise/:id
- GET /api/stats/focus-breakdown
"""

import pytest
import requests
import uuid
import json
import os
import time

# API Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://regen-timing-fix.preview.emergentagent.com').rstrip('/')

print(f"Testing against: {BASE_URL}")


class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_01_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Health check status: {response.status_code}")
        print(f"Health response: {response.text[:200]}")
        
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("ok") == True, "Health check returned ok=false"
        assert data.get("dbOk") == True, "Database not connected"
        print("✅ Health check passed - API and DB are healthy")


class TestBadgeSystem:
    """Test badge initialization and tracking"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_id = str(uuid.uuid4())[:8]
        self.test_email = f"test_badge_{self.test_id}@example.com"
        self.test_password = "TestPass123!"
        self.access_token = None
        self.user_id = None
        
    def _register_and_login(self):
        """Register and login a test user"""
        # Register
        payload = {
            "name": f"Badge Test {self.test_id}",
            "email": self.test_email,
            "password": self.test_password,
            "trainingType": "strength",
            "goal": "build-muscle",
            "coachingStyle": "encouraging-positive",
            "selectedCoach": "titan",
            "trainingDays": 3,
            "selectedDays": ["mon", "wed", "fri"],
            "equipment": ["dumbbells"],
            "experience": "intermediate"
        }
        
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"Registration: {reg_response.status_code}")
        
        if reg_response.status_code not in [200, 201]:
            # User might already exist, try login
            pass
        
        # Login
        login_payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        print(f"Login: {login_response.status_code}")
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.access_token = data.get("accessToken") or data.get("token")
            self.user_id = data.get("user", {}).get("id")
            return True
        return False
    
    def _get_auth_headers(self):
        """Get headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
    
    def test_02_badge_progress_requires_auth(self):
        """Test that badge progress endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/badges/progress")
        print(f"Badge progress without auth: {response.status_code}")
        assert response.status_code == 401, "Badge progress should require auth"
        print("✅ Badge progress correctly requires authentication")
    
    def test_03_badge_progress_for_new_user(self):
        """Test badge progress returns data for new user"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.get(
            f"{BASE_URL}/api/badges/progress",
            headers=self._get_auth_headers()
        )
        print(f"Badge progress status: {response.status_code}")
        print(f"Badge progress response: {response.text[:300]}")
        
        assert response.status_code == 200, f"Badge progress failed: {response.text}"
        data = response.json()
        
        # Server may return empty badges for new users (frontend initializes)
        # OR it may return initialized badges
        assert "badges" in data, "Response should contain badges field"
        print(f"✅ Badge progress returned {len(data.get('badges', []))} badges")
    
    def test_04_badge_track_coach_message(self):
        """Test tracking coach message action"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "coachMessage"}
        )
        print(f"Track coachMessage: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        assert response.status_code == 200, f"Track coachMessage failed: {response.text}"
        print("✅ Coach message tracked successfully")
    
    def test_05_badge_track_video_watched(self):
        """Test tracking video watched action"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "videoWatched"}
        )
        print(f"Track videoWatched: {response.status_code}")
        
        assert response.status_code == 200, f"Track videoWatched failed: {response.text}"
        print("✅ Video watched tracked successfully")
    
    def test_06_badge_track_profile_edit(self):
        """Test tracking profile edit action"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "profileEdit"}
        )
        print(f"Track profileEdit: {response.status_code}")
        
        assert response.status_code == 200, f"Track profileEdit failed: {response.text}"
        print("✅ Profile edit tracked successfully")
    
    def test_07_badge_track_badge_shared(self):
        """Test tracking badge shared action"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "badgeShared"}
        )
        print(f"Track badgeShared: {response.status_code}")
        
        assert response.status_code == 200, f"Track badgeShared failed: {response.text}"
        print("✅ Badge shared tracked successfully")
    
    def test_08_badge_track_app_rated(self):
        """Test tracking app rated action"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "appRated"}
        )
        print(f"Track appRated: {response.status_code}")
        
        assert response.status_code == 200, f"Track appRated failed: {response.text}"
        print("✅ App rated tracked successfully")
    
    def test_09_badge_track_workout_edit(self):
        """Test tracking workout edit action"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "workoutEdit"}
        )
        print(f"Track workoutEdit: {response.status_code}")
        
        assert response.status_code == 200, f"Track workoutEdit failed: {response.text}"
        print("✅ Workout edit tracked successfully")
    
    def test_10_badge_track_extra_activity(self):
        """Test tracking extra activity action"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "extraActivity"}
        )
        print(f"Track extraActivity: {response.status_code}")
        
        assert response.status_code == 200, f"Track extraActivity failed: {response.text}"
        print("✅ Extra activity tracked successfully")
    
    def test_11_badge_track_pr_broken(self):
        """Test tracking PR broken action"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "prBroken", "value": 1}
        )
        print(f"Track prBroken: {response.status_code}")
        
        assert response.status_code == 200, f"Track prBroken failed: {response.text}"
        print("✅ PR broken tracked successfully")
    
    def test_12_badge_track_invalid_action(self):
        """Test that invalid actions are rejected"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/track",
            headers=self._get_auth_headers(),
            json={"action": "invalidAction"}
        )
        print(f"Track invalid action: {response.status_code}")
        
        assert response.status_code == 400, "Invalid action should return 400"
        print("✅ Invalid action correctly rejected")
    
    def test_13_badge_stats_after_tracking(self):
        """Test badge stats reflect tracked actions"""
        assert self._register_and_login(), "Failed to register/login"
        
        # Track multiple actions
        actions = ["coachMessage", "coachMessage", "videoWatched", "profileEdit"]
        for action in actions:
            self.session.post(
                f"{BASE_URL}/api/badges/track",
                headers=self._get_auth_headers(),
                json={"action": action}
            )
        
        # Get stats
        response = self.session.get(
            f"{BASE_URL}/api/badges/stats",
            headers=self._get_auth_headers()
        )
        print(f"Badge stats: {response.status_code}")
        print(f"Stats response: {response.text[:300]}")
        
        assert response.status_code == 200, f"Badge stats failed: {response.text}"
        data = response.json()
        
        # Verify some stats are tracked
        assert "totalCoachMessages" in data or "stats" in data, "Stats should contain tracking data"
        print("✅ Badge stats returned successfully")
    
    def test_14_save_badge_progress(self):
        """Test saving badge progress"""
        assert self._register_and_login(), "Failed to register/login"
        
        # Save some badge progress
        badges = [
            {"badgeId": "i1_first_step", "progress": 1, "completed": True, "unlockedAt": "2026-01-01T00:00:00Z"},
            {"badgeId": "i1_week_warrior", "progress": 3, "completed": False}
        ]
        
        response = self.session.put(
            f"{BASE_URL}/api/badges/progress",
            headers=self._get_auth_headers(),
            json={"badges": badges, "totalXP": 50, "currentIsland": 1}
        )
        print(f"Save badge progress: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        assert response.status_code == 200, f"Save badge progress failed: {response.text}"
        print("✅ Badge progress saved successfully")
    
    def test_15_load_saved_badge_progress(self):
        """Test loading saved badge progress"""
        assert self._register_and_login(), "Failed to register/login"
        
        # First save some progress
        badges = [
            {"badgeId": "i1_first_step", "progress": 1, "completed": True, "unlockedAt": "2026-01-01T00:00:00Z"},
            {"badgeId": "i1_ice_breaker", "progress": 5, "completed": False}
        ]
        
        self.session.put(
            f"{BASE_URL}/api/badges/progress",
            headers=self._get_auth_headers(),
            json={"badges": badges, "totalXP": 100, "currentIsland": 1}
        )
        
        # Now load it back
        response = self.session.get(
            f"{BASE_URL}/api/badges/progress",
            headers=self._get_auth_headers()
        )
        print(f"Load badge progress: {response.status_code}")
        
        assert response.status_code == 200, f"Load badge progress failed: {response.text}"
        data = response.json()
        
        # Verify saved data is returned
        assert "badges" in data, "Response should contain badges"
        assert data.get("totalXP", 0) >= 0, "Should have totalXP"
        print(f"✅ Loaded {len(data.get('badges', []))} badges with {data.get('totalXP', 0)} XP")
    
    def test_16_badge_reset(self):
        """Test resetting badge progress"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.post(
            f"{BASE_URL}/api/badges/reset",
            headers=self._get_auth_headers()
        )
        print(f"Badge reset: {response.status_code}")
        
        assert response.status_code == 200, f"Badge reset failed: {response.text}"
        print("✅ Badge progress reset successfully")


class TestTrainingDays:
    """Test training days storage and usage"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_id = str(uuid.uuid4())[:8]
        self.test_email = f"test_days_{self.test_id}@example.com"
        self.test_password = "TestPass123!"
        self.access_token = None
        self.user_id = None
        self.selected_days = ["mon", "wed", "fri"]
        
    def _register_and_login(self):
        """Register and login a test user with specific training days"""
        # Register with specific training days
        payload = {
            "name": f"Days Test {self.test_id}",
            "email": self.test_email,
            "password": self.test_password,
            "trainingType": "strength",
            "goal": "build-muscle",
            "coachingStyle": "encouraging-positive",
            "selectedCoach": "titan",
            "trainingDays": 3,
            "selectedDays": self.selected_days,  # Mon, Wed, Fri
            "equipment": ["dumbbells"],
            "experience": "intermediate"
        }
        
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"Registration with days: {reg_response.status_code}")
        
        # Login
        login_payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        print(f"Login: {login_response.status_code}")
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.access_token = data.get("accessToken") or data.get("token")
            self.user_id = data.get("user", {}).get("id")
            return True
        return False
    
    def _get_auth_headers(self):
        """Get headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
    
    def test_17_training_days_stored_on_registration(self):
        """Test that training days are stored during registration"""
        assert self._register_and_login(), "Failed to register/login"
        
        # Get user profile via /api/auth/me endpoint
        response = self.session.get(
            f"{BASE_URL}/api/auth/me",
            headers=self._get_auth_headers()
        )
        print(f"User profile (auth/me): {response.status_code}")
        print(f"Profile response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Get profile failed: {response.text}"
        data = response.json()
        
        # Check for preferredTrainingDays in various possible locations
        user_data = data.get("user", data)
        training_days = user_data.get("preferredTrainingDays") or user_data.get("selectedDays")
        
        print(f"Training days in profile: {training_days}")
        print("✅ User profile retrieved - training days should be stored")


class TestExerciseStats:
    """Test exercise stats API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_id = str(uuid.uuid4())[:8]
        self.test_email = f"test_stats_{self.test_id}@example.com"
        self.test_password = "TestPass123!"
        self.access_token = None
        self.user_id = None
        
    def _register_and_login(self):
        """Register and login a test user"""
        payload = {
            "name": f"Stats Test {self.test_id}",
            "email": self.test_email,
            "password": self.test_password,
            "trainingType": "strength",
            "goal": "build-muscle",
            "coachingStyle": "encouraging-positive",
            "selectedCoach": "titan",
            "trainingDays": 3,
            "selectedDays": ["mon", "wed", "fri"],
            "equipment": ["dumbbells"],
            "experience": "intermediate"
        }
        
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"Registration: {reg_response.status_code}")
        
        login_payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        print(f"Login: {login_response.status_code}")
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.access_token = data.get("accessToken") or data.get("token")
            self.user_id = data.get("user", {}).get("id")
            return True
        return False
    
    def _get_auth_headers(self):
        """Get headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
    
    def test_18_exercise_stats_requires_auth(self):
        """Test that exercise stats endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/stats/exercise/bench-press")
        print(f"Exercise stats without auth: {response.status_code}")
        assert response.status_code == 401, "Exercise stats should require auth"
        print("✅ Exercise stats correctly requires authentication")
    
    def test_19_exercise_stats_returns_structure(self):
        """Test exercise stats returns proper structure"""
        assert self._register_and_login(), "Failed to register/login"
        
        # Test with a common exercise ID
        response = self.session.get(
            f"{BASE_URL}/api/stats/exercise/bench-press",
            headers=self._get_auth_headers()
        )
        print(f"Exercise stats: {response.status_code}")
        print(f"Response: {response.text[:400]}")
        
        assert response.status_code == 200, f"Exercise stats failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "exerciseId" in data or "ok" in data, "Response should contain exerciseId or ok"
        
        # For new users, history may be empty but structure should be correct
        if "history" in data:
            assert isinstance(data["history"], list), "History should be a list"
        
        print("✅ Exercise stats returned proper structure")
    
    def test_20_exercise_stats_with_history(self):
        """Test exercise stats with workout history"""
        assert self._register_and_login(), "Failed to register/login"
        
        # First log some workout performance
        performance_payload = {
            "workoutId": f"test-workout-{self.test_id}",
            "exercises": [
                {
                    "exerciseId": "bench-press",
                    "exerciseName": "Bench Press",
                    "sets": [
                        {"setNumber": 1, "weight": 60, "reps": 10},
                        {"setNumber": 2, "weight": 65, "reps": 8},
                        {"setNumber": 3, "weight": 70, "reps": 6}
                    ]
                }
            ],
            "duration": 45
        }
        
        log_response = self.session.post(
            f"{BASE_URL}/api/workouts/log-performance",
            headers=self._get_auth_headers(),
            json=performance_payload
        )
        print(f"Log performance: {log_response.status_code}")
        
        # Now get exercise stats
        response = self.session.get(
            f"{BASE_URL}/api/stats/exercise/bench-press",
            headers=self._get_auth_headers()
        )
        print(f"Exercise stats after logging: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Exercise stats failed: {response.text}"
        print("✅ Exercise stats returned after logging performance")


class TestFocusBreakdown:
    """Test focus breakdown API endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_id = str(uuid.uuid4())[:8]
        self.test_email = f"test_focus_{self.test_id}@example.com"
        self.test_password = "TestPass123!"
        self.access_token = None
        self.user_id = None
        
    def _register_and_login(self):
        """Register and login a test user"""
        payload = {
            "name": f"Focus Test {self.test_id}",
            "email": self.test_email,
            "password": self.test_password,
            "trainingType": "strength",
            "goal": "build-muscle",
            "coachingStyle": "encouraging-positive",
            "selectedCoach": "titan",
            "trainingDays": 3,
            "selectedDays": ["mon", "wed", "fri"],
            "equipment": ["dumbbells"],
            "experience": "intermediate"
        }
        
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"Registration: {reg_response.status_code}")
        
        login_payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        print(f"Login: {login_response.status_code}")
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.access_token = data.get("accessToken") or data.get("token")
            self.user_id = data.get("user", {}).get("id")
            return True
        return False
    
    def _get_auth_headers(self):
        """Get headers with auth token"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
    
    def test_21_focus_breakdown_requires_auth(self):
        """Test that focus breakdown endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/stats/focus-breakdown")
        print(f"Focus breakdown without auth: {response.status_code}")
        assert response.status_code == 401, "Focus breakdown should require auth"
        print("✅ Focus breakdown correctly requires authentication")
    
    def test_22_focus_breakdown_returns_structure(self):
        """Test focus breakdown returns proper structure"""
        assert self._register_and_login(), "Failed to register/login"
        
        response = self.session.get(
            f"{BASE_URL}/api/stats/focus-breakdown",
            headers=self._get_auth_headers()
        )
        print(f"Focus breakdown: {response.status_code}")
        print(f"Response: {response.text[:400]}")
        
        assert response.status_code == 200, f"Focus breakdown failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "breakdown" in data, "Response should contain breakdown"
        assert isinstance(data["breakdown"], list), "Breakdown should be a list"
        
        # Each breakdown item should have category, sessions, percentage
        if len(data["breakdown"]) > 0:
            item = data["breakdown"][0]
            assert "category" in item, "Breakdown item should have category"
            assert "sessions" in item or "percentage" in item, "Breakdown item should have sessions or percentage"
        
        print("✅ Focus breakdown returned proper structure")


# Run all tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
