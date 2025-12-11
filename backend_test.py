#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App
Tests the newly implemented features: AI Coach, Log Set, and Advanced Questionnaire endpoints.
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

# Test credentials from review request
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

# Test configuration
EXPECTED_EXERCISE_COUNT = 1819
EXPECTED_VIDEO_COVERAGE = 100

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
        """Test the health endpoint to verify server is running"""
        try:
            response = self.session.get(f"{API_BASE}/health")
            
            if response.status_code == 200:
                health_data = response.json()
                self.log_test("Health Check", True, "Server is healthy", health_data)
                return True
            elif response.status_code == 503:
                # Server is running but in degraded state - continue testing
                health_data = response.json()
                self.log_test("Health Check", True, "Server is running (degraded status - continuing tests)", health_data)
                return True
            else:
                self.log_test("Health Check", False, f"Health check failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Health check error: {str(e)}")
            return False
    
    def authenticate_user(self) -> bool:
        """Authenticate with test credentials"""
        try:
            # First try to login using the main login endpoint
            login_data = {
                "email": TEST_EMAIL,  # passport-local is configured to use 'email' field
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{API_BASE}/login", json=login_data)  # Use JSON
            
            if response.status_code == 200:
                user_data = response.json()
                self.user_id = user_data.get('user', {}).get('id')
                self.log_test("Authentication", True, f"Successfully logged in as {TEST_EMAIL}")
                return True
            else:
                # Try to register if login fails
                register_data = {
                    "name": "Test User",
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD
                }
                
                register_response = self.session.post(f"{API_BASE}/register", json=register_data)
                
                if register_response.status_code == 200 or register_response.status_code == 201:
                    # Now try login again
                    login_response = self.session.post(f"{API_BASE}/login", json=login_data)
                    if login_response.status_code == 200:
                        user_data = login_response.json()
                        self.user_id = user_data.get('user', {}).get('id')
                        self.log_test("Authentication", True, f"Registered and logged in as {TEST_EMAIL}")
                        return True
                
                self.log_test("Authentication", False, f"Failed to authenticate: {response.status_code}",
                            {"login_response": response.text, "register_response": register_response.text if 'register_response' in locals() else None})
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_ai_coach_fitness_question(self) -> bool:
        """Test AI Coach with fitness question - should get helpful response"""
        try:
            chat_data = {
                "message": "How do I improve my squat form?",
                "coach": "kai",
                "trainingType": "strength",
                "coachingStyle": "supportive"
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code != 200:
                self.log_test("AI Coach - Fitness Question", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            if 'response' not in data:
                self.log_test("AI Coach - Fitness Question", False, 
                            "Response missing 'response' field",
                            {"response_keys": list(data.keys())})
                return False
            
            coach_response = data['response']
            
            # Check that response is helpful and fitness-related
            if len(coach_response) < 50:
                self.log_test("AI Coach - Fitness Question", False, 
                            "Response too short for a helpful fitness answer",
                            {"response": coach_response})
                return False
            
            # Check for fitness-related keywords in response
            fitness_keywords = ['squat', 'form', 'technique', 'exercise', 'training', 'workout', 'muscle']
            has_fitness_content = any(keyword.lower() in coach_response.lower() for keyword in fitness_keywords)
            
            if not has_fitness_content:
                self.log_test("AI Coach - Fitness Question", False, 
                            "Response doesn't contain fitness-related content",
                            {"response": coach_response})
                return False
            
            self.log_test("AI Coach - Fitness Question", True, 
                        f"Got helpful fitness response ({len(coach_response)} chars)")
            return True
            
        except Exception as e:
            self.log_test("AI Coach - Fitness Question", False, f"Error: {str(e)}")
            return False
    
    def test_ai_coach_non_fitness_question(self) -> bool:
        """Test AI Coach with non-fitness question - should get polite redirect"""
        try:
            chat_data = {
                "message": "Can squirrels fly?",
                "coach": "kai",
                "trainingType": "strength",
                "coachingStyle": "supportive"
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code != 200:
                self.log_test("AI Coach - Non-Fitness Question", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            coach_response = data.get('response', '')
            
            # Check for polite redirect keywords
            redirect_keywords = ['fitness', 'coach', 'workout', 'health', 'training', 'help you with']
            has_redirect = any(keyword.lower() in coach_response.lower() for keyword in redirect_keywords)
            
            # Should NOT contain information about squirrels
            contains_squirrel_info = 'fly' in coach_response.lower() and 'squirrel' in coach_response.lower() and 'glide' in coach_response.lower()
            
            if not has_redirect:
                self.log_test("AI Coach - Non-Fitness Question", False, 
                            "Response doesn't contain fitness redirect",
                            {"response": coach_response})
                return False
            
            if contains_squirrel_info:
                self.log_test("AI Coach - Non-Fitness Question", False, 
                            "Response contains non-fitness information about squirrels",
                            {"response": coach_response})
                return False
            
            self.log_test("AI Coach - Non-Fitness Question", True, 
                        "Got appropriate redirect to fitness topics")
            return True
            
        except Exception as e:
            self.log_test("AI Coach - Non-Fitness Question", False, f"Error: {str(e)}")
            return False
    
    def test_ai_coach_capital_question(self) -> bool:
        """Test AI Coach with 'What is the capital of France?' - should get polite redirect"""
        try:
            chat_data = {
                "message": "What is the capital of France?",
                "coach": "kai",
                "trainingType": "strength",
                "coachingStyle": "supportive"
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code != 200:
                self.log_test("AI Coach - Capital Question", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            coach_response = data.get('response', '')
            
            # Check for polite redirect keywords
            redirect_keywords = ['fitness', 'coach', 'workout', 'health', 'training']
            has_redirect = any(keyword.lower() in coach_response.lower() for keyword in redirect_keywords)
            
            # Should NOT contain information about Paris/France
            contains_geography_info = 'paris' in coach_response.lower() or ('france' in coach_response.lower() and 'capital' in coach_response.lower())
            
            if not has_redirect:
                self.log_test("AI Coach - Capital Question", False, 
                            "Response doesn't contain fitness redirect",
                            {"response": coach_response})
                return False
            
            if contains_geography_info:
                self.log_test("AI Coach - Capital Question", False, 
                            "Response contains geography information",
                            {"response": coach_response})
                return False
            
            self.log_test("AI Coach - Capital Question", True, 
                        "Got appropriate redirect to fitness topics")
            return True
            
        except Exception as e:
            self.log_test("AI Coach - Capital Question", False, f"Error: {str(e)}")
            return False
    
    def test_ai_coach_greeting(self) -> bool:
        """Test AI Coach with greeting - should get friendly fitness-focused welcome"""
        try:
            chat_data = {
                "message": "Hi!",
                "coach": "kai",
                "trainingType": "strength",
                "coachingStyle": "supportive"
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code != 200:
                self.log_test("AI Coach - Greeting", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            coach_response = data.get('response', '')
            
            # Check for friendly greeting response
            greeting_keywords = ['hello', 'hi', 'welcome', 'great', 'help']
            fitness_keywords = ['fitness', 'workout', 'training', 'exercise', 'goals']
            
            has_greeting = any(keyword.lower() in coach_response.lower() for keyword in greeting_keywords)
            has_fitness_focus = any(keyword.lower() in coach_response.lower() for keyword in fitness_keywords)
            
            if not has_greeting:
                self.log_test("AI Coach - Greeting", False, 
                            "Response doesn't contain friendly greeting",
                            {"response": coach_response})
                return False
            
            if not has_fitness_focus:
                self.log_test("AI Coach - Greeting", False, 
                            "Response doesn't focus on fitness topics",
                            {"response": coach_response})
                return False
            
            self.log_test("AI Coach - Greeting", True, 
                        "Got friendly fitness-focused welcome")
            return True
            
        except Exception as e:
            self.log_test("AI Coach - Greeting", False, f"Error: {str(e)}")
            return False
    
    def test_log_set_endpoint(self) -> bool:
        """Test POST /api/workout/log-set - requires authentication"""
        try:
            if not self.user_id:
                self.log_test("Log Set Endpoint", False, "User not authenticated")
                return False
            
            set_data = {
                "exerciseName": "Bench Press",
                "setNumber": 1,
                "weight": 135,
                "reps": 10,
                "note": "Felt strong today"
            }
            
            response = self.session.post(f"{API_BASE}/workout/log-set", json=set_data)
            
            if response.status_code != 200:
                self.log_test("Log Set Endpoint", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            if not data.get('success'):
                self.log_test("Log Set Endpoint", False, 
                            "Response doesn't indicate success",
                            {"response": data})
                return False
            
            # Check that response contains expected fields
            expected_fields = ['success']
            missing_fields = [field for field in expected_fields if field not in data]
            if missing_fields:
                self.log_test("Log Set Endpoint", False, 
                            f"Response missing fields: {missing_fields}",
                            {"response": data})
                return False
            
            self.log_test("Log Set Endpoint", True, 
                        f"Successfully logged set: {set_data['exerciseName']} {set_data['weight']}kg x {set_data['reps']}")
            return True
            
        except Exception as e:
            self.log_test("Log Set Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_advanced_questionnaire_endpoint(self) -> bool:
        """Test POST /api/user/advanced-questionnaire - requires authentication"""
        try:
            if not self.user_id:
                self.log_test("Advanced Questionnaire Endpoint", False, "User not authenticated")
                return False
            
            questionnaire_data = {
                "targets": "10K race in 3 months",
                "enjoyedTraining": "Weight lifting, HIIT",
                "dislikedTraining": "Long cardio"
            }
            
            response = self.session.post(f"{API_BASE}/user/advanced-questionnaire", json=questionnaire_data)
            
            if response.status_code != 200:
                self.log_test("Advanced Questionnaire Endpoint", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            if not data.get('success'):
                self.log_test("Advanced Questionnaire Endpoint", False, 
                            "Response doesn't indicate success",
                            {"response": data})
                return False
            
            self.log_test("Advanced Questionnaire Endpoint", True, 
                        "Successfully saved advanced questionnaire")
            return True
            
        except Exception as e:
            self.log_test("Advanced Questionnaire Endpoint", False, f"Error: {str(e)}")
            return False
    
    # Removed old test methods - replaced with new feature tests above
    def run_all_tests(self):
        """Run all Thryvin API tests for newly implemented features"""
        print("🏋️ Starting Thryvin Fitness App API Testing Suite")
        print("=" * 60)
        
        # Test server health first
        if not self.test_health_endpoint():
            print("❌ Server health check failed. Aborting tests.")
            return False
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test authentication
        print("\n🔐 Authentication Test...")
        if not self.authenticate_user():
            print("❌ Authentication failed. Cannot test authenticated endpoints.")
            return False
        
        # Test 1: AI Coach Fitness Question
        print("\n🤖 Test 1: AI Coach - Fitness Question...")
        self.test_ai_coach_fitness_question()
        
        # Test 2: AI Coach Non-Fitness Question
        print("\n🚫 Test 2: AI Coach - Non-Fitness Question (Squirrels)...")
        self.test_ai_coach_non_fitness_question()
        
        # Test 3: AI Coach Capital Question
        print("\n🌍 Test 3: AI Coach - Capital Question...")
        self.test_ai_coach_capital_question()
        
        # Test 4: AI Coach Greeting
        print("\n👋 Test 4: AI Coach - Greeting...")
        self.test_ai_coach_greeting()
        
        # Test 5: Log Set Endpoint
        print("\n📝 Test 5: Log Set Endpoint...")
        self.test_log_set_endpoint()
        
        # Test 6: Advanced Questionnaire Endpoint
        print("\n📋 Test 6: Advanced Questionnaire Endpoint...")
        self.test_advanced_questionnaire_endpoint()
        
        print("\n" + "=" * 60)
        print("🏁 Thryvin API Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All Thryvin API tests passed!")
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