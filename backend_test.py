#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App - Phase 8: Floating AI Coach inside Workout Hub
Tests the specific scenarios mentioned in the review request:
1. Health Check Endpoint
2. Coach Chat with Workout Context (Weight Question)
3. Coach Chat with Workout Context (Form Tip)
4. Coach Chat with Workout Context (Rest Time)
5. Coach Chat WITHOUT Workout Context (Should still work)
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use production URL as specified in environment
BASE_URL = "https://ui-voice-fix.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class ThryvinAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.authenticated = False
        self.test_user_email = f"test_coach_{int(time.time())}@thryvin.test"
        self.test_user_password = "testpass123"
        
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
        """Create and authenticate a test user for coach testing"""
        try:
            # First, try to register a test user
            register_data = {
                "name": "Test Coach User",
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
    
    def test_coach_chat_weight_question(self) -> bool:
        """Test 2: Coach Chat with Workout Context (Weight Question)"""
        try:
            # Test data as specified in review request
            chat_data = {
                "message": "What weight should I use for this exercise?",
                "coach": "titan",
                "workoutContext": {
                    "workoutId": "workout-123",
                    "workoutTitle": "Upper Body Day",
                    "workoutType": "strength",
                    "currentExercise": {
                        "name": "Bench Press",
                        "sets": 4,
                        "reps": 8,
                        "userLoggedSets": 1,
                        "lastEnteredWeight": 60
                    },
                    "progressPercent": 25,
                    "remainingExercisesCount": 6,
                    "userIntentHint": "in_workout"
                },
                "conversationHistory": []
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                required_fields = ['response', 'coach']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Coach Chat - Weight Question", False, 
                                f"Response missing fields: {missing_fields}", data)
                    return False
                
                # Verify coach name is returned as "Titan"
                if data.get('coach') != 'Titan':
                    self.log_test("Coach Chat - Weight Question", False, 
                                f"Expected coach 'Titan', got '{data.get('coach')}'", data)
                    return False
                
                # Verify response is concise (in-workout mode should be shorter)
                response_text = data.get('response', '')
                if len(response_text) > 500:  # Reasonable limit for in-workout responses
                    self.log_test("Coach Chat - Weight Question", False, 
                                f"Response too long for in-workout mode: {len(response_text)} chars", 
                                {"response_length": len(response_text)})
                    return False
                
                # Verify contextUsed is true when authenticated
                if 'contextUsed' in data and not data['contextUsed']:
                    self.log_test("Coach Chat - Weight Question", False, 
                                "contextUsed should be true when authenticated", data)
                    return False
                
                self.log_test("Coach Chat - Weight Question", True, 
                            f"Coach Titan provided concise weight guidance ({len(response_text)} chars)")
                return True
            else:
                self.log_test("Coach Chat - Weight Question", False, 
                            f"Chat failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Coach Chat - Weight Question", False, f"Chat error: {str(e)}")
            return False
    
    def test_coach_chat_form_tip(self) -> bool:
        """Test 3: Coach Chat with Workout Context (Form Tip)"""
        try:
            # Test data as specified in review request
            chat_data = {
                "message": "Give me a quick form tip",
                "coach": "titan",
                "workoutContext": {
                    "currentExercise": {
                        "name": "Squat",
                        "sets": 3,
                        "reps": 10
                    },
                    "userIntentHint": "in_workout"
                }
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                required_fields = ['response', 'coach']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Coach Chat - Form Tip", False, 
                                f"Response missing fields: {missing_fields}", data)
                    return False
                
                # Verify coach name is returned as "Titan"
                if data.get('coach') != 'Titan':
                    self.log_test("Coach Chat - Form Tip", False, 
                                f"Expected coach 'Titan', got '{data.get('coach')}'", data)
                    return False
                
                # Verify response is short and actionable (1-3 bullet points max due to in_workout mode)
                response_text = data.get('response', '')
                bullet_count = response_text.count('•') + response_text.count('-') + response_text.count('*')
                
                if len(response_text) > 400:  # Should be concise for in-workout
                    self.log_test("Coach Chat - Form Tip", False, 
                                f"Form tip too long for in-workout mode: {len(response_text)} chars", 
                                {"response_length": len(response_text)})
                    return False
                
                self.log_test("Coach Chat - Form Tip", True, 
                            f"Coach provided concise squat form tips ({len(response_text)} chars)")
                return True
            else:
                self.log_test("Coach Chat - Form Tip", False, 
                            f"Chat failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Coach Chat - Form Tip", False, f"Chat error: {str(e)}")
            return False
    
    def test_coach_chat_rest_time(self) -> bool:
        """Test 4: Coach Chat with Workout Context (Rest Time)"""
        try:
            # Test data as specified in review request
            chat_data = {
                "message": "How long should I rest between sets?",
                "coach": "titan",
                "workoutContext": {
                    "currentExercise": {
                        "name": "Deadlift",
                        "sets": 5,
                        "reps": 5,
                        "restTime": 180
                    },
                    "userIntentHint": "in_workout"
                }
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                required_fields = ['response', 'coach']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Coach Chat - Rest Time", False, 
                                f"Response missing fields: {missing_fields}", data)
                    return False
                
                # Verify coach name is returned as "Titan"
                if data.get('coach') != 'Titan':
                    self.log_test("Coach Chat - Rest Time", False, 
                                f"Expected coach 'Titan', got '{data.get('coach')}'", data)
                    return False
                
                # Verify response is concise rest time guidance
                response_text = data.get('response', '')
                if len(response_text) > 300:  # Should be concise for in-workout
                    self.log_test("Coach Chat - Rest Time", False, 
                                f"Rest time guidance too long for in-workout mode: {len(response_text)} chars", 
                                {"response_length": len(response_text)})
                    return False
                
                self.log_test("Coach Chat - Rest Time", True, 
                            f"Coach provided concise rest time guidance ({len(response_text)} chars)")
                return True
            else:
                self.log_test("Coach Chat - Rest Time", False, 
                            f"Chat failed with status {response.status_code}",
                            {"response": response.text})
                return False
            
        except Exception as e:
            self.log_test("Coach Chat - Rest Time", False, f"Rest time error: {str(e)}")
            return False
    
    def test_coach_chat_without_workout_context(self) -> bool:
        """Test 5: Coach Chat WITHOUT Workout Context (Should still work)"""
        try:
            # Test data as specified in review request
            chat_data = {
                "message": "What's a good warm-up routine?",
                "coach": "titan"
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                required_fields = ['response', 'coach']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Coach Chat - Without Context", False, 
                                f"Response missing fields: {missing_fields}", data)
                    return False
                
                # Verify coach name is returned as "Titan"
                if data.get('coach') != 'Titan':
                    self.log_test("Coach Chat - Without Context", False, 
                                f"Expected coach 'Titan', got '{data.get('coach')}'", data)
                    return False
                
                # Verify response is longer and more detailed than in-workout mode
                response_text = data.get('response', '')
                if len(response_text) < 100:  # Should be more detailed without workout context
                    self.log_test("Coach Chat - Without Context", False, 
                                f"Response too short for normal mode: {len(response_text)} chars", 
                                {"response_length": len(response_text)})
                    return False
                
                self.log_test("Coach Chat - Without Context", True, 
                            f"Coach provided detailed warm-up guidance ({len(response_text)} chars)")
                return True
            else:
                self.log_test("Coach Chat - Without Context", False, 
                            f"Chat failed with status {response.status_code}",
                            {"response": response.text})
                return False
            
        except Exception as e:
            self.log_test("Coach Chat - Without Context", False, f"Chat error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Thryvin API tests as specified in review request"""
        print("🏋️ Starting Thryvin Fitness App Backend Testing - Phase 8: Floating AI Coach inside Workout Hub")
        print("Testing scenarios from review request:")
        print("1. Health Check Endpoint")
        print("2. Coach Chat with Workout Context (Weight Question)")
        print("3. Coach Chat with Workout Context (Form Tip)")
        print("4. Coach Chat with Workout Context (Rest Time)")
        print("5. Coach Chat WITHOUT Workout Context (Should still work)")
        print("=" * 60)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 1: Health Endpoint
        print("\n💚 Test 1: Health Check Endpoint...")
        health_success = self.test_health_endpoint()
        
        # Authentication for coach tests
        print("\n🔐 Authenticating test user for coach tests...")
        auth_success = self.authenticate_test_user()
        
        if not auth_success:
            print("❌ Authentication failed - skipping coach tests")
            return False
        
        # Test 2: Coach Chat - Weight Question
        print("\n🏋️ Test 2: Coach Chat with Workout Context (Weight Question)...")
        weight_chat_success = self.test_coach_chat_weight_question()
        
        # Test 3: Coach Chat - Form Tip
        print("\n🎯 Test 3: Coach Chat with Workout Context (Form Tip)...")
        form_chat_success = self.test_coach_chat_form_tip()
        
        # Test 4: Coach Chat - Rest Time
        print("\n⏱️ Test 4: Coach Chat with Workout Context (Rest Time)...")
        rest_chat_success = self.test_coach_chat_rest_time()
        
        # Test 5: Coach Chat - Without Context
        print("\n💬 Test 5: Coach Chat WITHOUT Workout Context...")
        normal_chat_success = self.test_coach_chat_without_workout_context()
        
        print("\n" + "=" * 60)
        print("🏁 Phase 8 Floating AI Coach Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All Phase 8 Floating AI Coach backend tests passed!")
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