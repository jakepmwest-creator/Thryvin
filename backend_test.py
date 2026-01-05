#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin AI Fitness App - Fast Tester Login System
Tests the specific scenarios mentioned in the review request:
1. QA Login - Beginner Profile (POST /api/qa/login-as)
2. QA Login - Intermediate Profile (POST /api/qa/login-as)
3. QA Login - Injury Profile (POST /api/qa/login-as)
4. QA Reset User (POST /api/qa/reset-user)
5. QA Regenerate Plan (POST /api/qa/regenerate-plan)
6. Invalid Profile Handling (POST /api/qa/login-as)
7. Use Access Token (GET /api/auth/me)

Focus: Fast Tester Login system for QA testing
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

class ThryvinQALoginTester:
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
        """Run all Fast Tester Login QA tests as specified in review request"""
        print("🏋️ Starting Thryvin AI Fitness App Backend Testing - Fast Tester Login System")
        print("Testing scenarios from review request:")
        print("1. QA Login - Beginner Profile (POST /api/qa/login-as)")
        print("2. QA Login - Intermediate Profile (POST /api/qa/login-as)")
        print("3. QA Login - Injury Profile (POST /api/qa/login-as)")
        print("4. QA Reset User (POST /api/qa/reset-user)")
        print("5. QA Regenerate Plan (POST /api/qa/regenerate-plan)")
        print("6. Invalid Profile Handling (POST /api/qa/login-as)")
        print("7. Use Access Token (GET /api/auth/me)")
        print("=" * 60)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 1: QA Login - Beginner Profile
        print("\n👶 Test 1: QA Login - Beginner Profile...")
        beginner_success = self.test_qa_login_beginner()
        
        # Test 2: QA Login - Intermediate Profile
        print("\n💪 Test 2: QA Login - Intermediate Profile...")
        intermediate_success = self.test_qa_login_intermediate()
        
        # Test 3: QA Login - Injury Profile
        print("\n🏥 Test 3: QA Login - Injury Profile...")
        injury_success = self.test_qa_login_injury()
        
        # Test 4: QA Reset User
        print("\n🔄 Test 4: QA Reset User...")
        reset_success = self.test_qa_reset_user()
        
        # Test 5: QA Regenerate Plan
        print("\n🔄 Test 5: QA Regenerate Plan...")
        regenerate_success = self.test_qa_regenerate_plan()
        
        # Test 6: Invalid Profile Handling
        print("\n❌ Test 6: Invalid Profile Handling...")
        invalid_success = self.test_invalid_profile_handling()
        
        # Test 7: Use Access Token
        print("\n🔑 Test 7: Use Access Token...")
        token_success = self.test_use_access_token()
        
        print("\n" + "=" * 60)
        print("🏁 Fast Tester Login System Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All Fast Tester Login System backend tests passed!")
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
    tester = ThryvinQALoginTester()
    
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