#!/usr/bin/env python3
"""
6-Digit Password Reset Flow Testing Suite for Thryvin App
Tests the complete 6-digit code password reset functionality as specified in the review request.
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
REGISTERED_EMAIL = "jakepmwest@gmail.com"
UNREGISTERED_EMAIL = "notregistered@fake.com"
NEW_PASSWORD = "NewPass123"

class PasswordResetTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.reset_code = None
        
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
    
    def test_forgot_password_registered_email(self) -> bool:
        """Test 1: Send Reset Code to Registered Email - should return 200"""
        try:
            response = self.session.post(f"{API_BASE}/auth/forgot-password", json={
                "email": REGISTERED_EMAIL
            })
            
            if response.status_code != 200:
                self.log_test("Send Reset Code - Registered Email", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            expected_message = "Password reset code sent! Check your email for a 6-digit code."
            
            if data.get("message") != expected_message:
                self.log_test("Send Reset Code - Registered Email", False, 
                            f"Unexpected response message",
                            {"expected": expected_message, "actual": data.get("message")})
                return False
            
            self.log_test("Send Reset Code - Registered Email", True, 
                        "Successfully sent password reset code to registered email")
            return True
            
        except Exception as e:
            self.log_test("Send Reset Code - Registered Email", False, f"Error: {str(e)}")
            return False
    
    def test_forgot_password_unregistered_email(self) -> bool:
        """Test 2: Send Reset Code to Unregistered Email - should return 404"""
        try:
            response = self.session.post(f"{API_BASE}/auth/forgot-password", json={
                "email": UNREGISTERED_EMAIL
            })
            
            if response.status_code != 404:
                self.log_test("Send Reset Code - Unregistered Email", False, 
                            f"Expected status 404, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            expected_error = "We don't recognize this email address. Please check your email or sign up for an account."
            
            if data.get("error") != expected_error:
                self.log_test("Send Reset Code - Unregistered Email", False, 
                            f"Unexpected error message",
                            {"expected": expected_error, "actual": data.get("error")})
                return False
            
            self.log_test("Send Reset Code - Unregistered Email", True, 
                        "Correctly returned 404 with proper error message for unregistered email")
            return True
            
        except Exception as e:
            self.log_test("Send Reset Code - Unregistered Email", False, f"Error: {str(e)}")
            return False
    
    def get_reset_code_from_logs(self) -> Optional[str]:
        """Extract the 6-digit code from backend logs"""
        try:
            # Try to get the code from the test endpoint first
            response = self.session.get(f"{API_BASE}/auth/test-tokens")
            if response.status_code == 200:
                tokens = response.json().get("tokens", {})
                if REGISTERED_EMAIL in tokens:
                    code = tokens[REGISTERED_EMAIL]["token"]
                    print(f"🔑 6-digit reset code extracted from test endpoint: {code}")
                    return code
            
            # If test endpoint doesn't work, we'll need to check logs manually
            print("⚠️ Could not extract code from test endpoint. Check backend logs for the 6-digit code.")
            return None
            
        except Exception as e:
            print(f"❌ Error extracting reset code: {str(e)}")
            return None
    
    def test_verify_correct_code(self) -> bool:
        """Test 3: Verify Correct Code - should return 200 with verified: true"""
        try:
            # Get the reset code
            self.reset_code = self.get_reset_code_from_logs()
            
            if not self.reset_code:
                self.log_test("Verify Correct Code", False, 
                            "Could not extract reset code from logs")
                return False
            
            response = self.session.post(f"{API_BASE}/auth/verify-reset-code", json={
                "email": REGISTERED_EMAIL,
                "code": self.reset_code
            })
            
            if response.status_code != 200:
                self.log_test("Verify Correct Code", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            if not data.get("verified"):
                self.log_test("Verify Correct Code", False, 
                            "Response missing 'verified: true'",
                            {"response": data})
                return False
            
            self.log_test("Verify Correct Code", True, 
                        f"Successfully verified correct code: {self.reset_code}")
            return True
            
        except Exception as e:
            self.log_test("Verify Correct Code", False, f"Error: {str(e)}")
            return False
    
    def test_verify_incorrect_code(self) -> bool:
        """Test 4: Verify Incorrect Code - should return 400 with error"""
        try:
            response = self.session.post(f"{API_BASE}/auth/verify-reset-code", json={
                "email": REGISTERED_EMAIL,
                "code": "999999"
            })
            
            if response.status_code != 400:
                self.log_test("Verify Incorrect Code", False, 
                            f"Expected status 400, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            if "error" not in data:
                self.log_test("Verify Incorrect Code", False, 
                            "Response missing error message",
                            {"response": data})
                return False
            
            self.log_test("Verify Incorrect Code", True, 
                        f"Correctly rejected incorrect code with error: {data.get('error')}")
            return True
            
        except Exception as e:
            self.log_test("Verify Incorrect Code", False, f"Error: {str(e)}")
            return False
    
    def test_reset_password_with_valid_code(self) -> bool:
        """Test 5: Reset Password with Valid Code - should return 200"""
        try:
            if not self.reset_code:
                self.log_test("Reset Password with Valid Code", False, 
                            "No valid reset code available")
                return False
            
            response = self.session.post(f"{API_BASE}/auth/reset-password", json={
                "email": REGISTERED_EMAIL,
                "code": self.reset_code,
                "newPassword": NEW_PASSWORD
            })
            
            if response.status_code != 200:
                self.log_test("Reset Password with Valid Code", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            if "message" not in data:
                self.log_test("Reset Password with Valid Code", False, 
                            "Response missing success message",
                            {"response": data})
                return False
            
            self.log_test("Reset Password with Valid Code", True, 
                        f"Successfully reset password: {data.get('message')}")
            return True
            
        except Exception as e:
            self.log_test("Reset Password with Valid Code", False, f"Error: {str(e)}")
            return False
    
    def test_verify_code_deleted_after_use(self) -> bool:
        """Test 6: Verify Code is Deleted After Use - should fail with expired error"""
        try:
            if not self.reset_code:
                self.log_test("Verify Code Deleted After Use", False, 
                            "No reset code available to test")
                return False
            
            response = self.session.post(f"{API_BASE}/auth/verify-reset-code", json={
                "email": REGISTERED_EMAIL,
                "code": self.reset_code
            })
            
            if response.status_code != 400:
                self.log_test("Verify Code Deleted After Use", False, 
                            f"Expected status 400, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            error_message = data.get("error", "")
            
            if "Invalid or expired reset code" not in error_message:
                self.log_test("Verify Code Deleted After Use", False, 
                            f"Unexpected error message: {error_message}")
                return False
            
            self.log_test("Verify Code Deleted After Use", True, 
                        "Code correctly deleted after use - verification failed as expected")
            return True
            
        except Exception as e:
            self.log_test("Verify Code Deleted After Use", False, f"Error: {str(e)}")
            return False
    
    def test_login_with_new_password(self) -> bool:
        """Test 7: Login with New Password - should return 200 with user data"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": REGISTERED_EMAIL,
                "password": NEW_PASSWORD
            })
            
            if response.status_code != 200:
                self.log_test("Login with New Password", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            if not data.get("ok") or not data.get("user"):
                self.log_test("Login with New Password", False, 
                            "Response missing 'ok' or 'user' fields",
                            {"response": data})
                return False
            
            user = data["user"]
            if user.get("email") != REGISTERED_EMAIL:
                self.log_test("Login with New Password", False, 
                            f"User email mismatch: expected {REGISTERED_EMAIL}, got {user.get('email')}")
                return False
            
            self.log_test("Login with New Password", True, 
                        f"Successfully logged in with new password: {user.get('email')}")
            return True
            
        except Exception as e:
            self.log_test("Login with New Password", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all 6-digit password reset flow tests"""
        print("🔐 Starting 6-Digit Password Reset Flow Testing Suite")
        print("=" * 70)
        
        # Test server health first
        if not self.test_health_endpoint():
            print("❌ Server health check failed. Aborting tests.")
            return False
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 70)
        
        # Test 1: Send Reset Code to Registered Email
        print("\n📧 Test 1: Send Reset Code to Registered Email...")
        self.test_forgot_password_registered_email()
        
        # Test 2: Send Reset Code to Unregistered Email
        print("\n📧 Test 2: Send Reset Code to Unregistered Email...")
        self.test_forgot_password_unregistered_email()
        
        # Test 3: Verify Correct Code
        print("\n🔐 Test 3: Verify Correct Code...")
        self.test_verify_correct_code()
        
        # Test 4: Verify Incorrect Code
        print("\n🔐 Test 4: Verify Incorrect Code...")
        self.test_verify_incorrect_code()
        
        # Test 5: Reset Password with Valid Code
        print("\n🔑 Test 5: Reset Password with Valid Code...")
        self.test_reset_password_with_valid_code()
        
        # Test 6: Verify Code is Deleted After Use
        print("\n🗑️ Test 6: Verify Code is Deleted After Use...")
        self.test_verify_code_deleted_after_use()
        
        # Test 7: Login with New Password
        print("\n🚪 Test 7: Login with New Password...")
        self.test_login_with_new_password()
        
        print("\n" + "=" * 70)
        print("🏁 6-Digit Password Reset Flow Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All 6-digit password reset flow tests passed!")
            return True
        else:
            print(f"⚠️ {total_tests - passed_tests} tests had issues")
            return False
    
    def print_summary(self):
        """Print detailed test summary"""
        print("\n📊 Detailed Test Summary:")
        print("-" * 50)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
            
            if result['details'] and not result['success']:
                print(f"   Error details: {json.dumps(result['details'], indent=2)}")
        
        # Print the 6-digit code if we found it
        if self.reset_code:
            print(f"\n🔑 6-digit reset code found: {self.reset_code}")
            print("   This code was used in the test flow and should now be deleted.")

def main():
    """Main test runner"""
    tester = PasswordResetTester()
    
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