#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App
Tests the specific endpoints mentioned in the review request:
1. Health Check - GET /api/health
2. Create NEW User Account - POST /api/auth/register
3. Workout Generation API - POST /api/workouts/generate
4. Login with Existing Test Account - POST /api/login
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use the production URL from review request
BASE_URL = "https://workout-companion-23.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials from review request
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

# New user credentials for registration test
NEW_USER_EMAIL = "newuser123@test.com"
NEW_USER_PASSWORD = "password123"

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
        """Test the health endpoint - GET /api/health"""
        try:
            response = self.session.get(f"{API_BASE}/health")
            
            if response.status_code == 200:
                health_data = response.json()
                
                # Check for expected fields from review request
                expected_fields = ['ok', 'aiReady']
                missing_fields = [field for field in expected_fields if field not in health_data]
                
                if missing_fields:
                    self.log_test("Health Check", False, f"Missing expected fields: {missing_fields}", health_data)
                    return False
                
                # Check that ok and aiReady are both true
                if health_data.get('ok') and health_data.get('aiReady'):
                    self.log_test("Health Check", True, "Server is healthy with AI ready", health_data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Health check shows issues: ok={health_data.get('ok')}, aiReady={health_data.get('aiReady')}", health_data)
                    return False
                    
            else:
                self.log_test("Health Check", False, f"Health check failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Health check error: {str(e)}")
            return False
    
    def test_new_user_registration(self) -> bool:
        """Test creating a NEW user account - POST /api/auth/register"""
        try:
            # Use timestamp to ensure unique email
            timestamp = int(time.time())
            unique_email = f"newuser{timestamp}@test.com"
            
            registration_data = {
                "name": "Test New User",
                "email": unique_email,
                "password": NEW_USER_PASSWORD,
                "fitnessGoals": ["Build muscle"],
                "experience": "intermediate",
                "trainingDays": "5",
                "sessionDuration": "45"
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=registration_data)
            
            if response.status_code == 201:
                user_data = response.json()
                
                # Check for expected response structure
                if 'user' in user_data and user_data.get('ok'):
                    user = user_data['user']
                    
                    # Verify user has fresh data (no old streaks/awards)
                    if user.get('email') == unique_email and user.get('name') == "Test New User":
                        self.log_test("New User Registration", True, 
                                    f"Successfully created new user: {unique_email}")
                        return True
                    else:
                        self.log_test("New User Registration", False, 
                                    "User data doesn't match registration input", user_data)
                        return False
                else:
                    self.log_test("New User Registration", False, 
                                "Registration response missing user object or ok flag", user_data)
                    return False
            else:
                self.log_test("New User Registration", False, 
                            f"Registration failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("New User Registration", False, f"Registration error: {str(e)}")
            return False
    
    def test_workout_generation_endpoint(self) -> bool:
        """Test POST /api/workouts/generate - Critical fix verification"""
        try:
            # Use exact payload from review request
            workout_data = {
                "userProfile": {
                    "fitnessGoals": ["Build muscle"],
                    "experience": "intermediate",
                    "trainingDays": "5",
                    "sessionDuration": "45"
                },
                "dayOfWeek": 0
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json=workout_data)
            
            # The critical test: should NOT return 500 error
            if response.status_code == 500:
                self.log_test("Workout Generation", False, 
                            "CRITICAL: Workout generation returned 500 error (bug not fixed)",
                            {"response": response.text})
                return False
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected workout structure
                required_fields = ['title', 'exercises']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Workout Generation", False, 
                                f"Response missing required fields: {missing_fields}",
                                {"response_keys": list(data.keys())})
                    return False
                
                # Verify exercises is an array
                if not isinstance(data.get('exercises'), list):
                    self.log_test("Workout Generation", False, 
                                "Exercises should be an array",
                                {"exercises_type": type(data.get('exercises'))})
                    return False
                
                self.log_test("Workout Generation", True, 
                            f"Generated workout '{data.get('title')}' with {len(data.get('exercises', []))} exercises")
                return True
            else:
                self.log_test("Workout Generation", False, 
                            f"Unexpected status code {response.status_code}",
                            {"response": response.text})
                return False
            
        except Exception as e:
            self.log_test("Workout Generation", False, f"Error: {str(e)}")
            return False
    
    def test_existing_user_login(self) -> bool:
        """Test login with existing test account - POST /api/login"""
        try:
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            # Note: Based on auth.ts, the endpoint is /api/login, not /api/auth/login
            response = self.session.post(f"{API_BASE}/login", json=login_data)
            
            if response.status_code == 200:
                user_data = response.json()
                
                # Check for expected response structure
                if 'user' in user_data and user_data.get('ok'):
                    user = user_data['user']
                    self.user_id = user.get('id')
                    self.log_test("Existing User Login", True, 
                                f"Successfully logged in as {TEST_EMAIL}")
                    return True
                else:
                    self.log_test("Existing User Login", False, 
                                "Login response missing user object or ok flag", user_data)
                    return False
            else:
                self.log_test("Existing User Login", False, 
                            f"Login failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Existing User Login", False, f"Login error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all Thryvin API tests for endpoints specified in review request"""
        print("🏋️ Starting Thryvin Fitness App API Testing Suite")
        print("Testing endpoints from review request:")
        print("1. Health Check - GET /api/health")
        print("2. Create NEW User Account - POST /api/auth/register")
        print("3. Workout Generation API - POST /api/workouts/generate")
        print("4. Login with Existing Test Account - POST /api/login")
        print("=" * 60)
        
        # Test 1: Health Check
        print("\n💚 Test 1: Health Check...")
        health_success = self.test_health_endpoint()
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 2: Create NEW User Account
        print("\n👤 Test 2: Create NEW User Account...")
        registration_success = self.test_new_user_registration()
        
        # Test 3: Workout Generation (Critical P0 fix verification)
        print("\n🤖 Test 3: Workout Generation (Critical Fix Verification)...")
        workout_success = self.test_workout_generation_endpoint()
        
        # Test 4: Login with Existing Test Account
        print("\n🔐 Test 4: Login with Existing Test Account...")
        login_success = self.test_existing_user_login()
        
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