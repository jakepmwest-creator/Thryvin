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
BASE_URL = "https://fitness-stats-8.preview.emergentagent.com"
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
    
    def test_workout_generation_all_7_days(self) -> bool:
        """Test 1: Generate Workouts for All 7 Days (New User without Advanced Questionnaire)"""
        try:
            # Test user profile for beginner with 3 training days
            user_profile = {
                "userId": 999,
                "fitnessLevel": "beginner",
                "trainingDays": 3,
                "sessionDuration": 45,
                "equipment": ["dumbbells", "bodyweight"],
                "injuries": [],
                "goal": "general_fitness"
            }
            
            workout_days = []
            rest_days = []
            
            # Test each day of the week (0-6)
            for day_of_week in range(7):
                try:
                    payload = {
                        "userProfile": user_profile,
                        "dayOfWeek": day_of_week
                    }
                    
                    response = self.session.post(f"{API_BASE}/workouts/generate", json=payload)
                    
                    # Verify JSON response
                    is_json, data = self.verify_json_response(response, f"Workout Generation Day {day_of_week}")
                    if not is_json:
                        continue
                    
                    if response.status_code == 200:
                        workout_type = data.get('type', 'unknown')
                        exercises = data.get('exercises', [])
                        
                        if workout_type != "rest" and isinstance(exercises, list) and len(exercises) > 0:
                            workout_days.append(day_of_week)
                        else:
                            rest_days.append(day_of_week)
                            
                    else:
                        self.log_test(f"Workout Generation Day {day_of_week}", False, f"Request failed with status {response.status_code}")
                        
                except Exception as e:
                    self.log_test(f"Workout Generation Day {day_of_week}", False, f"Request error: {str(e)}")
                    continue
            
            # CRITICAL VALIDATION: At least 3 of the 7 days should have workouts (not rest)
            workout_days_count = len(workout_days)
            rest_days_count = len(rest_days)
            
            if workout_days_count < 3:
                self.log_test("Workout Generation All 7 Days", False, f"CRITICAL: Expected at least 3 workout days, got {workout_days_count}. Workout days: {workout_days}, Rest days: {rest_days}")
                return False
            
            # CRITICAL: NOT all 7 days should be rest days
            if rest_days_count == 7:
                self.log_test("Workout Generation All 7 Days", False, f"CRITICAL: All 7 days are REST-ONLY! This is the bug we're trying to fix.")
                return False
            
            # For a 3-day plan, we should have exactly 3 workout days and 4 rest days
            if workout_days_count == 3 and rest_days_count == 4:
                self.log_test("Workout Generation All 7 Days", True, f"Perfect! 3-day plan has exactly 3 workout days {workout_days} and 4 rest days {rest_days}")
                return True
            elif workout_days_count >= 3:
                self.log_test("Workout Generation All 7 Days", True, f"Good! {workout_days_count} workout days {workout_days} and {rest_days_count} rest days {rest_days}")
                return True
            else:
                self.log_test("Workout Generation All 7 Days", False, f"Unexpected: {workout_days_count} workout days, {rest_days_count} rest days")
                return False
                
        except Exception as e:
            self.log_test("Workout Generation All 7 Days", False, f"Test error: {str(e)}")
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
        """Run all REST-ONLY Plans Fix tests as specified in review request"""
        print("🏋️ Starting Thryvin AI Fitness App Backend Testing - REST-ONLY Plans Fix Tests")
        print("Testing CRITICAL REST-ONLY plans fix:")
        print("1. Generate Workouts for All 7 Days (New User without Advanced Questionnaire)")
        print("2. QA Login - Beginner Profile (workoutsCount >= 3, trainingDaysPerWeek = 3)")
        print("3. QA Login - Intermediate Profile (workoutsCount >= 4, trainingDaysPerWeek = 4)")
        print("4. QA Login - Injury Profile (workoutsCount >= 4, trainingDaysPerWeek = 4)")
        print("5. Get Workout Plan Days (NEW ENDPOINT) - GET /api/workouts/plan/days")
        print("6. Plan Status Check - GET /api/workouts/plan/status")
        print("7. Plan Ensure - POST /api/workouts/plan/ensure")
        print("=" * 80)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("🚨 CRITICAL CHECKS:")
        print("   - NO more REST-ONLY plans")
        print("   - All QA users have real workouts with exercises")
        print("   - workoutsCount MUST always be >= trainingDaysPerWeek")
        print("   - 3-day plan should have exactly 3 workout days with exercises")
        print("=" * 80)
        
        # Test 1: Generate Workouts for All 7 Days (MOST CRITICAL)
        print("\n🎯 Test 1: Generate Workouts for All 7 Days (New User without Advanced Questionnaire)...")
        workout_generation_success = self.test_workout_generation_all_7_days()
        
        # Test 2: QA Login - Beginner Profile with workout validation
        print("\n🔰 Test 2: QA Login - Beginner Profile...")
        beginner_success = self.test_qa_login_beginner_with_workout_validation()
        
        # Test 3: QA Login - Intermediate Profile with workout validation
        print("\n🔶 Test 3: QA Login - Intermediate Profile...")
        intermediate_success = self.test_qa_login_intermediate_with_workout_validation()
        
        # Test 4: QA Login - Injury Profile with workout validation
        print("\n🏥 Test 4: QA Login - Injury Profile...")
        injury_success = self.test_qa_login_injury_with_workout_validation()
        
        # Test 5: Get Workout Plan Days (NEW ENDPOINT)
        print("\n📅 Test 5: Get Workout Plan Days (NEW ENDPOINT)...")
        plan_days_success = self.test_workout_plan_days()
        
        # Test 6: Plan Status Check
        print("\n📊 Test 6: Plan Status Check...")
        plan_status_success = self.test_plan_status_check()
        
        # Test 7: Plan Ensure
        print("\n✅ Test 7: Plan Ensure...")
        plan_ensure_success = self.test_plan_ensure()
        
        print("\n" + "=" * 80)
        print("🏁 REST-ONLY Plans Fix Test Results:")
        
        # Count all critical tests
        critical_tests = [
            workout_generation_success,  # MOST CRITICAL TEST
            beginner_success,
            intermediate_success,
            injury_success,
            plan_days_success,
            plan_status_success,
            plan_ensure_success
        ]
        
        passed_tests = sum(1 for result in critical_tests if result)
        total_tests = len(critical_tests)
        
        print(f"✅ {passed_tests}/{total_tests} CRITICAL REST-ONLY plans fix tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All CRITICAL REST-ONLY plans fix tests passed!")
            print("🏋️ No more REST-ONLY plans - all users have real workouts!")
            print("✅ workoutsCount >= trainingDaysPerWeek validation working!")
            return True
        else:
            print(f"⚠️ {total_tests - passed_tests} CRITICAL tests failed")
            print("🚨 REST-ONLY plans fix may not be working correctly!")
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
    tester = ThryvinRESTOnlyPlansTester()
    
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