#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin AI Fitness App - Coach Action System
Tests the specific scenarios mentioned in the review request:
1. Health Check (GET /api/health)
2. Coach Chat API (POST /api/coach/chat)
3. Learning Events API (POST /api/learning/event) - if available
4. User Tendencies API (GET /api/learning/tendencies) - if available

Focus: Coach action system for React Native Expo app with Node.js/TypeScript backend
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use local backend URL since external URL is down
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

class ThryvinAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        # Enable cookie handling
        self.session.cookies.clear()
        self.test_results = []
        self.authenticated = False
        self.test_user_email = f"test_coach_{int(time.time())}@thryvin.test"
        self.test_user_password = "testpass123"
        self.user_id = None
        
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
        """Create and authenticate a test user for coach system testing"""
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
                login_result = login_response.json()
                self.authenticated = True
                # Extract user ID if available
                if 'user' in login_result and 'id' in login_result['user']:
                    self.user_id = login_result['user']['id']
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
    
    def test_coach_chat_api(self) -> bool:
        """Test Coach Chat API with arms workout request"""
        try:
            # Test coach chat with the specific message from review request
            chat_data = {
                "message": "Add an arms workout today",
                "coach": "titan"
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                required_fields = ['response', 'coach']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Coach Chat API", False, 
                                f"Response missing fields: {missing_fields}", data)
                    return False
                
                # Verify coach name is returned
                if data.get('coach') != 'Titan':
                    self.log_test("Coach Chat API", False, 
                                f"Expected coach 'Titan', got '{data.get('coach')}'", data)
                    return False
                
                # Verify response contains arms workout related content
                response_text = data.get('response', '').lower()
                arms_keywords = ['arms', 'arm', 'bicep', 'tricep', 'workout', 'exercise', 'add', 'today']
                
                if any(keyword in response_text for keyword in arms_keywords):
                    self.log_test("Coach Chat API", True, 
                                f"Coach provided appropriate arms workout response")
                    return True
                else:
                    self.log_test("Coach Chat API", False, 
                                "Coach response doesn't seem to address arms workout request",
                                {"response_preview": response_text[:200]})
                    return False
            else:
                self.log_test("Coach Chat API", False, 
                            f"Coach chat failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Coach Chat API", False, f"Coach chat error: {str(e)}")
            return False
    
    def test_learning_events_api(self) -> bool:
        """Test Learning Events API (if available)"""
        try:
            # Test logging a simple learning event
            event_data = {
                "eventType": "workout_completed",
                "contextMode": "post_workout",
                "topic": "arms_workout",
                "payload": {
                    "workoutType": "arms",
                    "duration": 30,
                    "exercises_completed": 4
                }
            }
            
            response = self.session.post(f"{API_BASE}/learning/event", json=event_data)
            
            if response.status_code == 200:
                self.log_test("Learning Events API", True, 
                            "Successfully logged learning event")
                return True
            elif response.status_code == 404:
                self.log_test("Learning Events API", True, 
                            "Learning Events API not available (404) - this is expected")
                return True
            else:
                self.log_test("Learning Events API", False, 
                            f"Learning events failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Learning Events API", False, f"Learning events error: {str(e)}")
            return False
    
    def test_user_tendencies_api(self) -> bool:
        """Test User Tendencies API (if available)"""
        try:
            response = self.session.get(f"{API_BASE}/learning/tendencies")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("User Tendencies API", True, 
                            f"Successfully retrieved user tendencies")
                return True
            elif response.status_code == 404:
                self.log_test("User Tendencies API", True, 
                            "User Tendencies API not available (404) - this is expected")
                return True
            else:
                self.log_test("User Tendencies API", False, 
                            f"Tendencies API failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("User Tendencies API", False, f"Tendencies API error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Thryvin API tests as specified in review request"""
        print("🏋️ Starting Thryvin AI Fitness App Backend Testing - Coach Action System")
        print("Testing scenarios from review request:")
        print("1. Health Check (GET /api/health)")
        print("2. Coach Chat API (POST /api/coach/chat)")
        print("3. Learning Events API (POST /api/learning/event) - if available")
        print("4. User Tendencies API (GET /api/learning/tendencies) - if available")
        print("=" * 60)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 1: Health Endpoint
        print("\n💚 Test 1: Health Check Endpoint...")
        health_success = self.test_health_endpoint()
        
        # Authentication for protected endpoints
        print("\n🔐 Authenticating test user for protected endpoints...")
        auth_success = self.authenticate_test_user()
        
        if not auth_success:
            print("❌ Authentication failed - testing coach chat without auth")
        
        # Test 2: Coach Chat API
        print("\n🤖 Test 2: Coach Chat API...")
        chat_success = self.test_coach_chat_api()
        
        # Test 3: Learning Events API (optional)
        print("\n📚 Test 3: Learning Events API (if available)...")
        events_success = self.test_learning_events_api()
        
        # Test 4: User Tendencies API (optional)
        print("\n🧠 Test 4: User Tendencies API (if available)...")
        tendencies_success = self.test_user_tendencies_api()
        
        print("\n" + "=" * 60)
        print("🏁 Coach Action System Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All Coach Action System backend tests passed!")
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