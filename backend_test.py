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

# Configuration - Use localhost as specified in review request
BASE_URL = "http://localhost:8001"
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
        
    def test_health_endpoint(self) -> bool:
        """Test Health Endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/health")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') is True:
                    self.log_test("Health Endpoint", True, "Health endpoint returned ok: true")
                    return True
                else:
                    self.log_test("Health Endpoint", False, f"Health endpoint returned ok: {data.get('ok')}", data)
                    return False
            else:
                self.log_test("Health Endpoint", False, f"Health endpoint failed with status {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Health Endpoint", False, f"Health endpoint error: {str(e)}")
            return False
        
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
            unique_email = f"testuser_{timestamp}@test.com"
            
            # Registration data as specified in review request
            registration_data = {
                "name": "Test User",
                "email": unique_email,
                "password": "Test123!",
                "trainingSchedule": "depends",
                "specificDates": ["2025-12-16", "2025-12-18", "2025-12-20"],
                "country": "US",
                "timezone": "America/New_York"
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=registration_data)
            
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
                        'specificDates': ["2025-12-16", "2025-12-18", "2025-12-20"],
                        'country': 'US',
                        'timezone': 'America/New_York'
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
                    'specificDates': ["2025-12-16", "2025-12-18", "2025-12-20"],
                    'country': 'US',
                    'timezone': 'America/New_York'
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
    
    def test_workout_generation_multiple_days(self) -> bool:
        """Test Workout Generation for Multiple Days (0-6)"""
        try:
            if not self.registered_user:
                self.log_test("Workout Generation Multiple Days", False, 
                            "No registered user available from previous test")
                return False
            
            # Test workout generation for days 0-6 (full week)
            all_days_success = True
            generated_workouts = []
            
            for day in range(7):
                workout_data = {
                    "userProfile": {
                        "fitnessGoals": ["gain_muscle"],
                        "goal": "gain_muscle",
                        "experience": "intermediate",
                        "sessionDuration": 60,
                        "trainingDays": 5,
                        "equipment": ["barbell", "dumbbell"],
                        "injuries": [],
                        "trainingSchedule": "depends",
                        "specificDates": ["2025-12-16", "2025-12-18", "2025-12-20"],
                        "country": "US",
                        "timezone": "America/New_York"
                    },
                    "dayOfWeek": day
                }
                
                response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verify workout structure
                    required_fields = ['title', 'exercises', 'duration', 'type']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("Workout Generation Multiple Days", False, 
                                    f"Day {day} missing fields: {missing_fields}")
                        all_days_success = False
                        continue
                    
                    # Verify exercises array
                    exercises = data.get('exercises', [])
                    if not isinstance(exercises, list) or len(exercises) < 8 or len(exercises) > 15:
                        self.log_test("Workout Generation Multiple Days", False, 
                                    f"Day {day} has {len(exercises)} exercises, expected 8-15")
                        all_days_success = False
                        continue
                    
                    generated_workouts.append({
                        'day': day,
                        'title': data.get('title'),
                        'exercise_count': len(exercises),
                        'duration': data.get('duration'),
                        'type': data.get('type')
                    })
                else:
                    self.log_test("Workout Generation Multiple Days", False, 
                                f"Day {day} generation failed with status {response.status_code}")
                    all_days_success = False
            
            if all_days_success:
                self.log_test("Workout Generation Multiple Days", True, 
                            f"Successfully generated workouts for all 7 days with 8-15 exercises each")
                return True
            else:
                return False
                
        except Exception as e:
            self.log_test("Workout Generation Multiple Days", False, f"Error: {str(e)}")
            return False
    
    def test_workout_generation_with_advanced_questionnaire(self) -> bool:
        """Test Workout Generation with Advanced Questionnaire"""
        try:
            if not self.registered_user:
                self.log_test("Workout Generation with Advanced Questionnaire", False, 
                            "No registered user available from previous test")
                return False
            
            # Test with advanced questionnaire data
            workout_data = {
                "userProfile": {
                    "fitnessGoals": ["gain_muscle"],
                    "goal": "gain_muscle",
                    "experience": "intermediate",
                    "sessionDuration": 60,
                    "trainingDays": 5,
                    "equipment": ["barbell", "dumbbell"],
                    "injuries": [],
                    "advancedQuestionnaire": {
                        "todayFocus": "Make today a back day",
                        "enjoyedTraining": "weightlifting",
                        "dislikedTraining": "running"
                    }
                },
                "dayOfWeek": 1
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify workout structure
                required_fields = ['title', 'exercises', 'duration', 'type']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Workout Generation with Advanced Questionnaire", False, 
                                f"Response missing required fields: {missing_fields}")
                    return False
                
                # Verify exercises array
                exercises = data.get('exercises', [])
                if not isinstance(exercises, list) or len(exercises) < 8 or len(exercises) > 15:
                    self.log_test("Workout Generation with Advanced Questionnaire", False, 
                                f"Generated {len(exercises)} exercises, expected 8-15")
                    return False
                
                # Check if AI respected the focus request (look for back-related exercises)
                title = data.get('title', '').lower()
                back_focused = 'back' in title or any('back' in ex.get('name', '').lower() or 
                                                    'pull' in ex.get('name', '').lower() or
                                                    'row' in ex.get('name', '').lower()
                                                    for ex in exercises)
                
                self.log_test("Workout Generation with Advanced Questionnaire", True, 
                            f"AI generated workout '{data.get('title')}' with {len(exercises)} exercises, back focus: {back_focused}")
                return True
            else:
                self.log_test("Workout Generation with Advanced Questionnaire", False, 
                            f"Generation failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Workout Generation with Advanced Questionnaire", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Thryvin API tests as specified in review request"""
        print("🏋️ Starting Thryvin Fitness App Backend Testing")
        print("Testing scenarios from review request:")
        print("1. Test Health Endpoint")
        print("2. Test User Registration with Full Onboarding Data")
        print("3. Test Workout Generation for Multiple Days (0-6)")
        print("4. Test Workout Generation with Advanced Questionnaire")
        print("=" * 60)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 1: Health Endpoint
        print("\n💚 Test 1: Health Endpoint...")
        health_success = self.test_health_endpoint()
        
        # Test 2: User Registration with Full Onboarding Data
        print("\n👤 Test 2: User Registration with Full Onboarding Data...")
        registration_success = self.test_user_registration_with_onboarding_data()
        
        # Test 3: Workout Generation for Multiple Days
        print("\n📅 Test 3: Workout Generation for Multiple Days (0-6)...")
        multiple_days_success = self.test_workout_generation_multiple_days()
        
        # Test 4: Workout Generation with Advanced Questionnaire
        print("\n🧠 Test 4: Workout Generation with Advanced Questionnaire...")
        advanced_success = self.test_workout_generation_with_advanced_questionnaire()
        
        print("\n" + "=" * 60)
        print("🏁 Thryvin Backend Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All backend tests passed!")
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