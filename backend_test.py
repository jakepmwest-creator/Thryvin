#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App - Onboarding Data Fix
Tests the specific scenarios mentioned in the review request:
1. Test User Registration with Full Onboarding Data
2. Test Fetch User to Verify Persistence  
3. Test Workout Generation with "It Depends" Schedule
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use the correct backend URL from native app config
BASE_URL = "https://ai-trainer-21.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

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
        self.user_profile = None
        self.registered_user = None
        
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
    
    def test_user_registration_with_onboarding_data(self) -> bool:
        """Test 1: User Registration with Full Onboarding Data"""
        try:
            # Use timestamp to ensure unique email
            timestamp = int(time.time())
            unique_email = f"testuser_backend_{timestamp}@test.com"
            
            # Registration data as specified in review request
            registration_data = {
                "name": "Test User UK",
                "email": unique_email,
                "password": "test123",
                "trainingType": "strength",
                "goal": "gain_muscle",
                "coachingStyle": "balanced",
                "trainingSchedule": "depends",
                "specificDates": ["2025-12-16", "2025-12-18", "2025-12-19"],
                "country": "UK",
                "timezone": "Europe/London",
                "fitnessGoals": ["gain_muscle"],
                "equipment": ["barbell", "dumbbell"]
            }
            
            response = self.session.post(f"{API_BASE}/register", json=registration_data)
            
            if response.status_code in [200, 201]:
                user_data = response.json()
                
                # Check for expected response structure
                if 'user' in user_data and user_data.get('ok'):
                    user = user_data['user']
                    self.registered_user = user
                    self.user_id = user.get('id')
                    
                    # VERIFY the response contains user.onboardingResponses with required fields
                    onboarding_responses = user.get('onboardingResponses')
                    if not onboarding_responses:
                        self.log_test("User Registration with Onboarding Data", False, 
                                    "Missing onboardingResponses field", user)
                        return False
                    
                    # Parse onboardingResponses if it's a string
                    if isinstance(onboarding_responses, str):
                        try:
                            onboarding_responses = json.loads(onboarding_responses)
                        except:
                            self.log_test("User Registration with Onboarding Data", False, 
                                        "Could not parse onboardingResponses JSON", user)
                            return False
                    
                    # Verify required fields in onboardingResponses
                    required_fields = {
                        'trainingSchedule': 'depends',
                        'specificDates': ["2025-12-16", "2025-12-18", "2025-12-19"],
                        'country': 'UK',
                        'timezone': 'Europe/London'
                    }
                    
                    missing_or_incorrect = []
                    for field, expected_value in required_fields.items():
                        actual_value = onboarding_responses.get(field)
                        
                        if field == 'specificDates':
                            # Check if arrays match
                            if not isinstance(actual_value, list) or set(actual_value) != set(expected_value):
                                missing_or_incorrect.append(f"{field}: expected {expected_value}, got {actual_value}")
                        else:
                            if actual_value != expected_value:
                                missing_or_incorrect.append(f"{field}: expected {expected_value}, got {actual_value}")
                    
                    if missing_or_incorrect:
                        self.log_test("User Registration with Onboarding Data", False, 
                                    f"onboardingResponses missing or incorrect fields: {missing_or_incorrect}", 
                                    {"onboardingResponses": onboarding_responses})
                        return False
                    else:
                        self.log_test("User Registration with Onboarding Data", True, 
                                    f"Successfully registered user with complete onboarding data: {unique_email}")
                        return True
                else:
                    self.log_test("User Registration with Onboarding Data", False, 
                                "Registration response missing user object or ok flag", user_data)
                    return False
            else:
                self.log_test("User Registration with Onboarding Data", False, 
                            f"Registration failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("User Registration with Onboarding Data", False, f"Registration error: {str(e)}")
            return False
    
    def test_fetch_user_to_verify_persistence(self) -> bool:
        """Test 2: Fetch User to Verify Persistence"""
        try:
            if not self.registered_user or not self.user_id:
                self.log_test("Fetch User to Verify Persistence", False, 
                            "No registered user available from previous test")
                return False
            
            # GET /api/users/{id} with the ID from Test 1
            response = self.session.get(f"{API_BASE}/users/{self.user_id}")
            
            if response.status_code == 200:
                user_data = response.json()
                
                # VERIFY onboardingResponses is still present and correct
                onboarding_responses = user_data.get('onboardingResponses')
                if not onboarding_responses:
                    self.log_test("Fetch User to Verify Persistence", False, 
                                "Missing onboardingResponses field in fetched user", user_data)
                    return False
                
                # Parse onboardingResponses if it's a string
                if isinstance(onboarding_responses, str):
                    try:
                        onboarding_responses = json.loads(onboarding_responses)
                    except:
                        self.log_test("Fetch User to Verify Persistence", False, 
                                    "Could not parse onboardingResponses JSON in fetched user", user_data)
                        return False
                
                # Verify the same required fields are still there
                required_fields = {
                    'trainingSchedule': 'depends',
                    'specificDates': ["2025-12-16", "2025-12-18", "2025-12-19"],
                    'country': 'UK',
                    'timezone': 'Europe/London'
                }
                
                missing_or_incorrect = []
                for field, expected_value in required_fields.items():
                    actual_value = onboarding_responses.get(field)
                    
                    if field == 'specificDates':
                        # Check if arrays match
                        if not isinstance(actual_value, list) or set(actual_value) != set(expected_value):
                            missing_or_incorrect.append(f"{field}: expected {expected_value}, got {actual_value}")
                    else:
                        if actual_value != expected_value:
                            missing_or_incorrect.append(f"{field}: expected {expected_value}, got {actual_value}")
                
                if missing_or_incorrect:
                    self.log_test("Fetch User to Verify Persistence", False, 
                                f"Fetched user onboardingResponses missing or incorrect fields: {missing_or_incorrect}", 
                                {"onboardingResponses": onboarding_responses})
                    return False
                else:
                    self.log_test("Fetch User to Verify Persistence", True, 
                                f"Successfully fetched user {self.user_id} with persistent onboarding data")
                    return True
            else:
                self.log_test("Fetch User to Verify Persistence", False, 
                            f"Failed to fetch user with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Fetch User to Verify Persistence", False, f"Fetch user error: {str(e)}")
            return False
    
    def test_workout_generation_with_depends_schedule(self) -> bool:
        """Test 3: Workout Generation with "It Depends" Schedule"""
        try:
            if not self.registered_user:
                self.log_test("Workout Generation with It Depends Schedule", False, 
                            "No registered user available from previous test")
                return False
            
            # POST /api/workouts/generate with the newly registered user profile
            workout_data = {
                "userProfile": {
                    "fitnessGoals": ["gain_muscle"],
                    "goal": "gain_muscle",
                    "experience": "intermediate",
                    "sessionDuration": 60,
                    "trainingDays": 5,
                    "equipment": ["barbell", "dumbbell"],
                    "injuries": [],
                    # Include the onboarding data with "depends" schedule
                    "trainingSchedule": "depends",
                    "specificDates": ["2025-12-16", "2025-12-18", "2025-12-19"],
                    "country": "UK",
                    "timezone": "Europe/London"
                },
                "dayOfWeek": 0
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # VERIFY the AI generates a workout correctly
                required_fields = ['title', 'exercises']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Workout Generation with It Depends Schedule", False, 
                                f"Response missing required fields: {missing_fields}",
                                {"response_keys": list(data.keys())})
                    return False
                
                # Verify exercises is an array with proper structure
                exercises = data.get('exercises', [])
                if not isinstance(exercises, list):
                    self.log_test("Workout Generation with It Depends Schedule", False, 
                                "Exercises should be an array",
                                {"exercises_type": type(exercises)})
                    return False
                
                if len(exercises) == 0:
                    self.log_test("Workout Generation with It Depends Schedule", False, 
                                "No exercises generated in workout")
                    return False
                
                # Check each exercise has required fields: name, sets, reps
                for i, exercise in enumerate(exercises):
                    required_exercise_fields = ['name', 'sets', 'reps']
                    missing_exercise_fields = [field for field in required_exercise_fields if field not in exercise]
                    
                    if missing_exercise_fields:
                        self.log_test("Workout Generation with It Depends Schedule", False, 
                                    f"Exercise {i+1} missing fields: {missing_exercise_fields}",
                                    {"exercise": exercise})
                        return False
                
                self.log_test("Workout Generation with It Depends Schedule", True, 
                            f"AI generated workout '{data.get('title')}' with {len(exercises)} exercises for 'depends' schedule user")
                return True
            else:
                self.log_test("Workout Generation with It Depends Schedule", False, 
                            f"Workout generation failed with status {response.status_code}",
                            {"response": response.text})
                return False
            
        except Exception as e:
            self.log_test("Workout Generation with It Depends Schedule", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Thryvin API tests for onboarding data fix verification"""
        print("🏋️ Starting Thryvin Fitness App - Onboarding Data Fix Testing")
        print("Testing scenarios from review request:")
        print("1. Test User Registration with Full Onboarding Data")
        print("2. Test Fetch User to Verify Persistence")
        print("3. Test Workout Generation with 'It Depends' Schedule")
        print("=" * 60)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 1: User Registration with Full Onboarding Data
        print("\n👤 Test 1: User Registration with Full Onboarding Data...")
        registration_success = self.test_user_registration_with_onboarding_data()
        
        # Test 2: Fetch User to Verify Persistence
        print("\n🔍 Test 2: Fetch User to Verify Persistence...")
        fetch_success = self.test_fetch_user_to_verify_persistence()
        
        # Test 3: Workout Generation with "It Depends" Schedule
        print("\n🤖 Test 3: Workout Generation with 'It Depends' Schedule...")
        workout_success = self.test_workout_generation_with_depends_schedule()
        
        print("\n" + "=" * 60)
        print("🏁 Thryvin Onboarding Data Fix Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All onboarding data fix tests passed!")
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