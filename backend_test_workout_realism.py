#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App - Phase 8.5: Workout Generation Realism
Tests the specific scenarios mentioned in the review request:

CRITICAL ISSUE BEING FIXED:
Beginner + 45 minutes was generating ~10 exercises, which is unrealistic.

NEW EXERCISE COUNT RULES:
- Beginner 30min: 3-4 total
- Beginner 45min: 4-6 total (was 10, should be max 6)
- Beginner 60min: 5-7 total
- Intermediate 45min: 5-7 total
- Advanced 45min: 6-8 total

API Endpoint to Test: POST /api/workouts/generate
"""

import requests
import json
import sys
import time
from typing import Dict, List, Any, Optional

# Configuration - Use production URL as specified in environment
BASE_URL = "https://ai-trainer-upgrade.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class WorkoutRealismTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.authenticated = False
        self.test_user_email = f"test_workout_realism_{int(time.time())}@thryvin.test"
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
    
    def authenticate_test_user(self) -> bool:
        """Create and authenticate a test user for workout testing"""
        try:
            # First, try to register a test user
            register_data = {
                "name": "Test Workout User",
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
            
            # Now try to login
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
    
    def test_beginner_45min_workout(self) -> bool:
        """Test 1: Beginner + 45 minutes should generate 4-6 exercises MAX (not 10)"""
        try:
            workout_data = {
                "userProfile": {
                    "goal": "muscle gain",
                    "experience": "beginner",
                    "trainingType": "strength",
                    "sessionDuration": 45,
                    "equipment": ["barbell", "dumbbells", "bench"],
                    "injuries": None
                },
                "dayOfWeek": 1,
                "weekNumber": 1,
                "recentExercises": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                if 'exercises' not in data:
                    self.log_test("Beginner 45min Workout", False, 
                                "Response missing exercises array", data)
                    return False
                
                exercises = data['exercises']
                exercise_count = len(exercises)
                
                # CRITICAL: Check exercise count is 4-6 (not 10)
                if exercise_count > 6:
                    self.log_test("Beginner 45min Workout", False, 
                                f"TOO MANY EXERCISES: Generated {exercise_count} exercises, should be ≤6 for beginner 45min",
                                {"exercise_count": exercise_count, "exercises": [ex.get('name', 'Unknown') for ex in exercises]})
                    return False
                
                if exercise_count < 4:
                    self.log_test("Beginner 45min Workout", False, 
                                f"TOO FEW EXERCISES: Generated {exercise_count} exercises, should be ≥4 for beginner 45min",
                                {"exercise_count": exercise_count})
                    return False
                
                # Check for warmup and cooldown categories
                categories = [ex.get('category', 'main') for ex in exercises]
                has_warmup = 'warmup' in categories
                has_cooldown = 'cooldown' in categories
                
                if not has_warmup:
                    self.log_test("Beginner 45min Workout", False, 
                                "Missing warmup exercises", {"categories": categories})
                    return False
                
                if not has_cooldown:
                    self.log_test("Beginner 45min Workout", False, 
                                "Missing cooldown exercises", {"categories": categories})
                    return False
                
                # Check duration matches request
                workout_duration = data.get('duration', 0)
                if workout_duration != 45:
                    self.log_test("Beginner 45min Workout", False, 
                                f"Duration mismatch: expected 45, got {workout_duration}")
                    return False
                
                self.log_test("Beginner 45min Workout", True, 
                            f"✅ REALISTIC: Generated {exercise_count} exercises (4-6 range) with warmup and cooldown")
                return True
            else:
                self.log_test("Beginner 45min Workout", False, 
                            f"Workout generation failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Beginner 45min Workout", False, f"Workout generation error: {str(e)}")
            return False
    
    def test_beginner_30min_workout(self) -> bool:
        """Test 2: Beginner + 30 minutes should generate 3-4 exercises MAX"""
        try:
            workout_data = {
                "userProfile": {
                    "experience": "beginner",
                    "sessionDuration": 30,
                    "trainingType": "strength",
                    "equipment": ["dumbbells"]
                },
                "dayOfWeek": 0,
                "weekNumber": 1,
                "recentExercises": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'exercises' not in data:
                    self.log_test("Beginner 30min Workout", False, 
                                "Response missing exercises array", data)
                    return False
                
                exercises = data['exercises']
                exercise_count = len(exercises)
                
                # Check exercise count is 3-4
                if exercise_count > 4:
                    self.log_test("Beginner 30min Workout", False, 
                                f"TOO MANY EXERCISES: Generated {exercise_count} exercises, should be ≤4 for beginner 30min",
                                {"exercise_count": exercise_count, "exercises": [ex.get('name', 'Unknown') for ex in exercises]})
                    return False
                
                if exercise_count < 3:
                    self.log_test("Beginner 30min Workout", False, 
                                f"TOO FEW EXERCISES: Generated {exercise_count} exercises, should be ≥3 for beginner 30min",
                                {"exercise_count": exercise_count})
                    return False
                
                self.log_test("Beginner 30min Workout", True, 
                            f"✅ REALISTIC: Generated {exercise_count} exercises (3-4 range)")
                return True
            else:
                self.log_test("Beginner 30min Workout", False, 
                            f"Workout generation failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Beginner 30min Workout", False, f"Workout generation error: {str(e)}")
            return False
    
    def test_intermediate_60min_workout(self) -> bool:
        """Test 3: Intermediate + 60 minutes should generate 7-9 exercises"""
        try:
            workout_data = {
                "userProfile": {
                    "experience": "intermediate",
                    "sessionDuration": 60,
                    "trainingType": "strength",
                    "equipment": ["barbell", "dumbbells", "cable machine"]
                },
                "dayOfWeek": 2,
                "weekNumber": 1,
                "recentExercises": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'exercises' not in data:
                    self.log_test("Intermediate 60min Workout", False, 
                                "Response missing exercises array", data)
                    return False
                
                exercises = data['exercises']
                exercise_count = len(exercises)
                
                # Check exercise count is 7-9
                if exercise_count > 9:
                    self.log_test("Intermediate 60min Workout", False, 
                                f"TOO MANY EXERCISES: Generated {exercise_count} exercises, should be ≤9 for intermediate 60min",
                                {"exercise_count": exercise_count, "exercises": [ex.get('name', 'Unknown') for ex in exercises]})
                    return False
                
                if exercise_count < 7:
                    self.log_test("Intermediate 60min Workout", False, 
                                f"TOO FEW EXERCISES: Generated {exercise_count} exercises, should be ≥7 for intermediate 60min",
                                {"exercise_count": exercise_count})
                    return False
                
                self.log_test("Intermediate 60min Workout", True, 
                            f"✅ REALISTIC: Generated {exercise_count} exercises (7-9 range)")
                return True
            else:
                self.log_test("Intermediate 60min Workout", False, 
                            f"Workout generation failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Intermediate 60min Workout", False, f"Workout generation error: {str(e)}")
            return False
    
    def test_advanced_45min_workout(self) -> bool:
        """Test 4: Advanced + 45 minutes should generate 6-8 exercises"""
        try:
            workout_data = {
                "userProfile": {
                    "experience": "advanced",
                    "sessionDuration": 45,
                    "trainingType": "strength",
                    "equipment": ["barbell", "dumbbells", "cable machine", "kettlebell"]
                },
                "dayOfWeek": 3,
                "weekNumber": 1,
                "recentExercises": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'exercises' not in data:
                    self.log_test("Advanced 45min Workout", False, 
                                "Response missing exercises array", data)
                    return False
                
                exercises = data['exercises']
                exercise_count = len(exercises)
                
                # Check exercise count is 6-8
                if exercise_count > 8:
                    self.log_test("Advanced 45min Workout", False, 
                                f"TOO MANY EXERCISES: Generated {exercise_count} exercises, should be ≤8 for advanced 45min",
                                {"exercise_count": exercise_count, "exercises": [ex.get('name', 'Unknown') for ex in exercises]})
                    return False
                
                if exercise_count < 6:
                    self.log_test("Advanced 45min Workout", False, 
                                f"TOO FEW EXERCISES: Generated {exercise_count} exercises, should be ≥6 for advanced 45min",
                                {"exercise_count": exercise_count})
                    return False
                
                self.log_test("Advanced 45min Workout", True, 
                            f"✅ REALISTIC: Generated {exercise_count} exercises (6-8 range)")
                return True
            else:
                self.log_test("Advanced 45min Workout", False, 
                            f"Workout generation failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Advanced 45min Workout", False, f"Workout generation error: {str(e)}")
            return False
    
    def test_intermediate_45min_workout(self) -> bool:
        """Test 5: Intermediate + 45 minutes should generate 5-7 exercises"""
        try:
            workout_data = {
                "userProfile": {
                    "experience": "intermediate",
                    "sessionDuration": 45,
                    "trainingType": "strength",
                    "equipment": ["barbell", "dumbbells"]
                },
                "dayOfWeek": 4,
                "weekNumber": 1,
                "recentExercises": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'exercises' not in data:
                    self.log_test("Intermediate 45min Workout", False, 
                                "Response missing exercises array", data)
                    return False
                
                exercises = data['exercises']
                exercise_count = len(exercises)
                
                # Check exercise count is 5-7
                if exercise_count > 7:
                    self.log_test("Intermediate 45min Workout", False, 
                                f"TOO MANY EXERCISES: Generated {exercise_count} exercises, should be ≤7 for intermediate 45min",
                                {"exercise_count": exercise_count, "exercises": [ex.get('name', 'Unknown') for ex in exercises]})
                    return False
                
                if exercise_count < 5:
                    self.log_test("Intermediate 45min Workout", False, 
                                f"TOO FEW EXERCISES: Generated {exercise_count} exercises, should be ≥5 for intermediate 45min",
                                {"exercise_count": exercise_count})
                    return False
                
                self.log_test("Intermediate 45min Workout", True, 
                            f"✅ REALISTIC: Generated {exercise_count} exercises (5-7 range)")
                return True
            else:
                self.log_test("Intermediate 45min Workout", False, 
                            f"Workout generation failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Intermediate 45min Workout", False, f"Workout generation error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Workout Realism tests as specified in review request"""
        print("🏋️ Starting Thryvin Fitness App Backend Testing - Phase 8.5: Workout Generation Realism")
        print("Testing CRITICAL ISSUE: Beginner + 45 minutes was generating ~10 exercises (unrealistic)")
        print("NEW EXERCISE COUNT RULES:")
        print("- Beginner 30min: 3-4 total")
        print("- Beginner 45min: 4-6 total (was 10, should be max 6)")
        print("- Beginner 60min: 5-7 total")
        print("- Intermediate 45min: 5-7 total")
        print("- Advanced 45min: 6-8 total")
        print("=" * 80)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 80)
        
        # Test 1: Health Endpoint
        print("\n💚 Test 1: Health Check Endpoint...")
        health_success = self.test_health_endpoint()
        
        # Authentication for workout tests
        print("\n🔐 Authenticating test user for workout tests...")
        auth_success = self.authenticate_test_user()
        
        if not auth_success:
            print("❌ Authentication failed - skipping workout tests")
            return False
        
        # Test 2: CRITICAL - Beginner 45min (was generating 10, should be ≤6)
        print("\n🚨 Test 2: CRITICAL - Beginner 45min Workout (should be ≤6 exercises, not 10)...")
        beginner_45_success = self.test_beginner_45min_workout()
        
        # Test 3: Beginner 30min
        print("\n⏰ Test 3: Beginner 30min Workout (should be 3-4 exercises)...")
        beginner_30_success = self.test_beginner_30min_workout()
        
        # Test 4: Intermediate 60min
        print("\n💪 Test 4: Intermediate 60min Workout (should be 7-9 exercises)...")
        intermediate_60_success = self.test_intermediate_60min_workout()
        
        # Test 5: Advanced 45min
        print("\n🔥 Test 5: Advanced 45min Workout (should be 6-8 exercises)...")
        advanced_45_success = self.test_advanced_45min_workout()
        
        # Test 6: Intermediate 45min
        print("\n⚖️ Test 6: Intermediate 45min Workout (should be 5-7 exercises)...")
        intermediate_45_success = self.test_intermediate_45min_workout()
        
        print("\n" + "=" * 80)
        print("🏁 Phase 8.5 Workout Generation Realism Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All Workout Generation Realism tests passed!")
            print("✅ CRITICAL ISSUE FIXED: Beginner workouts now generate realistic exercise counts")
            return True
        else:
            print(f"⚠️ {total_tests - passed_tests} tests had issues")
            print("❌ CRITICAL ISSUE NOT FIXED: Some workout generation still unrealistic")
            return False
    
    def print_summary(self):
        """Print detailed test summary"""
        print("\n📊 Detailed Test Summary:")
        print("-" * 60)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
            
            if result['details'] and not result['success']:
                print(f"   Error details: {json.dumps(result['details'], indent=2)}")

def main():
    """Main test runner"""
    tester = WorkoutRealismTester()
    
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