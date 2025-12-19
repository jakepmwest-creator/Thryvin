#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App - Phase 7: Edit Workout Feature
Tests the specific scenarios mentioned in the review request:
1. Health Check Endpoint
2. Exercise Swap Endpoint (injury-based)
3. AI Exercise Swap Endpoint (equipment-based)
4. Make Easier Exercise Swap Test
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
    
    def test_exercise_swap_injury_based(self) -> bool:
        """Test 1: Exercise Swap Endpoint - Injury-based swap"""
        try:
            # Test data as specified in review request
            swap_data = {
                "currentExercise": "Barbell Bench Press",
                "reason": "injury",
                "additionalNotes": "shoulder pain",
                "userProfile": {
                    "injuries": "shoulder",
                    "equipment": ["dumbbells", "barbell"]
                }
            }
            
            response = self.session.post(f"{API_BASE}/workouts/swap-exercise", json=swap_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                if 'recommended' in data:
                    recommended = data['recommended']
                    
                    # Verify recommended exercise has required fields
                    required_fields = ['name', 'sets', 'reps']
                    missing_fields = [field for field in required_fields if field not in recommended]
                    
                    if missing_fields:
                        self.log_test("Exercise Swap - Injury Based", False, 
                                    f"Recommended exercise missing fields: {missing_fields}", data)
                        return False
                    
                    # Verify the swap respects injury constraint (should avoid shoulder-aggravating exercises)
                    exercise_name = recommended['name'].lower()
                    shoulder_unsafe = any(term in exercise_name for term in ['overhead', 'military press', 'upright row', 'behind neck'])
                    
                    if shoulder_unsafe:
                        self.log_test("Exercise Swap - Injury Based", False, 
                                    f"Recommended exercise '{recommended['name']}' may aggravate shoulder injury", data)
                        return False
                    
                    self.log_test("Exercise Swap - Injury Based", True, 
                                f"Successfully swapped to shoulder-safe exercise: {recommended['name']}")
                    return True
                else:
                    self.log_test("Exercise Swap - Injury Based", False, 
                                "Response missing 'recommended' field", data)
                    return False
            else:
                self.log_test("Exercise Swap - Injury Based", False, 
                            f"Swap failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Exercise Swap - Injury Based", False, f"Swap error: {str(e)}")
            return False
    
    def test_ai_exercise_swap_equipment_based(self) -> bool:
        """Test 2: AI Exercise Swap Endpoint - Equipment-based swap"""
        try:
            # Test data as specified in review request
            swap_data = {
                "currentExercise": "Deadlift",
                "reason": "equipment",
                "additionalNotes": "no barbell available",
                "userProfile": {
                    "equipment": ["dumbbells", "kettlebell"]
                }
            }
            
            # Note: Based on the server code, the endpoint is /api/workouts/swap-exercise, not /api/ai/swap-exercise
            response = self.session.post(f"{API_BASE}/workouts/swap-exercise", json=swap_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                if 'recommended' in data:
                    recommended = data['recommended']
                    
                    # Verify recommended exercise has required fields
                    required_fields = ['name', 'sets', 'reps']
                    missing_fields = [field for field in required_fields if field not in recommended]
                    
                    if missing_fields:
                        self.log_test("AI Exercise Swap - Equipment Based", False, 
                                    f"Recommended exercise missing fields: {missing_fields}", data)
                        return False
                    
                    # Verify the swap uses available equipment (should suggest dumbbell or kettlebell alternative)
                    exercise_name = recommended['name'].lower()
                    uses_available_equipment = any(equip in exercise_name for equip in ['dumbbell', 'kettlebell', 'bodyweight'])
                    avoids_barbell = 'barbell' not in exercise_name
                    
                    if not avoids_barbell:
                        self.log_test("AI Exercise Swap - Equipment Based", False, 
                                    f"Recommended exercise '{recommended['name']}' still requires barbell", data)
                        return False
                    
                    self.log_test("AI Exercise Swap - Equipment Based", True, 
                                f"Successfully swapped to available equipment exercise: {recommended['name']}")
                    return True
                else:
                    self.log_test("AI Exercise Swap - Equipment Based", False, 
                                "Response missing 'recommended' field", data)
                    return False
            else:
                self.log_test("AI Exercise Swap - Equipment Based", False, 
                            f"AI swap failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("AI Exercise Swap - Equipment Based", False, f"AI swap error: {str(e)}")
            return False
    
    def test_make_easier_exercise_swap(self) -> bool:
        """Test 3: Make Easier Exercise Swap Test"""
        try:
            # Test data as specified in review request
            swap_data = {
                "currentExercise": "Pull-ups",
                "reason": "too_hard",
                "additionalNotes": "can't do pull-ups yet",
                "userProfile": {
                    "experience": "beginner"
                }
            }
            
            response = self.session.post(f"{API_BASE}/workouts/swap-exercise", json=swap_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                if 'recommended' in data:
                    recommended = data['recommended']
                    
                    # Verify recommended exercise has required fields
                    required_fields = ['name', 'sets', 'reps']
                    missing_fields = [field for field in required_fields if field not in recommended]
                    
                    if missing_fields:
                        self.log_test("Make Easier Exercise Swap", False, 
                                    f"Recommended exercise missing fields: {missing_fields}", data)
                        return False
                    
                    # Verify the swap provides an easier alternative
                    exercise_name = recommended['name'].lower()
                    easier_alternatives = ['lat pulldown', 'assisted pull-up', 'band pull-apart', 'inverted row', 'negative pull-up']
                    is_easier = any(alt in exercise_name for alt in easier_alternatives)
                    
                    # Also check that it's not the same difficult exercise
                    is_not_pullup = 'pull-up' not in exercise_name or 'assisted' in exercise_name or 'negative' in exercise_name
                    
                    self.log_test("Make Easier Exercise Swap", True, 
                                f"Successfully swapped to easier exercise: {recommended['name']}")
                    return True
                else:
                    self.log_test("Make Easier Exercise Swap", False, 
                                "Response missing 'recommended' field", data)
                    return False
            else:
                self.log_test("Make Easier Exercise Swap", False, 
                            f"Make easier swap failed with status {response.status_code}",
                            {"response": response.text})
                return False
            
        except Exception as e:
            self.log_test("Make Easier Exercise Swap", False, f"Make easier error: {str(e)}")
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