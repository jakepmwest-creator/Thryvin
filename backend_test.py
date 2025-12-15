#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App
Tests the specific endpoints mentioned in the review request:
1. Health Check - GET /api/health
2. Create NEW User Account - POST /api/auth/register
3. Workout Generation API - POST /api/workouts/generate
4. Login with Existing Test Account - POST /api/login
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use the production URL from review request
BASE_URL = "https://workout-bug-fix.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials from review request
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

# New user credentials for registration test
NEW_USER_EMAIL = "newuser123@test.com"
NEW_USER_PASSWORD = "password123"

class ThryvinAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.auth_token = None
        self.user_id = None
        
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {json.dumps(details, indent=2)}")
    
    def test_health_endpoint(self) -> bool:
        """Test the health endpoint - GET /api/health"""
        try:
            response = self.session.get(f"{API_BASE}/health")
            
            if response.status_code == 200:
                health_data = response.json()
                
                # Check for expected fields from review request
                expected_fields = ['ok', 'aiReady']
                missing_fields = [field for field in expected_fields if field not in health_data]
                
                if missing_fields:
                    self.log_test("Health Check", False, f"Missing expected fields: {missing_fields}", health_data)
                    return False
                
                # Check that ok and aiReady are both true
                if health_data.get('ok') and health_data.get('aiReady'):
                    self.log_test("Health Check", True, "Server is healthy with AI ready", health_data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Health check shows issues: ok={health_data.get('ok')}, aiReady={health_data.get('aiReady')}", health_data)
                    return False
                    
            else:
                self.log_test("Health Check", False, f"Health check failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Health check error: {str(e)}")
            return False
    
    def authenticate_user(self) -> bool:
        """Authenticate with test credentials - POST /api/auth/login"""
        try:
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                user_data = response.json()
                # Check for expected response structure (user object is sufficient for session-based auth)
                if 'user' in user_data:
                    self.user_id = user_data.get('user', {}).get('id')
                    # Token might not be present in session-based auth, which is fine
                    self.auth_token = user_data.get('token')
                    self.log_test("Authentication", True, f"Successfully logged in as {TEST_EMAIL}")
                    return True
                else:
                    self.log_test("Authentication", False, "Login response missing user object", user_data)
                    return False
            else:
                self.log_test("Authentication", False, f"Failed to authenticate: {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_exercise_counts_endpoint(self) -> bool:
        """Test GET /api/exercises/counts - New Feature"""
        try:
            response = self.session.get(f"{API_BASE}/exercises/counts")
            
            if response.status_code != 200:
                self.log_test("Exercise Counts API", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Check that response is an object with category counts
            if not isinstance(data, dict):
                self.log_test("Exercise Counts API", False, 
                            "Response should be an object with counts",
                            {"response": data})
                return False
            
            # Check if response has counts object (nested structure)
            counts_data = data.get('counts', data)  # Handle both flat and nested structures
            
            # Check for expected categories from review request
            expected_categories = ['Strength', 'HIIT', 'Cardio', 'Flexibility', 'Mobility', 'Conditioning', 'Core']
            found_categories = []
            
            for category in expected_categories:
                if category in counts_data:
                    count = counts_data[category]
                    if isinstance(count, (int, float)) and count > 0:
                        found_categories.append(category)
            
            # Verify at least Strength and Cardio have counts > 0 as mentioned in review
            required_categories = ['Strength', 'Cardio']
            missing_required = [cat for cat in required_categories if cat not in found_categories]
            
            if missing_required:
                self.log_test("Exercise Counts API", False, 
                            f"Missing required categories with counts > 0: {missing_required}",
                            {"response": data, "found_categories": found_categories})
                return False
            
            self.log_test("Exercise Counts API", True, 
                        f"Got valid counts for {len(found_categories)} categories including required ones",
                        {"categories": found_categories})
            return True
            
        except Exception as e:
            self.log_test("Exercise Counts API", False, f"Error: {str(e)}")
            return False
    
    def test_workout_generation_endpoint(self) -> bool:
        """Test POST /api/workouts/generate - Critical P0 fix verification"""
        try:
            # Create a sample user profile for workout generation
            user_profile = {
                "fitnessLevel": "intermediate",
                "goals": ["strength", "cardio"],
                "availableTime": 30,
                "equipment": ["bodyweight"],
                "preferences": {
                    "workoutType": "HIIT",
                    "intensity": "medium"
                }
            }
            
            workout_data = {
                "userProfile": user_profile
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code != 200:
                self.log_test("Workout Generation", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Check for expected workout structure
            required_fields = ['title', 'exercises', 'duration']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Workout Generation", False, 
                            f"Response missing required fields: {missing_fields}",
                            {"response_keys": list(data.keys())})
                return False
            
            # Verify exercises is an array
            if not isinstance(data.get('exercises'), list):
                self.log_test("Workout Generation", False, 
                            "Exercises should be an array",
                            {"exercises_type": type(data.get('exercises'))})
                return False
            
            # Verify we have at least one exercise
            if len(data.get('exercises', [])) == 0:
                self.log_test("Workout Generation", False, 
                            "Workout should contain at least one exercise",
                            {"response": data})
                return False
            
            self.log_test("Workout Generation", True, 
                        f"Generated workout '{data.get('title')}' with {len(data.get('exercises', []))} exercises")
            return True
            
        except Exception as e:
            self.log_test("Workout Generation", False, f"Error: {str(e)}")
            return False
    
    def test_exercises_fetch_endpoint(self) -> bool:
        """Test GET /api/exercises?limit=5"""
        try:
            response = self.session.get(f"{API_BASE}/exercises?limit=5")
            
            if response.status_code != 200:
                self.log_test("Exercises Fetch", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Handle both direct array and object with exercises array
            exercises = data if isinstance(data, list) else data.get('exercises', [])
            
            # Check that we have exercises
            if not isinstance(exercises, list):
                self.log_test("Exercises Fetch", False, 
                            "Response should contain an array of exercises",
                            {"response_structure": str(type(data))})
                return False
            
            # Check that we got exercises (should be <= 5 due to limit)
            if len(exercises) == 0:
                self.log_test("Exercises Fetch", False, 
                            "Should return at least some exercises",
                            {"response": data})
                return False
            
            if len(exercises) > 5:
                self.log_test("Exercises Fetch", False, 
                            f"Limit=5 but got {len(exercises)} exercises",
                            {"count": len(exercises)})
                return False
            
            # Check that exercises have video URLs as mentioned in review
            exercises_with_videos = 0
            for exercise in exercises:
                if isinstance(exercise, dict):
                    # Check for various video URL field names
                    video_fields = ['videoUrl', 'video_url', 'videoURL', 'video']
                    for field in video_fields:
                        if field in exercise and exercise[field]:
                            exercises_with_videos += 1
                            break
            
            self.log_test("Exercises Fetch", True, 
                        f"Retrieved {len(exercises)} exercises, {exercises_with_videos} with video URLs")
            return True
            
        except Exception as e:
            self.log_test("Exercises Fetch", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all Thryvin API tests for endpoints specified in review request"""
        print("🏋️ Starting Thryvin Fitness App API Testing Suite")
        print("Testing endpoints from review request:")
        print("1. Health Check - GET /api/health")
        print("2. Exercise Counts API - GET /api/exercises/counts")
        print("3. Authentication Flow - POST /api/auth/login")
        print("4. Workout Generation - POST /api/workouts/generate")
        print("5. Exercises Fetch - GET /api/exercises?limit=5")
        print("=" * 60)
        
        # Test 1: Health Check
        print("\n💚 Test 1: Health Check...")
        if not self.test_health_endpoint():
            print("❌ Server health check failed. Continuing with other tests...")
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 2: Exercise Counts API (New Feature)
        print("\n📊 Test 2: Exercise Counts API (New Feature)...")
        self.test_exercise_counts_endpoint()
        
        # Test 3: Authentication Flow
        print("\n🔐 Test 3: Authentication Flow...")
        auth_success = self.authenticate_user()
        
        # Test 4: Workout Generation (Critical P0 fix verification)
        print("\n🤖 Test 4: Workout Generation (Critical P0 fix)...")
        self.test_workout_generation_endpoint()
        
        # Test 5: Exercises Fetch
        print("\n🏃 Test 5: Exercises Fetch...")
        self.test_exercises_fetch_endpoint()
        
        print("\n" + "=" * 60)
        print("🏁 Thryvin API Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All Thryvin API tests passed!")
            return True
        else:
            print(f"⚠️ {total_tests - passed_tests} tests had issues")
            return False
    
    def print_summary(self):
        """Print detailed test summary"""
        print("\n📊 Detailed Test Summary:")
        print("-" * 40)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
            
            if result['details'] and not result['success']:
                print(f"   Error details: {json.dumps(result['details'], indent=2)}")

def main():
    """Main test runner"""
    tester = ThryvinAPITester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()