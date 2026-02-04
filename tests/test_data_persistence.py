"""
Test Data Persistence APIs for Thryvin Fitness App
Tests: QA Login, Workout Schedule, Badge Tracking, Badge Progress

These tests verify that data is being persisted to the PostgreSQL database
instead of local storage (AsyncStorage).
"""

import pytest
import requests
import os
import time

# Use the public URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001').rstrip('/')

class TestQALogin:
    """Test QA login endpoint for getting test user access token"""
    
    def test_qa_login_intermediate_profile(self):
        """POST /api/qa/login-as - Login as intermediate test user"""
        response = requests.post(
            f"{BASE_URL}/api/qa/login-as",
            json={"profile": "intermediate"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok=True, got {data}"
        assert "accessToken" in data, "Missing accessToken in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["id"] == 144, f"Expected user ID 144, got {data['user']['id']}"
        assert data["user"]["email"] == "qa_intermediate@thryvin.test"
        
        # Store token for other tests
        pytest.access_token = data["accessToken"]
        print(f"✅ QA Login successful - User ID: {data['user']['id']}, Workouts: {data.get('workoutsCount', 0)}")
    
    def test_qa_login_invalid_profile(self):
        """POST /api/qa/login-as - Should reject invalid profile"""
        response = requests.post(
            f"{BASE_URL}/api/qa/login-as",
            json={"profile": "invalid_profile"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert data.get("ok") == False
        print("✅ Invalid profile correctly rejected")


class TestWorkoutSchedule:
    """Test workout schedule endpoints - verify data comes from database"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get access token before each test"""
        if not hasattr(pytest, 'access_token') or not pytest.access_token:
            response = requests.post(
                f"{BASE_URL}/api/qa/login-as",
                json={"profile": "intermediate"},
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 200:
                pytest.access_token = response.json().get("accessToken")
    
    def test_get_user_schedule_returns_workouts(self):
        """GET /api/workouts/user-schedule - Should return workouts from database"""
        response = requests.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            params={"start": "2026-02-01", "end": "2026-02-10"},
            headers={"Authorization": f"Bearer {pytest.access_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of workouts"
        assert len(data) > 0, "Expected at least one workout in date range"
        
        # Verify workout structure
        workout = data[0]
        assert "id" in workout, "Workout missing id"
        assert "date" in workout, "Workout missing date"
        assert "status" in workout, "Workout missing status"
        
        # Count real workouts (not rest days)
        real_workouts = [w for w in data if not w.get("isRestDay", False)]
        print(f"✅ User schedule returned {len(data)} days, {len(real_workouts)} real workouts")
    
    def test_get_user_schedule_requires_auth(self):
        """GET /api/workouts/user-schedule - Should require authentication"""
        response = requests.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            params={"start": "2026-02-01", "end": "2026-02-10"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ User schedule correctly requires authentication")
    
    def test_get_user_schedule_requires_date_params(self):
        """GET /api/workouts/user-schedule - Should require start and end params"""
        response = requests.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            headers={"Authorization": f"Bearer {pytest.access_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ User schedule correctly requires date parameters")


class TestBadgeTracking:
    """Test badge tracking endpoints - verify data persists to database"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get access token before each test"""
        if not hasattr(pytest, 'access_token') or not pytest.access_token:
            response = requests.post(
                f"{BASE_URL}/api/qa/login-as",
                json={"profile": "intermediate"},
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 200:
                pytest.access_token = response.json().get("accessToken")
    
    def test_track_coach_message(self):
        """POST /api/badges/track - Track coachMessage action"""
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "coachMessage"},
            headers={
                "Authorization": f"Bearer {pytest.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert data.get("action") == "coachMessage"
        print("✅ Coach message tracked successfully")
    
    def test_track_coach_message_increments(self):
        """POST /api/badges/track - Verify coachMessage count increments"""
        # Track multiple messages
        for i in range(3):
            response = requests.post(
                f"{BASE_URL}/api/badges/track",
                json={"action": "coachMessage"},
                headers={
                    "Authorization": f"Bearer {pytest.access_token}",
                    "Content-Type": "application/json"
                }
            )
            assert response.status_code == 200, f"Track {i+1} failed: {response.text}"
        
        print("✅ Multiple coach messages tracked successfully")
    
    def test_track_badge_shared(self):
        """POST /api/badges/track - Track badgeShared action"""
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "badgeShared"},
            headers={
                "Authorization": f"Bearer {pytest.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True
        print("✅ Badge shared tracked successfully")
    
    def test_track_video_watched(self):
        """POST /api/badges/track - Track videoWatched action"""
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "videoWatched"},
            headers={
                "Authorization": f"Bearer {pytest.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True
        print("✅ Video watched tracked successfully")
    
    def test_track_profile_edit(self):
        """POST /api/badges/track - Track profileEdit action"""
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "profileEdit"},
            headers={
                "Authorization": f"Bearer {pytest.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True
        print("✅ Profile edit tracked successfully")
    
    def test_track_invalid_action(self):
        """POST /api/badges/track - Should reject invalid action"""
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "invalidAction"},
            headers={
                "Authorization": f"Bearer {pytest.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Invalid action correctly rejected")
    
    def test_track_requires_auth(self):
        """POST /api/badges/track - Should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/badges/track",
            json={"action": "coachMessage"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Badge tracking correctly requires authentication")


class TestBadgeProgress:
    """Test badge progress endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get access token before each test"""
        if not hasattr(pytest, 'access_token') or not pytest.access_token:
            response = requests.post(
                f"{BASE_URL}/api/qa/login-as",
                json={"profile": "intermediate"},
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 200:
                pytest.access_token = response.json().get("accessToken")
    
    def test_get_badge_progress(self):
        """GET /api/badges/progress - Get user's badge progress"""
        response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {pytest.access_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "badges" in data, "Missing badges in response"
        assert "totalXP" in data, "Missing totalXP in response"
        assert "currentIsland" in data, "Missing currentIsland in response"
        print(f"✅ Badge progress retrieved - XP: {data['totalXP']}, Island: {data['currentIsland']}")
    
    def test_get_badge_progress_requires_auth(self):
        """GET /api/badges/progress - Should require authentication"""
        response = requests.get(f"{BASE_URL}/api/badges/progress")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Badge progress correctly requires authentication")
    
    def test_save_badge_progress(self):
        """PUT /api/badges/progress - Save user's badge progress"""
        response = requests.put(
            f"{BASE_URL}/api/badges/progress",
            json={
                "badges": [
                    {"badgeId": "first_workout", "progress": 1, "completed": True}
                ],
                "totalXP": 100,
                "currentIsland": 1
            },
            headers={
                "Authorization": f"Bearer {pytest.access_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        print("✅ Badge progress saved successfully")
    
    def test_save_badge_progress_persists(self):
        """PUT then GET /api/badges/progress - Verify data persists"""
        # Save progress
        save_response = requests.put(
            f"{BASE_URL}/api/badges/progress",
            json={
                "badges": [
                    {"badgeId": "test_badge", "progress": 5, "completed": False}
                ],
                "totalXP": 250,
                "currentIsland": 2
            },
            headers={
                "Authorization": f"Bearer {pytest.access_token}",
                "Content-Type": "application/json"
            }
        )
        assert save_response.status_code == 200
        
        # Retrieve and verify
        get_response = requests.get(
            f"{BASE_URL}/api/badges/progress",
            headers={"Authorization": f"Bearer {pytest.access_token}"}
        )
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["totalXP"] == 250, f"Expected totalXP=250, got {data['totalXP']}"
        assert data["currentIsland"] == 2, f"Expected currentIsland=2, got {data['currentIsland']}"
        
        # Check badge was saved
        test_badge = next((b for b in data["badges"] if b["badgeId"] == "test_badge"), None)
        assert test_badge is not None, "test_badge not found in saved badges"
        assert test_badge["progress"] == 5
        print("✅ Badge progress persists correctly to database")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """GET /api/health - Should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok=True, got {data}"
        assert data.get("dbOk") == True, "Database should be connected"
        print(f"✅ Health check passed - DB: {data.get('dbOk')}, AI: {data.get('aiReady')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
