#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App - 3 URGENT FIXES
Tests the specific scenarios mentioned in the review request:

1. WEEKLY PROGRAM STRUCTURE (Split Planner)
   - Test Case: Beginner 3 days/week should generate Upper/Lower/Full split
   - Verify Day 0 focuses on "upper" (first day of Upper/Lower/Full)
   - Verify Day 2 has different focus than Day 0
   - Ensure 4-6 exercises total (beginner 45min limit)
   - NOT full-body every day

2. Sample with Weekly Activities (respect conflicts)
   - Test Day 1 (Monday) has Boxing - should avoid heavy upper work
   - Log should show split planner adjustments

3. Verification Criteria:
   - All endpoints return 200
   - Exercise counts within limits (4-6 for beginner 45min)
   - Split pattern varies by day (not all full-body)
   - No ReferenceError crashes
"""

import requests
import json
import sys
import time
from typing import Dict, List, Any, Optional

# Configuration - Use production URL from environment
BASE_URL = "https://fitness-stats-8.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class ThryvinUrgentFixesTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.authenticated = False
        self.test_user_email = f"test_urgent_{int(time.time())}@thryvin.test"
        self.test_user_password = "testpass123"
        
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
    
    def authenticate_test_user(self) -> bool:
        """Create and authenticate a test user"""
        try:
            # Register test user
            register_data = {
                "name": "Test Urgent Fixes User",
                "email": self.test_user_email,
                "password": self.test_user_password,
                "sessionDuration": 45,
                "equipment": ["dumbbells", "barbell", "bodyweight"],
                "fitnessGoals": ["strength", "muscle_gain"],
                "trainingSchedule": "flexible",
                "country": "US",
                "timezone": "America/New_York"
            }
            
            # Try registration (might fail if user exists, that's ok)
            register_response = self.session.post(f"{API_BASE}/register", json=register_data)
            
            # Login
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            login_response = self.session.post(f"{API_BASE}/login", json=login_data)
            
            if login_response.status_code == 200:
                self.authenticated = True
                self.log_test("Authentication", True, f"Successfully authenticated test user: {self.test_user_email}")
                return True
            else:
                self.log_test("Authentication", False, 
                            f"Login failed with status {login_response.status_code}",
                            {"response": login_response.text})
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Authentication error: {str(e)}")
            return False

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

    def test_weekly_program_structure_day_0(self) -> bool:
        """
        Test 1A: Weekly Program Structure - Day 0 (Sunday)
        Beginner 3 days/week should generate Upper/Lower/Full split
        Day 0 should focus on "upper" (first day of Upper/Lower/Full)
        """
        try:
            workout_data = {
                "userProfile": {
                    "experience": "beginner",
                    "sessionDuration": 45,
                    "trainingDays": 3,
                    "trainingType": "strength",
                    "equipment": ["barbell", "dumbbells", "bench"],
                    "advancedQuestionnaire": {
                        "gymDaysAvailable": [0, 2, 4],
                        "preferredSplit": "coach_choice"
                    }
                },
                "dayOfWeek": 0,
                "weekNumber": 1,
                "recentExercises": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code != 200:
                self.log_test("Weekly Program Structure - Day 0", False, 
                            f"API failed with status {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Check required fields
            required_fields = ['title', 'exercises', 'type', 'duration']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Weekly Program Structure - Day 0", False, 
                            f"Response missing fields: {missing_fields}", data)
                return False
            
            exercises = data.get('exercises', [])
            exercise_count = len(exercises)
            
            # Verify exercise count is within beginner 45min limits (4-6 exercises)
            if exercise_count < 4 or exercise_count > 6:
                self.log_test("Weekly Program Structure - Day 0", False, 
                            f"Exercise count {exercise_count} not within beginner 45min limits (4-6)",
                            {"exercise_count": exercise_count, "exercises": [ex.get('name') for ex in exercises]})
                return False
            
            # Check if workout focuses on upper body (should be first day of Upper/Lower/Full)
            workout_title = data.get('title', '').lower()
            workout_type = data.get('type', '').lower()
            
            # Count upper body vs lower body exercises
            upper_exercises = 0
            lower_exercises = 0
            
            for exercise in exercises:
                ex_name = exercise.get('name', '').lower()
                # Upper body indicators
                if any(keyword in ex_name for keyword in ['bench', 'press', 'row', 'pull', 'curl', 'extension', 'fly', 'raise', 'shoulder', 'chest', 'back', 'arm']):
                    upper_exercises += 1
                # Lower body indicators  
                elif any(keyword in ex_name for keyword in ['squat', 'lunge', 'deadlift', 'leg', 'calf', 'glute', 'hip']):
                    lower_exercises += 1
            
            # For Upper/Lower/Full split, Day 0 should focus on upper
            is_upper_focused = upper_exercises > lower_exercises
            
            if not is_upper_focused:
                self.log_test("Weekly Program Structure - Day 0", False, 
                            f"Day 0 should focus on upper body (Upper/Lower/Full split), but got {upper_exercises} upper vs {lower_exercises} lower exercises",
                            {
                                "workout_title": workout_title,
                                "workout_type": workout_type,
                                "upper_exercises": upper_exercises,
                                "lower_exercises": lower_exercises,
                                "exercises": [ex.get('name') for ex in exercises]
                            })
                return False
            
            self.log_test("Weekly Program Structure - Day 0", True, 
                        f"Day 0 correctly focuses on upper body ({upper_exercises} upper vs {lower_exercises} lower) with {exercise_count} exercises")
            return True
            
        except Exception as e:
            self.log_test("Weekly Program Structure - Day 0", False, f"Error: {str(e)}")
            return False

    def test_weekly_program_structure_day_2(self) -> bool:
        """
        Test 1B: Weekly Program Structure - Day 2 (Tuesday)
        Day 2 should have different focus than Day 0
        Should be "lower" in Upper/Lower/Full split
        """
        try:
            workout_data = {
                "userProfile": {
                    "experience": "beginner",
                    "sessionDuration": 45,
                    "trainingDays": 3,
                    "equipment": ["dumbbells"],
                    "advancedQuestionnaire": {
                        "gymDaysAvailable": [0, 2, 4],
                        "preferredSplit": "coach_choice"
                    }
                },
                "dayOfWeek": 2,
                "weekNumber": 1,
                "recentExercises": ["Dumbbell Bench Press", "Barbell Squat"]
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code != 200:
                self.log_test("Weekly Program Structure - Day 2", False, 
                            f"API failed with status {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            exercises = data.get('exercises', [])
            exercise_count = len(exercises)
            
            # Verify exercise count is within beginner 45min limits (4-6 exercises)
            if exercise_count < 4 or exercise_count > 6:
                self.log_test("Weekly Program Structure - Day 2", False, 
                            f"Exercise count {exercise_count} not within beginner 45min limits (4-6)",
                            {"exercise_count": exercise_count, "exercises": [ex.get('name') for ex in exercises]})
                return False
            
            # Count upper body vs lower body exercises
            upper_exercises = 0
            lower_exercises = 0
            
            for exercise in exercises:
                ex_name = exercise.get('name', '').lower()
                # Upper body indicators
                if any(keyword in ex_name for keyword in ['bench', 'press', 'row', 'pull', 'curl', 'extension', 'fly', 'raise', 'shoulder', 'chest', 'back', 'arm']):
                    upper_exercises += 1
                # Lower body indicators  
                elif any(keyword in ex_name for keyword in ['squat', 'lunge', 'deadlift', 'leg', 'calf', 'glute', 'hip']):
                    lower_exercises += 1
            
            # For Upper/Lower/Full split, Day 2 should focus on lower (different from Day 0 upper)
            is_lower_focused = lower_exercises > upper_exercises
            
            if not is_lower_focused:
                self.log_test("Weekly Program Structure - Day 2", False, 
                            f"Day 2 should focus on lower body (different from Day 0), but got {upper_exercises} upper vs {lower_exercises} lower exercises",
                            {
                                "upper_exercises": upper_exercises,
                                "lower_exercises": lower_exercises,
                                "exercises": [ex.get('name') for ex in exercises]
                            })
                return False
            
            self.log_test("Weekly Program Structure - Day 2", True, 
                        f"Day 2 correctly focuses on lower body ({lower_exercises} lower vs {upper_exercises} upper) with {exercise_count} exercises")
            return True
            
        except Exception as e:
            self.log_test("Weekly Program Structure - Day 2", False, f"Error: {str(e)}")
            return False

    def test_weekly_activities_conflict_handling(self) -> bool:
        """
        Test 2: Sample with Weekly Activities (respect conflicts)
        Day 1 (Monday) has Boxing - should avoid heavy upper work
        """
        try:
            workout_data = {
                "userProfile": {
                    "experience": "intermediate",
                    "sessionDuration": 45,
                    "trainingDays": 3,
                    "equipment": ["barbell", "dumbbells"],
                    "advancedQuestionnaire": {
                        "weeklyActivities": [
                            {
                                "name": "Boxing",
                                "dayOfWeek": 1,
                                "timeWindow": "evening",
                                "intensity": "hard"
                            }
                        ],
                        "gymDaysAvailable": [0, 2, 4]
                    }
                },
                "dayOfWeek": 1,
                "weekNumber": 1,
                "recentExercises": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code != 200:
                self.log_test("Weekly Activities Conflict Handling", False, 
                            f"API failed with status {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            exercises = data.get('exercises', [])
            exercise_count = len(exercises)
            
            # Verify exercise count is reasonable for intermediate 45min (5-7 exercises)
            if exercise_count < 5 or exercise_count > 7:
                self.log_test("Weekly Activities Conflict Handling", False, 
                            f"Exercise count {exercise_count} not within intermediate 45min limits (5-7)",
                            {"exercise_count": exercise_count, "exercises": [ex.get('name') for ex in exercises]})
                return False
            
            # Count heavy upper body exercises that would conflict with boxing
            heavy_upper_exercises = 0
            heavy_upper_names = []
            
            for exercise in exercises:
                ex_name = exercise.get('name', '').lower()
                # Heavy upper body exercises that would conflict with boxing
                if any(keyword in ex_name for keyword in ['bench press', 'overhead press', 'shoulder press', 'heavy row', 'pulldown']):
                    heavy_upper_exercises += 1
                    heavy_upper_names.append(exercise.get('name'))
            
            # Should avoid heavy upper work due to boxing conflict
            # Allow some upper body work but not heavy compound movements
            if heavy_upper_exercises > 2:  # Allow max 2 heavy upper exercises
                self.log_test("Weekly Activities Conflict Handling", False, 
                            f"Day 1 has boxing conflict but includes {heavy_upper_exercises} heavy upper exercises: {heavy_upper_names}",
                            {
                                "heavy_upper_count": heavy_upper_exercises,
                                "heavy_upper_exercises": heavy_upper_names,
                                "all_exercises": [ex.get('name') for ex in exercises]
                            })
                return False
            
            # Check if workout type/focus reflects the conflict adjustment
            workout_title = data.get('title', '').lower()
            workout_type = data.get('type', '').lower()
            
            # Should lean towards lower body or full body, not pure upper
            is_upper_heavy = 'upper' in workout_title or 'upper' in workout_type
            
            if is_upper_heavy:
                self.log_test("Weekly Activities Conflict Handling", False, 
                            f"Day 1 has boxing conflict but workout is upper-focused: {workout_title}",
                            {
                                "workout_title": workout_title,
                                "workout_type": workout_type,
                                "exercises": [ex.get('name') for ex in exercises]
                            })
                return False
            
            self.log_test("Weekly Activities Conflict Handling", True, 
                        f"Day 1 correctly avoids heavy upper work due to boxing conflict ({heavy_upper_exercises} heavy upper exercises)")
            return True
            
        except Exception as e:
            self.log_test("Weekly Activities Conflict Handling", False, f"Error: {str(e)}")
            return False

    def test_no_reference_errors(self) -> bool:
        """
        Test 3: Verify no ReferenceError crashes
        Test multiple workout generation calls to ensure stability
        """
        try:
            test_cases = [
                {
                    "name": "Basic Beginner",
                    "data": {
                        "userProfile": {
                            "experience": "beginner",
                            "sessionDuration": 30,
                            "trainingDays": 2,
                            "equipment": ["bodyweight"]
                        },
                        "dayOfWeek": 0,
                        "weekNumber": 1,
                        "recentExercises": []
                    }
                },
                {
                    "name": "Advanced with Equipment",
                    "data": {
                        "userProfile": {
                            "experience": "advanced",
                            "sessionDuration": 60,
                            "trainingDays": 5,
                            "equipment": ["barbell", "dumbbells", "cable", "machine"],
                            "advancedQuestionnaire": {
                                "preferredSplit": "push_pull_legs"
                            }
                        },
                        "dayOfWeek": 3,
                        "weekNumber": 2,
                        "recentExercises": ["Bench Press", "Squat", "Deadlift"]
                    }
                },
                {
                    "name": "Intermediate with Activities",
                    "data": {
                        "userProfile": {
                            "experience": "intermediate",
                            "sessionDuration": 45,
                            "trainingDays": 4,
                            "equipment": ["dumbbells", "kettlebell"],
                            "advancedQuestionnaire": {
                                "weeklyActivities": [
                                    {"name": "Running", "dayOfWeek": 2, "timeWindow": "morning", "intensity": "moderate"}
                                ]
                            }
                        },
                        "dayOfWeek": 2,
                        "weekNumber": 1,
                        "recentExercises": []
                    }
                }
            ]
            
            all_passed = True
            
            for test_case in test_cases:
                try:
                    response = self.session.post(f"{API_BASE}/workouts/generate", json=test_case["data"])
                    
                    if response.status_code != 200:
                        self.log_test(f"No ReferenceError - {test_case['name']}", False, 
                                    f"API failed with status {response.status_code}",
                                    {"response": response.text})
                        all_passed = False
                        continue
                    
                    data = response.json()
                    
                    # Check for basic structure
                    if not data.get('exercises') or not isinstance(data['exercises'], list):
                        self.log_test(f"No ReferenceError - {test_case['name']}", False, 
                                    "Response missing exercises array", data)
                        all_passed = False
                        continue
                    
                    # Check for reasonable exercise count
                    exercise_count = len(data['exercises'])
                    if exercise_count < 3 or exercise_count > 12:
                        self.log_test(f"No ReferenceError - {test_case['name']}", False, 
                                    f"Unreasonable exercise count: {exercise_count}", 
                                    {"exercise_count": exercise_count})
                        all_passed = False
                        continue
                    
                    print(f"  ✓ {test_case['name']}: {exercise_count} exercises generated successfully")
                    
                except Exception as e:
                    self.log_test(f"No ReferenceError - {test_case['name']}", False, f"Error: {str(e)}")
                    all_passed = False
            
            if all_passed:
                self.log_test("No ReferenceError Crashes", True, 
                            f"All {len(test_cases)} test cases passed without crashes")
                return True
            else:
                self.log_test("No ReferenceError Crashes", False, 
                            "Some test cases failed or crashed")
                return False
            
        except Exception as e:
            self.log_test("No ReferenceError Crashes", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all urgent fixes tests"""
        print("🚨 Starting Thryvin Fitness App Backend Testing - 3 URGENT FIXES")
        print("Testing scenarios from review request:")
        print("1. Weekly Program Structure (Split Planner)")
        print("2. Weekly Activities Conflict Handling")
        print("3. No ReferenceError Crashes")
        print("=" * 60)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 0: Health Endpoint
        print("\n💚 Test 0: Health Check Endpoint...")
        health_success = self.test_health_endpoint()
        
        # Authentication
        print("\n🔐 Authenticating test user...")
        auth_success = self.authenticate_test_user()
        
        if not auth_success:
            print("❌ Authentication failed - skipping authenticated tests")
            return False
        
        # Test 1A: Weekly Program Structure - Day 0
        print("\n📅 Test 1A: Weekly Program Structure - Day 0 (Upper Focus)...")
        day0_success = self.test_weekly_program_structure_day_0()
        
        # Test 1B: Weekly Program Structure - Day 2
        print("\n📅 Test 1B: Weekly Program Structure - Day 2 (Lower Focus)...")
        day2_success = self.test_weekly_program_structure_day_2()
        
        # Test 2: Weekly Activities Conflict Handling
        print("\n🥊 Test 2: Weekly Activities Conflict Handling (Boxing Day)...")
        conflict_success = self.test_weekly_activities_conflict_handling()
        
        # Test 3: No ReferenceError Crashes
        print("\n🛡️ Test 3: No ReferenceError Crashes...")
        stability_success = self.test_no_reference_errors()
        
        print("\n" + "=" * 60)
        print("🏁 3 Urgent Fixes Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All 3 urgent fixes backend tests passed!")
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
    tester = ThryvinUrgentFixesTester()
    
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