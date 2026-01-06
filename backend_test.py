#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin AI Fitness App - QA Login JSON Response Reliability Tests
Tests the CRITICAL QA login endpoints for JSON response reliability:
1. QA Login - Beginner (10 consecutive times) - POST /api/qa/login-as
2. QA Login - Intermediate - POST /api/qa/login-as  
3. QA Login - Injury - POST /api/qa/login-as
4. QA Login - Invalid Profile - POST /api/qa/login-as (should return 400 with INVALID_PROFILE)
5. QA Login - Empty Body - POST /api/qa/login-as (should return 400 JSON error)
6. QA Reset User - POST /api/qa/reset-user
7. QA Profiles List - GET /api/qa/profiles

CRITICAL CHECK: Every single response must be valid JSON with Content-Type application/json. NO HTML responses allowed.
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

class ThryvinQALoginJSONTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        
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
    
    def test_qa_login_beginner_10x(self) -> bool:
        """Test QA Login - Beginner Profile (10 consecutive times)"""
        print("🔄 Running QA Login Beginner test 10 consecutive times...")
        
        success_count = 0
        for i in range(1, 11):
            try:
                response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "beginner"})
                
                # Verify JSON response
                is_json, data = self.verify_json_response(response, f"QA Login Beginner #{i}")
                if not is_json:
                    continue
                
                if response.status_code == 200:
                    # Check required fields
                    if not data.get('ok'):
                        self.log_test(f"QA Login Beginner #{i}", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                        continue
                    
                    if 'accessToken' not in data:
                        self.log_test(f"QA Login Beginner #{i}", False, "Missing accessToken in response")
                        continue
                    
                    self.log_test(f"QA Login Beginner #{i}", True, "Successfully logged in as beginner with JSON response")
                    success_count += 1
                else:
                    self.log_test(f"QA Login Beginner #{i}", False, f"Login failed with status {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"QA Login Beginner #{i}", False, f"Login error: {str(e)}")
        
        # Overall result
        if success_count == 10:
            self.log_test("QA Login Beginner 10x", True, f"All 10/10 consecutive logins successful with JSON responses")
            return True
        else:
            self.log_test("QA Login Beginner 10x", False, f"Only {success_count}/10 consecutive logins successful")
            return False
    
    def test_qa_login_intermediate(self) -> bool:
        """Test QA Login - Intermediate Profile"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "intermediate"})
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "QA Login Intermediate")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Login Intermediate", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                if 'accessToken' not in data:
                    self.log_test("QA Login Intermediate", False, "Missing accessToken in response")
                    return False
                
                self.log_test("QA Login Intermediate", True, "Successfully logged in as intermediate with JSON response")
                return True
            else:
                self.log_test("QA Login Intermediate", False, f"Login failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Login Intermediate", False, f"Login error: {str(e)}")
            return False
    
    def test_qa_login_injury(self) -> bool:
        """Test QA Login - Injury Profile"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "injury"})
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "QA Login Injury")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Login Injury", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                if 'accessToken' not in data:
                    self.log_test("QA Login Injury", False, "Missing accessToken in response")
                    return False
                
                self.log_test("QA Login Injury", True, "Successfully logged in as injury profile with JSON response")
                return True
            else:
                self.log_test("QA Login Injury", False, f"Login failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Login Injury", False, f"Login error: {str(e)}")
            return False
    
    def test_qa_login_invalid_profile(self) -> bool:
        """Test QA Login - Invalid Profile (should return 400 with INVALID_PROFILE)"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={"profile": "invalid"})
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "QA Login Invalid Profile")
            if not is_json:
                return False
            
            # Should return 400 status
            if response.status_code == 400:
                # Check that ok=false
                if data.get('ok') is False:
                    # Check for INVALID_PROFILE code
                    error_code = data.get('code')
                    if error_code == 'INVALID_PROFILE':
                        self.log_test("QA Login Invalid Profile", True, "Correctly rejected invalid profile with INVALID_PROFILE code")
                        return True
                    else:
                        self.log_test("QA Login Invalid Profile", False, f"Expected code=INVALID_PROFILE, got code={error_code}")
                        return False
                else:
                    self.log_test("QA Login Invalid Profile", False, f"Expected ok=false for invalid profile, got ok={data.get('ok')}")
                    return False
            else:
                self.log_test("QA Login Invalid Profile", False, f"Expected 400 status for invalid profile, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Login Invalid Profile", False, f"Invalid profile test error: {str(e)}")
            return False
    
    def test_qa_login_empty_body(self) -> bool:
        """Test QA Login - Empty Body (should return 400 JSON error, never HTML)"""
        try:
            response = self.session.post(f"{API_BASE}/qa/login-as", json={})
            
            # Verify JSON response (CRITICAL - must never be HTML)
            is_json, data = self.verify_json_response(response, "QA Login Empty Body")
            if not is_json:
                return False
            
            # Should return 400 status
            if response.status_code == 400:
                # Check that ok=false
                if data.get('ok') is False:
                    self.log_test("QA Login Empty Body", True, "Correctly rejected empty body with JSON error response")
                    return True
                else:
                    self.log_test("QA Login Empty Body", False, f"Expected ok=false for empty body, got ok={data.get('ok')}")
                    return False
            else:
                self.log_test("QA Login Empty Body", False, f"Expected 400 status for empty body, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Login Empty Body", False, f"Empty body test error: {str(e)}")
            return False
    
    def test_qa_reset_user(self) -> bool:
        """Test QA Reset User"""
        try:
            response = self.session.post(f"{API_BASE}/qa/reset-user", json={"email": "qa_beginner@thryvin.test"})
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "QA Reset User")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check required fields
                if not data.get('ok'):
                    self.log_test("QA Reset User", False, f"Response ok=false: {data.get('error', 'Unknown error')}")
                    return False
                
                self.log_test("QA Reset User", True, "Successfully reset user with JSON response")
                return True
            else:
                self.log_test("QA Reset User", False, f"Reset failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Reset User", False, f"Reset error: {str(e)}")
            return False
    
    def test_qa_profiles_list(self) -> bool:
        """Test QA Profiles List"""
        try:
            response = self.session.get(f"{API_BASE}/qa/profiles")
            
            # Verify JSON response
            is_json, data = self.verify_json_response(response, "QA Profiles List")
            if not is_json:
                return False
            
            if response.status_code == 200:
                # Check for profiles array
                if 'profiles' not in data:
                    self.log_test("QA Profiles List", False, "Missing profiles array in response")
                    return False
                
                profiles = data['profiles']
                if not isinstance(profiles, list):
                    self.log_test("QA Profiles List", False, f"Expected profiles to be array, got {type(profiles)}")
                    return False
                
                # Check for required profiles
                expected_profiles = ['beginner', 'intermediate', 'injury']
                for profile in expected_profiles:
                    if profile not in profiles:
                        self.log_test("QA Profiles List", False, f"Missing required profile '{profile}' in profiles list")
                        return False
                
                self.log_test("QA Profiles List", True, f"Successfully retrieved profiles list with JSON response: {profiles}")
                return True
            else:
                self.log_test("QA Profiles List", False, f"Profiles list failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("QA Profiles List", False, f"Profiles list error: {str(e)}")
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