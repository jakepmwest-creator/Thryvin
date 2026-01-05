#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin AI Fitness App - Workout Validation & Coach Action Tests
Tests the CRITICAL workout validation and coach action fixes:
1. Plan Ensure Validation (POST /api/workouts/plan/ensure)
2. Coach Action Mismatch Blocking (POST /api/coach/actions/execute) - CRITICAL
3. Valid Coach Action (POST /api/coach/actions/execute)
4. Back Workout Mismatch Test (POST /api/coach/actions/execute)
5. Explicit Cardio Request (POST /api/coach/actions/execute)

Focus: Workout validation and coach action mismatch blocking
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use external backend URL as specified in review request
BASE_URL = "https://testauth.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class ThryvinWorkoutValidationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.access_tokens = {}  # Store tokens for each profile
        
    def test_qa_login_beginner(self) -> bool:
        """Test QA Login - Beginner Profile"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "beginner"})
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Login Beginner", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                if 'user' not in data or 'accessToken' not in data:
                    self.log_test("QA Login Beginner", False, "Missing user or accessToken in response", data)
                    return False
                
                user = data['user']
                
                # Verify user has selectedCoach="kai"
                if user.get('selectedCoach') != 'kai':
                    self.log_test("QA Login Beginner", False, f"Expected selectedCoach='kai', got '{user.get('selectedCoach')}'", data)
                    return False
                
                # Verify user has fitnessLevel="beginner"
                if user.get('fitnessLevel') != 'beginner':
                    self.log_test("QA Login Beginner", False, f"Expected fitnessLevel='beginner', got '{user.get('fitnessLevel')}'", data)
                    return False
                
                # Verify user has trainingDaysPerWeek=3
                if user.get('trainingDaysPerWeek') != 3:
                    self.log_test("QA Login Beginner", False, f"Expected trainingDaysPerWeek=3, got {user.get('trainingDaysPerWeek')}", data)
                    return False
                
                # Store access token for later use
                self.access_tokens['beginner'] = data['accessToken']
                
                self.log_test("QA Login Beginner", True, "Successfully logged in as beginner with correct profile data")
                return True
            else:
                self.log_test("QA Login Beginner", False, f"Login failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("QA Login Beginner", False, f"Login error: {str(e)}")
            return False
    
    def test_qa_login_intermediate(self) -> bool:
        """Test QA Login - Intermediate Profile"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "intermediate"})
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Login Intermediate", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                if 'user' not in data or 'accessToken' not in data:
                    self.log_test("QA Login Intermediate", False, "Missing user or accessToken in response", data)
                    return False
                
                user = data['user']
                
                # Verify user has selectedCoach="titan"
                if user.get('selectedCoach') != 'titan':
                    self.log_test("QA Login Intermediate", False, f"Expected selectedCoach='titan', got '{user.get('selectedCoach')}'", data)
                    return False
                
                # Verify user has fitnessLevel="intermediate"
                if user.get('fitnessLevel') != 'intermediate':
                    self.log_test("QA Login Intermediate", False, f"Expected fitnessLevel='intermediate', got '{user.get('fitnessLevel')}'", data)
                    return False
                
                # Verify user has trainingDaysPerWeek=4
                if user.get('trainingDaysPerWeek') != 4:
                    self.log_test("QA Login Intermediate", False, f"Expected trainingDaysPerWeek=4, got {user.get('trainingDaysPerWeek')}", data)
                    return False
                
                # Verify user has sessionDurationPreference=60
                if user.get('sessionDurationPreference') != 60:
                    self.log_test("QA Login Intermediate", False, f"Expected sessionDurationPreference=60, got {user.get('sessionDurationPreference')}", data)
                    return False
                
                # Store access token for later use
                self.access_tokens['intermediate'] = data['accessToken']
                
                self.log_test("QA Login Intermediate", True, "Successfully logged in as intermediate with correct profile data")
                return True
            else:
                self.log_test("QA Login Intermediate", False, f"Login failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("QA Login Intermediate", False, f"Login error: {str(e)}")
            return False
    
    def test_qa_login_injury(self) -> bool:
        """Test QA Login - Injury Profile"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "injury"})
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Login Injury", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                if 'user' not in data or 'accessToken' not in data:
                    self.log_test("QA Login Injury", False, "Missing user or accessToken in response", data)
                    return False
                
                user = data['user']
                
                # Verify user has selectedCoach="lumi"
                if user.get('selectedCoach') != 'lumi':
                    self.log_test("QA Login Injury", False, f"Expected selectedCoach='lumi', got '{user.get('selectedCoach')}'", data)
                    return False
                
                # Verify user has injuries including "lower_back" and "knee"
                injuries_str = user.get('injuries', '[]')
                try:
                    injuries = json.loads(injuries_str) if isinstance(injuries_str, str) else injuries_str
                    if not isinstance(injuries, list):
                        injuries = []
                except:
                    injuries = []
                
                if 'lower_back' not in injuries or 'knee' not in injuries:
                    self.log_test("QA Login Injury", False, f"Expected injuries to include 'lower_back' and 'knee', got {injuries}", data)
                    return False
                
                # Store access token for later use
                self.access_tokens['injury'] = data['accessToken']
                
                self.log_test("QA Login Injury", True, "Successfully logged in as injury profile with correct data")
                return True
            else:
                self.log_test("QA Login Injury", False, f"Login failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("QA Login Injury", False, f"Login error: {str(e)}")
            return False
    
    def test_qa_reset_user(self) -> bool:
        """Test QA Reset User"""
        try:
            response = self.session.post(f"{API_BASE}/qa/reset-user", json={"email": "qa_beginner@thryvin.test"})
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Reset User", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                # Verify deletedWorkouts is a number >= 0
                deleted_workouts = data.get('deletedWorkouts')
                if not isinstance(deleted_workouts, int) or deleted_workouts < 0:
                    self.log_test("QA Reset User", False, f"Expected deletedWorkouts >= 0, got {deleted_workouts}", data)
                    return False
                
                self.log_test("QA Reset User", True, f"Successfully reset user, deleted {deleted_workouts} workouts")
                return True
            else:
                self.log_test("QA Reset User", False, f"Reset failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("QA Reset User", False, f"Reset error: {str(e)}")
            return False
    
    def test_qa_regenerate_plan(self) -> bool:
        """Test QA Regenerate Plan"""
        try:
            response = self.session.post(f"{API_BASE}/qa/regenerate-plan", json={"email": "qa_beginner@thryvin.test"})
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Regenerate Plan", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                # Verify workoutsCreated is a number >= 0
                workouts_created = data.get('workoutsCreated')
                if not isinstance(workouts_created, int) or workouts_created < 0:
                    self.log_test("QA Regenerate Plan", False, f"Expected workoutsCreated >= 0, got {workouts_created}", data)
                    return False
                
                self.log_test("QA Regenerate Plan", True, f"Successfully regenerated plan, created {workouts_created} workouts")
                return True
            else:
                self.log_test("QA Regenerate Plan", False, f"Regenerate failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("QA Regenerate Plan", False, f"Regenerate error: {str(e)}")
            return False
    
    def test_invalid_profile_handling(self) -> bool:
        """Test Invalid Profile Handling"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "invalid"})
            
            # Should return 400 or similar error status
            if response.status_code >= 400:
                data = response.json()
                
                # Check that ok=false
                if data.get('ok') is False:
                    # Check that there's an error message about invalid profile
                    error_msg = data.get('error', '').lower()
                    if 'invalid' in error_msg and 'profile' in error_msg:
                        self.log_test("Invalid Profile Handling", True, "Correctly rejected invalid profile with appropriate error")
                        return True
                    else:
                        self.log_test("Invalid Profile Handling", False, f"Error message doesn't mention invalid profile: {data.get('error')}", data)
                        return False
                else:
                    self.log_test("Invalid Profile Handling", False, f"Expected ok=false for invalid profile, got ok={data.get('ok')}", data)
                    return False
            else:
                self.log_test("Invalid Profile Handling", False, f"Expected error status for invalid profile, got {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Invalid Profile Handling", False, f"Invalid profile test error: {str(e)}")
            return False
    
    def test_use_access_token(self) -> bool:
        """Test Use Access Token with /api/auth/me"""
        try:
            # Use the beginner access token if available
            if 'beginner' not in self.access_tokens:
                self.log_test("Use Access Token", False, "No beginner access token available for testing")
                return False
            
            access_token = self.access_tokens['beginner']
            
            # Create a new session with Authorization header
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            response = requests.get(f"{API_BASE}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("Use Access Token", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                if 'user' not in data:
                    self.log_test("Use Access Token", False, "Missing user in response", data)
                    return False
                
                user = data['user']
                
                # Verify this matches the beginner profile
                if user.get('selectedCoach') != 'kai' or user.get('fitnessLevel') != 'beginner':
                    self.log_test("Use Access Token", False, "User data doesn't match expected beginner profile", data)
                    return False
                
                self.log_test("Use Access Token", True, "Successfully used access token to retrieve user data")
                return True
            else:
                self.log_test("Use Access Token", False, f"Auth/me failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Use Access Token", False, f"Access token test error: {str(e)}")
            return False

    def test_plan_ensure_validation(self) -> bool:
        """Test Plan Ensure Validation - CRITICAL"""
        try:
            # Use the beginner access token
            if 'beginner' not in self.access_tokens:
                self.log_test("Plan Ensure Validation", False, "No beginner access token available for testing")
                return False
            
            access_token = self.access_tokens['beginner']
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            response = requests.post(f"{API_BASE}/workouts/plan/ensure", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("Plan Ensure Validation", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                # Verify workoutsCount >= 3 (beginner has 3 training days)
                workouts_count = data.get('workoutsCount')
                if not isinstance(workouts_count, int) or workouts_count < 3:
                    self.log_test("Plan Ensure Validation", False, f"Expected workoutsCount >= 3 for beginner, got {workouts_count}", data)
                    return False
                
                # Verify usedFallback is boolean
                used_fallback = data.get('usedFallback')
                if not isinstance(used_fallback, bool):
                    self.log_test("Plan Ensure Validation", False, f"Expected usedFallback to be boolean, got {type(used_fallback)}", data)
                    return False
                
                # Verify validationWarnings is array
                validation_warnings = data.get('validationWarnings')
                if not isinstance(validation_warnings, list):
                    self.log_test("Plan Ensure Validation", False, f"Expected validationWarnings to be array, got {type(validation_warnings)}", data)
                    return False
                
                self.log_test("Plan Ensure Validation", True, f"Plan validation successful: {workouts_count} workouts, fallback={used_fallback}, warnings={len(validation_warnings)}")
                return True
            else:
                self.log_test("Plan Ensure Validation", False, f"Plan ensure failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Plan Ensure Validation", False, f"Plan ensure error: {str(e)}")
            return False

    def test_coach_action_mismatch_blocking(self) -> bool:
        """Test Coach Action Mismatch Blocking - CRITICAL"""
        try:
            # Use the intermediate access token for this test
            if 'intermediate' not in self.access_tokens:
                self.log_test("Coach Action Mismatch Blocking", False, "No intermediate access token available for testing")
                return False
            
            access_token = self.access_tokens['intermediate']
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            # Test mismatch: cardio workout when user requested chest workout
            action_data = {
                "action": {
                    "type": "ADD_SESSION",
                    "workoutType": "cardio",
                    "durationMinutes": 45,
                    "dayOfWeek": "wednesday",
                    "userRequestedType": "chest workout"
                }
            }
            
            response = requests.post(f"{API_BASE}/coach/actions/execute", headers=headers, json=action_data)
            
            # This MUST be blocked with 400 error
            if response.status_code == 400:
                data = response.json()
                
                # Check for ACTION_MISMATCH or CARDIO_DEFAULT_BLOCKED error code
                error_code = data.get('code') or data.get('error', {}).get('code', '')
                if error_code in ['ACTION_MISMATCH', 'CARDIO_DEFAULT_BLOCKED']:
                    self.log_test("Coach Action Mismatch Blocking", True, f"Correctly blocked cardio/chest mismatch with code: {error_code}")
                    return True
                else:
                    self.log_test("Coach Action Mismatch Blocking", False, f"Expected ACTION_MISMATCH or CARDIO_DEFAULT_BLOCKED, got code: {error_code}", data)
                    return False
            else:
                self.log_test("Coach Action Mismatch Blocking", False, f"Expected 400 error for mismatch, got status {response.status_code} - MISMATCH NOT BLOCKED!", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Coach Action Mismatch Blocking", False, f"Coach action mismatch test error: {str(e)}")
            return False

    def test_valid_coach_action(self) -> bool:
        """Test Valid Coach Action"""
        try:
            # Use the intermediate access token
            if 'intermediate' not in self.access_tokens:
                self.log_test("Valid Coach Action", False, "No intermediate access token available for testing")
                return False
            
            access_token = self.access_tokens['intermediate']
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            # Test valid action: chest workout when user requested chest workout
            action_data = {
                "action": {
                    "type": "ADD_SESSION",
                    "workoutType": "chest",
                    "durationMinutes": 60,
                    "dayOfWeek": "thursday",
                    "userRequestedType": "chest workout"
                }
            }
            
            response = requests.post(f"{API_BASE}/coach/actions/execute", headers=headers, json=action_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("Valid Coach Action", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                # Verify message contains "chest"
                message = data.get('message', '').lower()
                if 'chest' not in message:
                    self.log_test("Valid Coach Action", False, f"Expected message to contain 'chest', got: {data.get('message')}", data)
                    return False
                
                self.log_test("Valid Coach Action", True, f"Valid chest workout action succeeded: {data.get('message')}")
                return True
            else:
                self.log_test("Valid Coach Action", False, f"Valid action failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Valid Coach Action", False, f"Valid coach action test error: {str(e)}")
            return False

    def test_back_workout_mismatch(self) -> bool:
        """Test Back Workout Mismatch - Another Mismatch Test"""
        try:
            # Use the intermediate access token
            if 'intermediate' not in self.access_tokens:
                self.log_test("Back Workout Mismatch", False, "No intermediate access token available for testing")
                return False
            
            access_token = self.access_tokens['intermediate']
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            # Test mismatch: cardio workout when user requested back and biceps
            action_data = {
                "action": {
                    "type": "ADD_SESSION",
                    "workoutType": "cardio",
                    "durationMinutes": 45,
                    "dayOfWeek": "friday",
                    "userRequestedType": "back and biceps"
                }
            }
            
            response = requests.post(f"{API_BASE}/coach/actions/execute", headers=headers, json=action_data)
            
            # This MUST be blocked with 400 error
            if response.status_code == 400:
                data = response.json()
                
                # Check for ACTION_MISMATCH error code
                error_code = data.get('code') or data.get('error', {}).get('code', '')
                if error_code == 'ACTION_MISMATCH':
                    self.log_test("Back Workout Mismatch", True, f"Correctly blocked cardio/back mismatch with code: {error_code}")
                    return True
                else:
                    self.log_test("Back Workout Mismatch", False, f"Expected ACTION_MISMATCH, got code: {error_code}", data)
                    return False
            else:
                self.log_test("Back Workout Mismatch", False, f"Expected 400 error for mismatch, got status {response.status_code} - MISMATCH NOT BLOCKED!", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Back Workout Mismatch", False, f"Back workout mismatch test error: {str(e)}")
            return False

    def test_explicit_cardio_request(self) -> bool:
        """Test Explicit Cardio Request - Should Succeed"""
        try:
            # Use the intermediate access token
            if 'intermediate' not in self.access_tokens:
                self.log_test("Explicit Cardio Request", False, "No intermediate access token available for testing")
                return False
            
            access_token = self.access_tokens['intermediate']
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
            
            # Test valid cardio: cardio workout when user explicitly requested cardio
            action_data = {
                "action": {
                    "type": "ADD_SESSION",
                    "workoutType": "cardio",
                    "durationMinutes": 30,
                    "dayOfWeek": "saturday",
                    "userRequestedType": "cardio session"
                }
            }
            
            response = requests.post(f"{API_BASE}/coach/actions/execute", headers=headers, json=action_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if not data.get('ok'):
                    self.log_test("Explicit Cardio Request", False, f"Response ok=false: {data.get('error', 'Unknown error')}", data)
                    return False
                
                self.log_test("Explicit Cardio Request", True, f"Explicit cardio request succeeded: {data.get('message', 'No message')}")
                return True
            else:
                self.log_test("Explicit Cardio Request", False, f"Explicit cardio failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Explicit Cardio Request", False, f"Explicit cardio test error: {str(e)}")
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
    
    def run_all_tests(self):
        """Run all Workout Validation and Coach Action tests as specified in review request"""
        print("🏋️ Starting Thryvin AI Fitness App Backend Testing - Workout Validation & Coach Action Tests")
        print("Testing CRITICAL workout validation and coach action fixes:")
        print("1. Plan Ensure Validation (POST /api/workouts/plan/ensure)")
        print("2. Coach Action Mismatch Blocking (POST /api/coach/actions/execute) - CRITICAL")
        print("3. Valid Coach Action (POST /api/coach/actions/execute)")
        print("4. Back Workout Mismatch Test (POST /api/coach/actions/execute)")
        print("5. Explicit Cardio Request (POST /api/coach/actions/execute)")
        print("=" * 60)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # First, get auth tokens
        print("\n🔑 Setting up authentication...")
        beginner_success = self.test_qa_login_beginner()
        intermediate_success = self.test_qa_login_intermediate()
        
        if not beginner_success or not intermediate_success:
            print("❌ Failed to get required auth tokens. Cannot proceed with workout tests.")
            return False
        
        print("✅ Auth tokens obtained successfully")
        
        # Test 1: Plan Ensure Validation
        print("\n📋 Test 1: Plan Ensure Validation...")
        plan_ensure_success = self.test_plan_ensure_validation()
        
        # Test 2: Coach Action Mismatch Blocking (CRITICAL)
        print("\n🚫 Test 2: Coach Action Mismatch Blocking (CRITICAL)...")
        mismatch_blocking_success = self.test_coach_action_mismatch_blocking()
        
        # Test 3: Valid Coach Action
        print("\n✅ Test 3: Valid Coach Action...")
        valid_action_success = self.test_valid_coach_action()
        
        # Test 4: Back Workout Mismatch Test
        print("\n🚫 Test 4: Back Workout Mismatch Test...")
        back_mismatch_success = self.test_back_workout_mismatch()
        
        # Test 5: Explicit Cardio Request
        print("\n💓 Test 5: Explicit Cardio Request...")
        cardio_success = self.test_explicit_cardio_request()
        
        print("\n" + "=" * 60)
        print("🏁 Workout Validation & Coach Action Test Results:")
        
        # Count only the workout validation tests (not auth setup)
        workout_tests = [
            plan_ensure_success,
            mismatch_blocking_success,
            valid_action_success,
            back_mismatch_success,
            cardio_success
        ]
        
        passed_workout_tests = sum(1 for result in workout_tests if result)
        total_workout_tests = len(workout_tests)
        
        print(f"✅ {passed_workout_tests}/{total_workout_tests} workout validation tests passed")
        
        if passed_workout_tests == total_workout_tests:
            print("🎉 All CRITICAL workout validation and coach action tests passed!")
            return True
        else:
            print(f"⚠️ {total_workout_tests - passed_workout_tests} CRITICAL tests failed")
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
    tester = ThryvinWorkoutValidationTester()
    
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