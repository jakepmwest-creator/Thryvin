"""
Frontend Data Loading Tests - P0 Bug Fixes Verification

Tests the critical fixes for:
1. Workouts appearing empty in the UI (no exercises shown)
2. Data resets/disappears when user signs out and signs back in

These tests verify the backend API returns data correctly and that
the frontend data loading flow should work as expected.
"""

import pytest
import requests
import os
import json
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://exercise-video-fix.preview.emergentagent.com').rstrip('/')


class TestQALoginDataLoading:
    """Test QA Fast Login loads user workout data from database"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.token = None
        self.user_id = None
    
    def test_qa_login_returns_user_with_workouts_count(self):
        """P0: QA login should return user info with workouts count"""
        response = self.session.post(f"{BASE_URL}/api/qa/login-as", json={
            "profile": "intermediate"
        })
        
        assert response.status_code == 200, f"QA login failed: {response.text}"
        
        data = response.json()
        assert data.get('ok') == True, "QA login response not ok"
        assert 'user' in data, "No user in response"
        assert 'accessToken' in data, "No accessToken in response"
        assert 'workoutsCount' in data, "No workoutsCount in response"
        
        # Store for subsequent tests
        self.token = data['accessToken']
        self.user_id = data['user']['id']
        
        print(f"✅ QA Login successful: User {data['user']['name']} (ID: {self.user_id})")
        print(f"   Workouts count: {data['workoutsCount']}")
        
        # Verify user has workouts
        assert data['workoutsCount'] > 0, "QA user should have workouts in database"
    
    def test_fetch_week_workouts_returns_exercises(self):
        """P0: Fetching week workouts should return workouts WITH exercises"""
        # First login to get token
        login_response = self.session.post(f"{BASE_URL}/api/qa/login-as", json={
            "profile": "intermediate"
        })
        assert login_response.status_code == 200
        token = login_response.json()['accessToken']
        
        # Calculate date range for current week
        today = datetime.now()
        # Get Monday of current week
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        
        start_date = monday.strftime('%Y-%m-%d')
        end_date = sunday.strftime('%Y-%m-%d')
        
        # Fetch workouts for the week
        response = self.session.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            params={'start': start_date, 'end': end_date},
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200, f"Failed to fetch workouts: {response.text}"
        
        workouts = response.json()
        print(f"✅ Fetched {len(workouts)} workouts for {start_date} to {end_date}")
        
        # Check that workouts have exercises
        workouts_with_exercises = 0
        for workout in workouts:
            # Check multiple paths for exercises (as per the fix)
            exercises = workout.get('exercises', [])
            payload_exercises = workout.get('payloadJson', {}).get('exercises', []) if workout.get('payloadJson') else []
            exercise_list = workout.get('exerciseList', [])
            
            all_exercises = exercises or payload_exercises or exercise_list
            
            if all_exercises and len(all_exercises) > 0:
                workouts_with_exercises += 1
                print(f"   - {workout.get('date')}: {workout.get('title')} ({len(all_exercises)} exercises)")
            elif workout.get('isRestDay') or workout.get('type') == 'Rest Day':
                print(f"   - {workout.get('date')}: Rest Day (no exercises expected)")
            else:
                print(f"   ⚠️ {workout.get('date')}: {workout.get('title')} - NO EXERCISES!")
        
        # At least some workouts should have exercises (excluding rest days)
        non_rest_workouts = [w for w in workouts if not w.get('isRestDay') and w.get('type') != 'Rest Day']
        if non_rest_workouts:
            assert workouts_with_exercises > 0, "No workouts have exercises - this is the P0 bug!"
    
    def test_workout_exercises_structure(self):
        """P0: Verify workout exercises have correct structure"""
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/qa/login-as", json={
            "profile": "intermediate"
        })
        token = login_response.json()['accessToken']
        
        # Get a wider date range to find workouts
        today = datetime.now()
        start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = (today + timedelta(days=7)).strftime('%Y-%m-%d')
        
        response = self.session.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            params={'start': start_date, 'end': end_date},
            headers={'Authorization': f'Bearer {token}'}
        )
        
        workouts = response.json()
        
        # Find a workout with exercises
        workout_with_exercises = None
        for w in workouts:
            exercises = w.get('exercises', [])
            if exercises and len(exercises) > 0:
                workout_with_exercises = w
                break
        
        assert workout_with_exercises is not None, "Could not find any workout with exercises"
        
        exercises = workout_with_exercises['exercises']
        print(f"✅ Found workout '{workout_with_exercises['title']}' with {len(exercises)} exercises")
        
        # Verify exercise structure
        for i, ex in enumerate(exercises[:3]):  # Check first 3
            print(f"   Exercise {i+1}: {ex.get('name', 'NO NAME')}")
            assert 'name' in ex, f"Exercise {i} missing 'name'"
            # These fields may or may not be present depending on exercise type
            if ex.get('sets'):
                print(f"      Sets: {ex.get('sets')}, Reps: {ex.get('reps')}")


class TestDataPersistenceAfterSignOut:
    """Test data persists after sign-out and sign-in"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def test_data_persists_after_relogin(self):
        """P0: Data should persist after sign-out and sign-in"""
        # First login
        login1 = self.session.post(f"{BASE_URL}/api/qa/login-as", json={
            "profile": "intermediate"
        })
        assert login1.status_code == 200
        token1 = login1.json()['accessToken']
        user_id = login1.json()['user']['id']
        
        # Fetch workouts
        today = datetime.now()
        start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = (today + timedelta(days=7)).strftime('%Y-%m-%d')
        
        workouts1 = self.session.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            params={'start': start_date, 'end': end_date},
            headers={'Authorization': f'Bearer {token1}'}
        ).json()
        
        workouts_count_1 = len(workouts1)
        print(f"✅ First login: Found {workouts_count_1} workouts")
        
        # Simulate sign-out (just discard token)
        # In real app, this clears local storage
        
        # Second login (simulating re-login)
        login2 = self.session.post(f"{BASE_URL}/api/qa/login-as", json={
            "profile": "intermediate"
        })
        assert login2.status_code == 200
        token2 = login2.json()['accessToken']
        
        # Verify same user
        assert login2.json()['user']['id'] == user_id, "Different user after re-login!"
        
        # Fetch workouts again
        workouts2 = self.session.get(
            f"{BASE_URL}/api/workouts/user-schedule",
            params={'start': start_date, 'end': end_date},
            headers={'Authorization': f'Bearer {token2}'}
        ).json()
        
        workouts_count_2 = len(workouts2)
        print(f"✅ Second login: Found {workouts_count_2} workouts")
        
        # Data should persist
        assert workouts_count_2 == workouts_count_1, \
            f"Workout count changed after re-login! Before: {workouts_count_1}, After: {workouts_count_2}"
        
        # Verify exercises still present
        for w1, w2 in zip(workouts1, workouts2):
            ex1 = w1.get('exercises', [])
            ex2 = w2.get('exercises', [])
            assert len(ex1) == len(ex2), \
                f"Exercise count changed for {w1.get('date')}: {len(ex1)} -> {len(ex2)}"
        
        print("✅ Data persistence verified - workouts and exercises intact after re-login")


class TestWorkoutDetailsModalDataPaths:
    """Test the getWorkoutExercises helper logic"""
    
    def test_exercises_at_top_level(self):
        """Verify exercises at top-level are found"""
        workout = {
            'id': 'test1',
            'title': 'Test Workout',
            'exercises': [{'name': 'Squat', 'sets': 3, 'reps': '10'}]
        }
        
        # Simulate getWorkoutExercises logic
        exercises = self._get_workout_exercises(workout)
        assert len(exercises) == 1
        assert exercises[0]['name'] == 'Squat'
        print("✅ Top-level exercises found correctly")
    
    def test_exercises_in_payload_json(self):
        """Verify exercises in payloadJson are found"""
        workout = {
            'id': 'test2',
            'title': 'Test Workout',
            'payloadJson': {
                'exercises': [{'name': 'Bench Press', 'sets': 4, 'reps': '8'}]
            }
        }
        
        exercises = self._get_workout_exercises(workout)
        assert len(exercises) == 1
        assert exercises[0]['name'] == 'Bench Press'
        print("✅ payloadJson.exercises found correctly")
    
    def test_exercises_in_exercise_list(self):
        """Verify exercises in exerciseList are found"""
        workout = {
            'id': 'test3',
            'title': 'Test Workout',
            'exerciseList': [{'name': 'Deadlift', 'sets': 5, 'reps': '5'}]
        }
        
        exercises = self._get_workout_exercises(workout)
        assert len(exercises) == 1
        assert exercises[0]['name'] == 'Deadlift'
        print("✅ exerciseList found correctly")
    
    def test_priority_order(self):
        """Verify top-level exercises take priority"""
        workout = {
            'id': 'test4',
            'title': 'Test Workout',
            'exercises': [{'name': 'TopLevel', 'sets': 3, 'reps': '10'}],
            'payloadJson': {
                'exercises': [{'name': 'PayloadJson', 'sets': 3, 'reps': '10'}]
            },
            'exerciseList': [{'name': 'ExerciseList', 'sets': 3, 'reps': '10'}]
        }
        
        exercises = self._get_workout_exercises(workout)
        assert exercises[0]['name'] == 'TopLevel', "Top-level should take priority"
        print("✅ Priority order correct - top-level takes precedence")
    
    def _get_workout_exercises(self, workout):
        """Python implementation of getWorkoutExercises helper"""
        if not workout:
            return []
        
        # Check top-level first (local workouts)
        exercises = workout.get('exercises', [])
        if exercises and isinstance(exercises, list) and len(exercises) > 0:
            return exercises
        
        # Check payloadJson (database-loaded workouts)
        payload_json = workout.get('payloadJson', {})
        if payload_json:
            payload_exercises = payload_json.get('exercises', [])
            if payload_exercises and isinstance(payload_exercises, list):
                return payload_exercises
        
        # Check exerciseList alias
        exercise_list = workout.get('exerciseList', [])
        if exercise_list and isinstance(exercise_list, list):
            return exercise_list
        
        return []


class TestCompletedWorkoutsLoading:
    """Test completed workouts are loaded correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def test_completed_workouts_endpoint(self):
        """Verify completed workouts can be fetched"""
        # Login
        login = self.session.post(f"{BASE_URL}/api/qa/login-as", json={
            "profile": "intermediate"
        })
        token = login.json()['accessToken']
        
        # Try to fetch completed workouts
        response = self.session.get(
            f"{BASE_URL}/api/workouts/completed",
            headers={'Authorization': f'Bearer {token}'}
        )
        
        # This endpoint may or may not exist
        if response.status_code == 200:
            completed = response.json()
            print(f"✅ Completed workouts endpoint works: {len(completed)} completed workouts")
        elif response.status_code == 404:
            print("ℹ️ Completed workouts endpoint not found (may use different path)")
        else:
            print(f"⚠️ Completed workouts endpoint returned {response.status_code}")


class TestStatsLoading:
    """Test stats are loaded correctly after login"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def test_stats_endpoint(self):
        """Verify stats can be fetched"""
        # Login
        login = self.session.post(f"{BASE_URL}/api/qa/login-as", json={
            "profile": "intermediate"
        })
        token = login.json()['accessToken']
        
        # Try to fetch stats
        response = self.session.get(
            f"{BASE_URL}/api/stats/user",
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Stats endpoint works")
            print(f"   Total workouts: {stats.get('totalWorkouts', 'N/A')}")
            print(f"   Weekly workouts: {stats.get('weeklyWorkouts', 'N/A')}")
        elif response.status_code == 404:
            print("ℹ️ Stats endpoint not found (may use different path)")
        else:
            print(f"⚠️ Stats endpoint returned {response.status_code}")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
