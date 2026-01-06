#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin AI Fitness App - REST-ONLY Plans Fix Tests
Tests the CRITICAL REST-ONLY plans fix:
1. QA Login - Beginner Profile (workoutsCount >= 3, trainingDaysPerWeek = 3)
2. QA Login - Intermediate Profile (workoutsCount >= 4, trainingDaysPerWeek = 4)
3. QA Login - Injury Profile (workoutsCount >= 4, trainingDaysPerWeek = 4)
4. Get Workout Plan Days (NEW ENDPOINT) - GET /api/workouts/plan/days
5. Plan Status Check - GET /api/workouts/plan/status
6. Plan Ensure - POST /api/workouts/plan/ensure

CRITICAL CHECKS:
- NO more REST-ONLY plans
- All QA users have real workouts with exercises
- workoutsCount MUST always be >= trainingDaysPerWeek
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

class ThryvinRESTOnlyPlansTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.tokens = {}  # Store tokens for different profiles
        
    def verify_json_response(self, response, test_name: str) -> tuple[bool, dict]:
        """Verify response is valid JSON with correct Content-Type"""
        try:
            # Check Content-Type header
            content_type = response.headers.get('content-type', '').lower()
            if 'application/json' not in content_type:
                self.log_test(test_name, False, f"Invalid Content-Type: {content_type}, expected application/json")
                return False, {}
            
            # Try to parse JSON
            data = response.json()
            return True, data
            
        except ValueError as e:
            self.log_test(test_name, False, f"Invalid JSON response: {str(e)}")
            return False, {}
        except Exception as e:
            self.log_test(test_name, False, f"Response parsing error: {str(e)}")
            return False, {}
    
    def test_qa_login_beginner_with_workout_validation(self) -> bool:
        """Test QA Login - Beginner Profile with workout validation"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "beginner"})
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "QA Login Beginner - Workout Validation")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Login Beginner - Workout Validation", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                if 'accessToken' not in data:
                    self.log_test("QA Login Beginner - Workout Validation", False, "Missing accessToken in response")
                    return False
                
                # Store token for later tests
                self.tokens['beginner'] = data['accessToken']
                
                # CRITICAL: Check workout validation
                workouts_count = data.get('workoutsCount', 0)
                training_days = data.get('trainingDaysPerWeek', 0)
                
                if training_days != 3:
                    self.log_test("QA Login Beginner - Workout Validation", False, f"Expected trainingDaysPerWeek=3, got {training_days}")
                    return False
                
                if workouts_count < 3:
                    self.log_test("QA Login Beginner - Workout Validation", False, f"Expected workoutsCount>=3, got {workouts_count}")
                    return False
                
                if workouts_count < training_days:
                    self.log_test("QA Login Beginner - Workout Validation", False, f"CRITICAL: workoutsCount({workouts_count}) < trainingDaysPerWeek({training_days})")
                    return False
                
                self.log_test("QA Login Beginner - Workout Validation", True, f"Successfully validated: workoutsCount={workouts_count}, trainingDaysPerWeek={training_days}")
                return True
            else:
                self.log_test("QA Login Beginner - Workout Validation", False, f"Login failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Login Beginner - Workout Validation", False, f"Login error: {str(e)}")
            return False
    
    def test_qa_login_intermediate_with_workout_validation(self) -> bool:
        """Test QA Login - Intermediate Profile with workout validation"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "intermediate"})
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "QA Login Intermediate - Workout Validation")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Login Intermediate - Workout Validation", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                if 'accessToken' not in data:
                    self.log_test("QA Login Intermediate - Workout Validation", False, "Missing accessToken in response")
                    return False
                
                # Store token for later tests
                self.tokens['intermediate'] = data['accessToken']
                
                # CRITICAL: Check workout validation
                workouts_count = data.get('workoutsCount', 0)
                training_days = data.get('trainingDaysPerWeek', 0)
                
                if training_days != 4:
                    self.log_test("QA Login Intermediate - Workout Validation", False, f"Expected trainingDaysPerWeek=4, got {training_days}")
                    return False
                
                if workouts_count < 4:
                    self.log_test("QA Login Intermediate - Workout Validation", False, f"Expected workoutsCount>=4, got {workouts_count}")
                    return False
                
                if workouts_count < training_days:
                    self.log_test("QA Login Intermediate - Workout Validation", False, f"CRITICAL: workoutsCount({workouts_count}) < trainingDaysPerWeek({training_days})")
                    return False
                
                self.log_test("QA Login Intermediate - Workout Validation", True, f"Successfully validated: workoutsCount={workouts_count}, trainingDaysPerWeek={training_days}")
                return True
            else:
                self.log_test("QA Login Intermediate - Workout Validation", False, f"Login failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Login Intermediate - Workout Validation", False, f"Login error: {str(e)}")
            return False
    
    def test_qa_login_injury_with_workout_validation(self) -> bool:
        """Test QA Login - Injury Profile with workout validation"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "injury"})
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "QA Login Injury - Workout Validation")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Login Injury - Workout Validation", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                if 'accessToken' not in data:
                    self.log_test("QA Login Injury - Workout Validation", False, "Missing accessToken in response")
                    return False
                
                # Store token for later tests
                self.tokens['injury'] = data['accessToken']
                
                # CRITICAL: Check workout validation
                workouts_count = data.get('workoutsCount', 0)
                training_days = data.get('trainingDaysPerWeek', 0)
                
                if training_days != 4:
                    self.log_test("QA Login Injury - Workout Validation", False, f"Expected trainingDaysPerWeek=4, got {training_days}")
                    return False
                
                if workouts_count < 4:
                    self.log_test("QA Login Injury - Workout Validation", False, f"Expected workoutsCount>=4, got {workouts_count}")
                    return False
                
                if workouts_count < training_days:
                    self.log_test("QA Login Injury - Workout Validation", False, f"CRITICAL: workoutsCount({workouts_count}) < trainingDaysPerWeek({training_days})")
                    return False
                
                self.log_test("QA Login Injury - Workout Validation", True, f"Successfully validated: workoutsCount={workouts_count}, trainingDaysPerWeek={training_days}")
                return True
            else:
                self.log_test("QA Login Injury - Workout Validation", False, f"Login failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Login Injury - Workout Validation", False, f"Login error: {str(e)}")
            return False
    
    def test_workout_plan_days(self) -> bool:
        """Test Get Workout Plan Days (NEW ENDPOINT)"""
        # Use beginner token
        if 'beginner' not in self.tokens:
            self.log_test("Workout Plan Days", False, "No beginner token available - run login test first")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.tokens["beginner"]}'}
            response = self.session.get(f"{API_BASE}/workouts/plan/days", headers=headers)
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "Workout Plan Days")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("Workout Plan Days", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                if 'workouts' not in data:
                    self.log_test("Workout Plan Days", False, "Missing workouts array in response")
                    return False
                
                workouts = data['workouts']
                if not isinstance(workouts, list):
                    self.log_test("Workout Plan Days", False, f"Expected workouts to be array, got {type(workouts)}")
                    return False
                
                # CRITICAL: Verify at least 3 workout entries have exercises
                workouts_with_exercises = 0
                for workout in workouts:
                    if isinstance(workout, dict) and 'exercises' in workout:
                        exercises = workout['exercises']
                        if isinstance(exercises, list) and len(exercises) > 0:
                            workouts_with_exercises += 1
                
                if workouts_with_exercises < 3:
                    self.log_test("Workout Plan Days", False, f"Expected at least 3 workouts with exercises, got {workouts_with_exercises}")
                    return False
                
                self.log_test("Workout Plan Days", True, f"Successfully retrieved {len(workouts)} workouts, {workouts_with_exercises} with exercises")
                return True
            else:
                self.log_test("Workout Plan Days", False, f"Request failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Workout Plan Days", False, f"Request error: {str(e)}")
            return False
    
    def test_plan_status_check(self) -> bool:
        """Test Plan Status Check"""
        # Use beginner token
        if 'beginner' not in self.tokens:
            self.log_test("Plan Status Check", False, "No beginner token available - run login test first")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.tokens["beginner"]}'}
            response = self.session.get(f"{API_BASE}/workouts/plan/status", headers=headers)
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "Plan Status Check")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("Plan Status Check", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                if not data.get('exists'):
                    self.log_test("Plan Status Check", False, "Expected exists=true for plan status")
                    return False
                
                workouts_count = data.get('workoutsCount', 0)
                if workouts_count < 3:
                    self.log_test("Plan Status Check", False, f"Expected workoutsCount>=3, got {workouts_count}")
                    return False
                
                self.log_test("Plan Status Check", True, f"Plan exists with {workouts_count} workouts")
                return True
            else:
                self.log_test("Plan Status Check", False, f"Request failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Plan Status Check", False, f"Request error: {str(e)}")
            return False
    
    def test_plan_ensure(self) -> bool:
        """Test Plan Ensure"""
        # Use beginner token
        if 'beginner' not in self.tokens:
            self.log_test("Plan Ensure", False, "No beginner token available - run login test first")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.tokens["beginner"]}'}
            response = self.session.post(f"{API_BASE}/workouts/plan/ensure", headers=headers)
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "Plan Ensure")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("Plan Ensure", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                workouts_count = data.get('workoutsCount', 0)
                # For beginner profile, should be >= 3 (trainingDaysPerWeek)
                if workouts_count < 3:
                    self.log_test("Plan Ensure", False, f"Expected workoutsCount>=3 (trainingDaysPerWeek), got {workouts_count}")
                    return False
                
                self.log_test("Plan Ensure", True, f"Plan ensured with {workouts_count} workouts")
                return True
            else:
                self.log_test("Plan Ensure", False, f"Request failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Plan Ensure", False, f"Request error: {str(e)}")
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
        """Run all QA Login JSON Response Reliability tests as specified in review request"""
        print("🔐 Starting Thryvin AI Fitness App Backend Testing - QA Login JSON Response Reliability Tests")
        print("Testing CRITICAL QA login endpoints for JSON response reliability:")
        print("1. QA Login - Beginner (10 consecutive times) - POST /api/qa/login-as")
        print("2. QA Login - Intermediate - POST /api/qa/login-as")
        print("3. QA Login - Injury - POST /api/qa/login-as")
        print("4. QA Login - Invalid Profile - POST /api/qa/login-as (should return 400 with INVALID_PROFILE)")
        print("5. QA Login - Empty Body - POST /api/qa/login-as (should return 400 JSON error)")
        print("6. QA Reset User - POST /api/qa/reset-user")
        print("7. QA Profiles List - GET /api/qa/profiles")
        print("=" * 80)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("🚨 CRITICAL CHECK: Every single response must be valid JSON with Content-Type application/json. NO HTML responses allowed.")
        print("=" * 80)
        
        # Test 1: QA Login - Beginner (10 consecutive times)
        print("\n🔄 Test 1: QA Login - Beginner (10 consecutive times)...")
        beginner_10x_success = self.test_qa_login_beginner_10x()
        
        # Test 2: QA Login - Intermediate
        print("\n🔐 Test 2: QA Login - Intermediate...")
        intermediate_success = self.test_qa_login_intermediate()
        
        # Test 3: QA Login - Injury
        print("\n🏥 Test 3: QA Login - Injury...")
        injury_success = self.test_qa_login_injury()
        
        # Test 4: QA Login - Invalid Profile
        print("\n❌ Test 4: QA Login - Invalid Profile...")
        invalid_profile_success = self.test_qa_login_invalid_profile()
        
        # Test 5: QA Login - Empty Body
        print("\n📭 Test 5: QA Login - Empty Body...")
        empty_body_success = self.test_qa_login_empty_body()
        
        # Test 6: QA Reset User
        print("\n🔄 Test 6: QA Reset User...")
        reset_user_success = self.test_qa_reset_user()
        
        # Test 7: QA Profiles List
        print("\n📋 Test 7: QA Profiles List...")
        profiles_list_success = self.test_qa_profiles_list()
        
        print("\n" + "=" * 80)
        print("🏁 QA Login JSON Response Reliability Test Results:")
        
        # Count all QA login tests
        qa_tests = [
            beginner_10x_success,
            intermediate_success,
            injury_success,
            invalid_profile_success,
            empty_body_success,
            reset_user_success,
            profiles_list_success
        ]
        
        passed_qa_tests = sum(1 for result in qa_tests if result)
        total_qa_tests = len(qa_tests)
        
        print(f"✅ {passed_qa_tests}/{total_qa_tests} QA login JSON response tests passed")
        
        if passed_qa_tests == total_qa_tests:
            print("🎉 All CRITICAL QA login JSON response reliability tests passed!")
            print("🔒 All responses are valid JSON with correct Content-Type headers!")
            return True
        else:
            print(f"⚠️ {total_qa_tests - passed_qa_tests} CRITICAL tests failed")
            print("🚨 Some responses may not be valid JSON or have incorrect Content-Type!")
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
    tester = ThryvinQALoginJSONTester()
    
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