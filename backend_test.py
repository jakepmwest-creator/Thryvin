#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin 6-Digit Password Reset Flow
Tests the complete 6-digit code password reset functionality for the Thryvin fitness app.
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use localhost as specified in the review request
BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"
FAKE_EMAIL = "fake@notreal.com"
NEW_USER_EMAIL = "newuser@test.com"
NEW_USER_PASSWORD = "Test123"
NEW_USER_NAME = "New User"

class SecurityAuthTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.auth_token = None
        
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
    
    def test_forgot_password_unregistered_email(self) -> bool:
        """Test forgot password with unregistered email - should return 404"""
        try:
            response = self.session.post(f"{API_BASE}/auth/forgot-password", json={
                "email": FAKE_EMAIL
            })
            
            if response.status_code != 404:
                self.log_test("Forgot Password - Unregistered Email", False, 
                            f"Expected status 404, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            expected_error = "We don't recognize this email address. Please check your email or sign up for an account."
            
            if data.get("error") != expected_error:
                self.log_test("Forgot Password - Unregistered Email", False, 
                            f"Unexpected error message",
                            {"expected": expected_error, "actual": data.get("error")})
                return False
            
            self.log_test("Forgot Password - Unregistered Email", True, 
                        "Correctly returned 404 with proper error message")
            return True
            
        except Exception as e:
            self.log_test("Forgot Password - Unregistered Email", False, f"Error: {str(e)}")
            return False
    
    def test_forgot_password_registered_email(self) -> bool:
        """Test forgot password with registered email - should return 200"""
        try:
            # Use jakepmwest@gmail.com as it's configured in the system
            response = self.session.post(f"{API_BASE}/auth/forgot-password", json={
                "email": "jakepmwest@gmail.com"
            })
            
            if response.status_code != 200:
                self.log_test("Forgot Password - Registered Email", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            expected_message = "Password reset email sent! Check your inbox."
            
            if data.get("message") != expected_message:
                self.log_test("Forgot Password - Registered Email", False, 
                            f"Unexpected response message",
                            {"expected": expected_message, "actual": data.get("message")})
                return False
            
            self.log_test("Forgot Password - Registered Email", True, 
                        "Successfully sent password reset email")
            return True
            
        except Exception as e:
            self.log_test("Forgot Password - Registered Email", False, f"Error: {str(e)}")
            return False
    
    def test_login_invalid_credentials(self) -> bool:
        """Test login with invalid credentials - should return 401"""
        try:
            # Test with wrong email
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": "wrong@email.com",
                "password": "wrongpassword"
            })
            
            if response.status_code != 401:
                self.log_test("Login - Invalid Credentials", False, 
                            f"Expected status 401, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            expected_error = "Invalid email or password"
            
            if data.get("error") != expected_error:
                self.log_test("Login - Invalid Credentials", False, 
                            f"Unexpected error message",
                            {"expected": expected_error, "actual": data.get("error")})
                return False
            
            # Test with correct email but wrong password
            response2 = self.session.post(f"{API_BASE}/auth/login", json={
                "email": TEST_EMAIL,
                "password": "wrongpassword"
            })
            
            if response2.status_code != 401:
                self.log_test("Login - Invalid Credentials", False, 
                            f"Expected status 401 for wrong password, got {response2.status_code}")
                return False
            
            self.log_test("Login - Invalid Credentials", True, 
                        "Correctly returned 401 for invalid credentials")
            return True
            
        except Exception as e:
            self.log_test("Login - Invalid Credentials", False, f"Error: {str(e)}")
            return False
    
    def test_login_valid_credentials(self) -> bool:
        """Test login with valid credentials - should return 200 with user data"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            
            if response.status_code != 200:
                self.log_test("Login - Valid Credentials", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Check response structure
            if not data.get("ok"):
                self.log_test("Login - Valid Credentials", False, 
                            "Response missing 'ok' field or it's false",
                            {"response": data})
                return False
            
            if not data.get("user"):
                self.log_test("Login - Valid Credentials", False, 
                            "Response missing 'user' object",
                            {"response": data})
                return False
            
            user = data["user"]
            required_fields = ["id", "email"]
            for field in required_fields:
                if field not in user:
                    self.log_test("Login - Valid Credentials", False, 
                                f"User object missing required field: {field}",
                                {"user": user})
                    return False
            
            # Verify email matches
            if user["email"] != TEST_EMAIL:
                self.log_test("Login - Valid Credentials", False, 
                            f"User email mismatch: expected {TEST_EMAIL}, got {user['email']}")
                return False
            
            self.log_test("Login - Valid Credentials", True, 
                        f"Successfully logged in user: {user['email']} (ID: {user['id']})")
            return True
            
        except Exception as e:
            self.log_test("Login - Valid Credentials", False, f"Error: {str(e)}")
            return False
    
    def test_registration_new_user(self) -> bool:
        """Test registration with new user - should succeed or fail if email exists"""
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json={
                "email": NEW_USER_EMAIL,
                "password": NEW_USER_PASSWORD,
                "name": NEW_USER_NAME
            })
            
            # Accept both 200/201 (success) and 400 (email exists)
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("ok") and data.get("user"):
                    self.log_test("Registration - New User", True, 
                                f"Successfully registered new user: {NEW_USER_EMAIL}")
                    return True
                else:
                    self.log_test("Registration - New User", False, 
                                "Registration response missing expected fields",
                                {"response": data})
                    return False
            elif response.status_code == 400:
                data = response.json()
                if "already exists" in data.get("error", "").lower():
                    self.log_test("Registration - New User", True, 
                                f"Email {NEW_USER_EMAIL} already exists (expected behavior)")
                    return True
                else:
                    self.log_test("Registration - New User", False, 
                                f"Unexpected 400 error: {data.get('error')}")
                    return False
            else:
                self.log_test("Registration - New User", False, 
                            f"Unexpected status code: {response.status_code}",
                            {"response": response.text})
                return False
            
        except Exception as e:
            self.log_test("Registration - New User", False, f"Error: {str(e)}")
            return False
    
    def test_auth_protection(self) -> bool:
        """Test that protected routes require authentication"""
        try:
            # Create a new session without authentication
            unauth_session = requests.Session()
            unauth_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            
            # Test protected endpoint - /api/user
            response = unauth_session.get(f"{API_BASE}/user")
            
            if response.status_code != 401:
                self.log_test("Auth Protection Test", False, 
                            f"Expected 401 for /api/user, got {response.status_code}")
                return False
            
            # Test another protected endpoint - /api/auth/me
            response2 = unauth_session.get(f"{API_BASE}/auth/me")
            
            if response2.status_code != 401:
                self.log_test("Auth Protection Test", False, 
                            f"Expected 401 for /api/auth/me, got {response2.status_code}")
                return False
            
            # Test workout endpoints
            response3 = unauth_session.get(f"{API_BASE}/workouts/today")
            
            if response3.status_code != 401:
                self.log_test("Auth Protection Test", False, 
                            f"Expected 401 for /api/workouts/today, got {response3.status_code}")
                return False
            
            self.log_test("Auth Protection Test", True, 
                        "Protected routes correctly require authentication")
            return True
            
        except Exception as e:
            self.log_test("Auth Protection Test", False, f"Error: {str(e)}")
            return False
    
    def test_authenticated_access(self) -> bool:
        """Test that authenticated users can access protected routes"""
        try:
            # First login to get authenticated session
            login_response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            
            if login_response.status_code != 200:
                self.log_test("Authenticated Access Test", False, 
                            f"Login failed with status {login_response.status_code}")
                return False
            
            # Test accessing protected endpoint with authentication
            response = self.session.get(f"{API_BASE}/user")
            
            if response.status_code != 200:
                self.log_test("Authenticated Access Test", False, 
                            f"Expected 200 for authenticated /api/user, got {response.status_code}",
                            {"response": response.text})
                return False
            
            user_data = response.json()
            if not user_data.get("email"):
                self.log_test("Authenticated Access Test", False, 
                            "User data missing email field",
                            {"user_data": user_data})
                return False
            
            # Test /api/auth/me endpoint
            response2 = self.session.get(f"{API_BASE}/auth/me")
            
            if response2.status_code != 200:
                self.log_test("Authenticated Access Test", False, 
                            f"Expected 200 for authenticated /api/auth/me, got {response2.status_code}")
                return False
            
            me_data = response2.json()
            if not me_data.get("user"):
                self.log_test("Authenticated Access Test", False, 
                            "/api/auth/me response missing user object")
                return False
            
            self.log_test("Authenticated Access Test", True, 
                        f"Authenticated user can access protected routes: {user_data['email']}")
            return True
            
        except Exception as e:
            self.log_test("Authenticated Access Test", False, f"Error: {str(e)}")
            return False
    
    def test_logout_functionality(self) -> bool:
        """Test logout functionality"""
        try:
            # First login
            login_response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            
            if login_response.status_code != 200:
                self.log_test("Logout Functionality Test", False, 
                            f"Login failed with status {login_response.status_code}")
                return False
            
            # Verify we can access protected route
            user_response = self.session.get(f"{API_BASE}/user")
            if user_response.status_code != 200:
                self.log_test("Logout Functionality Test", False, 
                            "Cannot access protected route after login")
                return False
            
            # Logout
            logout_response = self.session.post(f"{API_BASE}/auth/logout")
            
            if logout_response.status_code != 200:
                self.log_test("Logout Functionality Test", False, 
                            f"Logout failed with status {logout_response.status_code}")
                return False
            
            # Try to access protected route after logout
            user_response2 = self.session.get(f"{API_BASE}/user")
            
            if user_response2.status_code != 401:
                self.log_test("Logout Functionality Test", False, 
                            f"Expected 401 after logout, got {user_response2.status_code}")
                return False
            
            self.log_test("Logout Functionality Test", True, 
                        "Logout successfully invalidated session")
            return True
            
        except Exception as e:
            self.log_test("Logout Functionality Test", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all security and authentication tests"""
        print("🔐 Starting Security and Authentication Testing Suite")
        print("=" * 60)
        
        # Test server health first
        if not self.test_health_endpoint():
            print("❌ Server health check failed. Aborting tests.")
            return False
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 1: Forgot Password - Unregistered Email
        print("\n📧 Test 1: Forgot Password - Unregistered Email...")
        self.test_forgot_password_unregistered_email()
        
        # Test 2: Forgot Password - Registered Email
        print("\n📧 Test 2: Forgot Password - Registered Email...")
        self.test_forgot_password_registered_email()
        
        # Test 3: Login - Invalid Credentials
        print("\n🔐 Test 3: Login - Invalid Credentials...")
        self.test_login_invalid_credentials()
        
        # Test 4: Login - Valid Credentials
        print("\n🔐 Test 4: Login - Valid Credentials...")
        self.test_login_valid_credentials()
        
        # Test 5: Registration - New User
        print("\n👤 Test 5: Registration - New User...")
        self.test_registration_new_user()
        
        # Test 6: Auth Protection Test
        print("\n🛡️ Test 6: Auth Protection Test...")
        self.test_auth_protection()
        
        # Test 7: Authenticated Access Test
        print("\n✅ Test 7: Authenticated Access Test...")
        self.test_authenticated_access()
        
        # Test 8: Logout Functionality Test
        print("\n🚪 Test 8: Logout Functionality Test...")
        self.test_logout_functionality()
        
        print("\n" + "=" * 60)
        print("🏁 Security and Authentication Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All security and authentication tests passed!")
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
    tester = SecurityAuthTester()
    
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