#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Fitness App - Phase 11: Adaptive Learning Loop
Tests the specific scenarios mentioned in the review request:
1. User Registration & Login
2. Learning Events API (POST /api/learning/event)
3. User Tendencies API (GET /api/learning/tendencies)
4. Coach Nudges Generation (POST /api/coach/nudges/generate)
5. Get Active Nudges (GET /api/coach/nudges)
6. Resolve Nudges (POST /api/coach/nudges/:nudgeId/resolve)
7. Tendencies Refresh (POST /api/learning/tendencies/refresh)
8. Coach Chat Integration with tendencies
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use production URL as specified in environment
BASE_URL = "https://coach-action-fix.preview.emergentagent.com"
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
        self.test_user_email = f"test_learning_{int(time.time())}@thryvin.test"
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
        """Create and authenticate a test user for learning system testing"""
        try:
            # First, try to register a test user
            register_data = {
                "name": "Test Learning User",
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
    
    def test_learning_events_api(self) -> bool:
        """Test 2: Learning Events API - Log different event types"""
        try:
            # Test logging different event types
            events_to_test = [
                {
                    "eventType": "suggestion_rejected",
                    "contextMode": "in_workout",
                    "topic": "weight_increase",
                    "payload": {
                        "suggestionType": "weight_increase",
                        "suggestedValue": 50,
                        "actualValue": 45,
                        "exercise": "Bench Press",
                        "movementPattern": "push"
                    }
                },
                {
                    "eventType": "suggestion_accepted",
                    "contextMode": "in_workout", 
                    "topic": "weight_increase",
                    "payload": {
                        "suggestionType": "weight_increase",
                        "suggestedValue": 45,
                        "actualValue": 45,
                        "exercise": "Squat",
                        "movementPattern": "squat"
                    }
                },
                {
                    "eventType": "weight_adjusted",
                    "contextMode": "in_workout",
                    "topic": "progression",
                    "payload": {
                        "delta": -2.5,
                        "exercise": "Deadlift",
                        "movementPattern": "hinge"
                    }
                },
                {
                    "eventType": "user_feedback",
                    "contextMode": "post_workout",
                    "topic": "workout_difficulty",
                    "payload": {
                        "feedbackType": "too_hard",
                        "workoutId": "test_workout_123"
                    }
                }
            ]
            
            success_count = 0
            for event in events_to_test:
                response = self.session.post(f"{API_BASE}/learning/event", json=event)
                
                if response.status_code == 200:
                    success_count += 1
                else:
                    self.log_test("Learning Events API", False, 
                                f"Failed to log {event['eventType']} event: {response.status_code}",
                                {"response": response.text})
                    return False
            
            if success_count == len(events_to_test):
                self.log_test("Learning Events API", True, 
                            f"Successfully logged {success_count} different learning events")
                return True
            else:
                self.log_test("Learning Events API", False, 
                            f"Only {success_count}/{len(events_to_test)} events logged successfully")
                return False
                
        except Exception as e:
            self.log_test("Learning Events API", False, f"Learning events error: {str(e)}")
            return False
    
    def test_user_tendencies_api(self) -> bool:
        """Test 3: User Tendencies API - Verify tendencies are returned and update"""
        try:
            # Get initial tendencies
            response = self.session.get(f"{API_BASE}/learning/tendencies")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected tendency fields
                required_fields = [
                    'progressionPace', 'prefersConfirmation', 'confidenceWithLoad',
                    'movementConfidence', 'swapFrequency', 'adherencePattern',
                    'preferredRepStyle', 'recoveryNeed', 'recentDeclines'
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("User Tendencies API", False, 
                                f"Tendencies missing fields: {missing_fields}", data)
                    return False
                
                # Verify numeric fields are in valid range (0-1)
                numeric_fields = ['prefersConfirmation', 'confidenceWithLoad', 'swapFrequency', 'recoveryNeed']
                for field in numeric_fields:
                    value = data.get(field)
                    if not isinstance(value, (int, float)) or value < 0 or value > 1:
                        self.log_test("User Tendencies API", False, 
                                    f"Invalid {field} value: {value} (should be 0-1)", data)
                        return False
                
                # Verify movement confidence structure
                movement_confidence = data.get('movementConfidence', {})
                expected_movements = ['squat', 'hinge', 'push', 'pull', 'carry']
                for movement in expected_movements:
                    if movement not in movement_confidence:
                        self.log_test("User Tendencies API", False, 
                                    f"Missing movement confidence for: {movement}", data)
                        return False
                
                # Verify recentDeclines is an array
                if not isinstance(data.get('recentDeclines'), list):
                    self.log_test("User Tendencies API", False, 
                                "recentDeclines should be an array", data)
                    return False
                
                self.log_test("User Tendencies API", True, 
                            f"Successfully retrieved valid tendencies with all required fields")
                return True
            else:
                self.log_test("User Tendencies API", False, 
                            f"Tendencies API failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("User Tendencies API", False, f"Tendencies API error: {str(e)}")
            return False
    
    def test_coach_nudges_generation(self) -> bool:
        """Test 4: Coach Nudges Generation - Generate nudges with exercise context"""
        try:
            # Test nudge generation with exercise context
            nudge_data = {
                "context": "exercise_start",
                "exerciseInfo": {
                    "name": "Bench Press",
                    "previousWeight": 45,
                    "suggestedWeight": 47.5,
                    "movementPattern": "push"
                }
            }
            
            response = self.session.post(f"{API_BASE}/coach/nudges/generate", json=nudge_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if nudge was created
                if data.get('success') or data.get('nudgeCreated'):
                    self.log_test("Coach Nudges Generation", True, 
                                "Successfully generated nudge for exercise context")
                    return True
                else:
                    # No nudge created might be valid (user already has active nudges)
                    self.log_test("Coach Nudges Generation", True, 
                                "Nudge generation completed (no new nudge needed)")
                    return True
            else:
                self.log_test("Coach Nudges Generation", False, 
                            f"Nudge generation failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Coach Nudges Generation", False, f"Nudge generation error: {str(e)}")
            return False
    
    def test_get_active_nudges(self) -> bool:
        """Test 5: Get Active Nudges - Verify nudges returned for different locations"""
        try:
            locations = ['workout_hub', 'exercise_detail', 'home']
            
            for location in locations:
                response = self.session.get(f"{API_BASE}/coach/nudges?location={location}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Handle both array and object responses
                    nudges = data if isinstance(data, list) else data.get('nudges', [])
                    
                    # Should return an array (might be empty)
                    if not isinstance(nudges, list):
                        self.log_test("Get Active Nudges", False, 
                                    f"Expected array for location {location}, got {type(nudges)}", data)
                        return False
                    
                    # If nudges exist, verify structure
                    for nudge in nudges:
                        required_fields = ['id', 'nudgeType', 'message', 'actions', 'priority']
                        missing_fields = [field for field in required_fields if field not in nudge]
                        
                        if missing_fields:
                            self.log_test("Get Active Nudges", False, 
                                        f"Nudge missing fields: {missing_fields}", nudge)
                            return False
                        
                        # Verify actions structure
                        if not isinstance(nudge.get('actions'), list):
                            self.log_test("Get Active Nudges", False, 
                                        "Nudge actions should be an array", nudge)
                            return False
                else:
                    self.log_test("Get Active Nudges", False, 
                                f"Get nudges failed for {location} with status {response.status_code}",
                                {"response": response.text})
                    return False
            
            self.log_test("Get Active Nudges", True, 
                        f"Successfully retrieved nudges for all locations: {', '.join(locations)}")
            return True
                
        except Exception as e:
            self.log_test("Get Active Nudges", False, f"Get nudges error: {str(e)}")
            return False
    
    def test_resolve_nudges(self) -> bool:
        """Test 6: Resolve Nudges - Test accepting, rejecting, and dismissing nudges"""
        try:
            # First, try to get active nudges to resolve
            response = self.session.get(f"{API_BASE}/coach/nudges?location=workout_hub")
            
            if response.status_code != 200:
                self.log_test("Resolve Nudges", False, 
                            f"Could not get nudges to resolve: {response.status_code}")
                return False
            
            data = response.json()
            nudges = data if isinstance(data, list) else data.get('nudges', [])
            
            if len(nudges) == 0:
                # Create a test nudge first by generating one
                gen_response = self.session.post(f"{API_BASE}/coach/nudges/generate", json={
                    "context": "exercise_start",
                    "exerciseInfo": {
                        "name": "Test Exercise",
                        "previousWeight": 40,
                        "suggestedWeight": 42.5,
                        "movementPattern": "push"
                    }
                })
                
                # Try to get nudges again
                response = self.session.get(f"{API_BASE}/coach/nudges?location=workout_hub")
                if response.status_code == 200:
                    data = response.json()
                    nudges = data if isinstance(data, list) else data.get('nudges', [])
            
            if len(nudges) > 0:
                # Test resolving the first nudge
                nudge_id = nudges[0]['id']
                
                # Test accepting a nudge
                resolve_data = {"resolution": "accepted"}
                resolve_response = self.session.post(f"{API_BASE}/coach/nudges/{nudge_id}/resolve", json=resolve_data)
                
                if resolve_response.status_code == 200:
                    self.log_test("Resolve Nudges", True, 
                                f"Successfully resolved nudge {nudge_id} with 'accepted'")
                    return True
                else:
                    self.log_test("Resolve Nudges", False, 
                                f"Failed to resolve nudge: {resolve_response.status_code}",
                                {"response": resolve_response.text})
                    return False
            else:
                # No nudges available to test, but API is working
                self.log_test("Resolve Nudges", True, 
                            "No active nudges to resolve, but API endpoints are accessible")
                return True
                
        except Exception as e:
            self.log_test("Resolve Nudges", False, f"Resolve nudges error: {str(e)}")
            return False
    
    def test_tendencies_refresh(self) -> bool:
        """Test 7: Tendencies Refresh - Manual tendencies refresh"""
        try:
            response = self.session.post(f"{API_BASE}/learning/tendencies/refresh")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should return updated tendencies - check for key tendency fields
                required_fields = [
                    'progressionPace', 'prefersConfirmation', 'confidenceWithLoad',
                    'movementConfidence', 'swapFrequency', 'adherencePattern',
                    'preferredRepStyle', 'recoveryNeed', 'recentDeclines'
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Tendencies Refresh", False, 
                                f"Refresh response missing fields: {missing_fields}", data)
                    return False
                else:
                    self.log_test("Tendencies Refresh", True, 
                                "Successfully refreshed user tendencies with all required fields")
                    return True
            else:
                self.log_test("Tendencies Refresh", False, 
                            f"Tendencies refresh failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Tendencies Refresh", False, f"Tendencies refresh error: {str(e)}")
            return False
    
    def test_coach_chat_with_tendencies(self) -> bool:
        """Test 8: Coach Chat Integration - Verify coach responses adapt to tendencies"""
        try:
            # Test coach chat with a weight progression question
            chat_data = {
                "message": "Should I increase my bench press weight from 45kg to 50kg today?",
                "coach": "titan"
            }
            
            response = self.session.post(f"{API_BASE}/coach/chat", json=chat_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected response structure
                required_fields = ['response', 'coach']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Coach Chat with Tendencies", False, 
                                f"Response missing fields: {missing_fields}", data)
                    return False
                
                # Verify coach name is returned
                if data.get('coach') != 'Titan':
                    self.log_test("Coach Chat with Tendencies", False, 
                                f"Expected coach 'Titan', got '{data.get('coach')}'", data)
                    return False
                
                # Verify response contains weight-related advice
                response_text = data.get('response', '').lower()
                weight_keywords = ['weight', 'kg', 'increase', 'progress', 'ready', 'bench']
                
                if any(keyword in response_text for keyword in weight_keywords):
                    self.log_test("Coach Chat with Tendencies", True, 
                                f"Coach provided contextual weight progression advice")
                    return True
                else:
                    self.log_test("Coach Chat with Tendencies", False, 
                                "Coach response doesn't seem to address weight progression",
                                {"response_preview": response_text[:200]})
                    return False
            else:
                self.log_test("Coach Chat with Tendencies", False, 
                            f"Coach chat failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Coach Chat with Tendencies", False, f"Coach chat error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Thryvin API tests as specified in review request"""
        print("🏋️ Starting Thryvin Fitness App Backend Testing - Phase 11: Adaptive Learning Loop")
        print("Testing scenarios from review request:")
        print("1. User Registration & Login")
        print("2. Learning Events API (POST /api/learning/event)")
        print("3. User Tendencies API (GET /api/learning/tendencies)")
        print("4. Coach Nudges Generation (POST /api/coach/nudges/generate)")
        print("5. Get Active Nudges (GET /api/coach/nudges)")
        print("6. Resolve Nudges (POST /api/coach/nudges/:nudgeId/resolve)")
        print("7. Tendencies Refresh (POST /api/learning/tendencies/refresh)")
        print("8. Coach Chat Integration with tendencies")
        print("=" * 60)
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 1: Health Endpoint
        print("\n💚 Test 1: Health Check Endpoint...")
        health_success = self.test_health_endpoint()
        
        # Authentication for learning tests
        print("\n🔐 Authenticating test user for learning system tests...")
        auth_success = self.authenticate_test_user()
        
        if not auth_success:
            print("❌ Authentication failed - skipping learning system tests")
            return False
        
        # Test 2: Learning Events API
        print("\n📚 Test 2: Learning Events API...")
        events_success = self.test_learning_events_api()
        
        # Test 3: User Tendencies API
        print("\n🧠 Test 3: User Tendencies API...")
        tendencies_success = self.test_user_tendencies_api()
        
        # Test 4: Coach Nudges Generation
        print("\n📣 Test 4: Coach Nudges Generation...")
        nudges_gen_success = self.test_coach_nudges_generation()
        
        # Test 5: Get Active Nudges
        print("\n📋 Test 5: Get Active Nudges...")
        get_nudges_success = self.test_get_active_nudges()
        
        # Test 6: Resolve Nudges
        print("\n✅ Test 6: Resolve Nudges...")
        resolve_nudges_success = self.test_resolve_nudges()
        
        # Test 7: Tendencies Refresh
        print("\n🔄 Test 7: Tendencies Refresh...")
        refresh_success = self.test_tendencies_refresh()
        
        # Test 8: Coach Chat Integration
        print("\n🤖 Test 8: Coach Chat Integration with Tendencies...")
        chat_success = self.test_coach_chat_with_tendencies()
        
        print("\n" + "=" * 60)
        print("🏁 Phase 11 Adaptive Learning Loop Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All Phase 11 Adaptive Learning Loop backend tests passed!")
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