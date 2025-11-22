#!/usr/bin/env python3
"""
Workout Hub Backend API Testing Suite
Tests the specific endpoints requested in the review for Workout Hub integration.
"""

import requests
import json
import sys
import os
from typing import Dict, List, Any, Optional

# Configuration - Use environment variable or default to localhost
BASE_URL = os.environ.get('EXPO_PUBLIC_API_URL', 'http://localhost:5000')
API_BASE = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

class WorkoutHubTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        
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
    
    def test_health_endpoint_specific(self) -> bool:
        """Test GET /api/health with specific expected fields"""
        try:
            response = self.session.get(f"{API_BASE}/health")
            
            if response.status_code != 200:
                self.log_test("Health Endpoint", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            health_data = response.json()
            
            # Check for required fields as mentioned in review request
            required_fields = ['ok', 'aiReady']
            for field in required_fields:
                if field not in health_data:
                    self.log_test("Health Endpoint", False, 
                                f"Missing required field: {field}", {"response": health_data})
                    return False
            
            # Verify field types
            if not isinstance(health_data['ok'], bool):
                self.log_test("Health Endpoint", False, "'ok' field should be boolean")
                return False
                
            if not isinstance(health_data['aiReady'], bool):
                self.log_test("Health Endpoint", False, "'aiReady' field should be boolean")
                return False
            
            self.log_test("Health Endpoint", True, 
                        f"Health check passed - ok: {health_data['ok']}, aiReady: {health_data['aiReady']}", 
                        health_data)
            return True
            
        except Exception as e:
            self.log_test("Health Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_exercises_with_specific_names(self) -> bool:
        """Test GET /api/exercises?names=Bench Press,Squats,Push-ups,Pull-ups,Plank"""
        try:
            # Test with the exact names from the review request
            test_names = ["Bench Press", "Squats", "Push-ups", "Pull-ups", "Plank"]
            names_param = ",".join(test_names)
            
            response = self.session.get(f"{API_BASE}/exercises?names={names_param}")
            
            if response.status_code != 200:
                self.log_test("Specific Exercise Names", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Validate response structure
            if 'exercises' not in data:
                self.log_test("Specific Exercise Names", False, "Missing 'exercises' field")
                return False
            
            exercises = data['exercises']
            found_exercises = [ex for ex in exercises if ex is not None]
            
            if len(found_exercises) == 0:
                self.log_test("Specific Exercise Names", False, "No exercises found for the test names")
                return False
            
            # Validate each found exercise has required fields
            for exercise in found_exercises:
                required_fields = ['id', 'name', 'videoUrl', 'description', 'muscleGroups']
                for field in required_fields:
                    if field not in exercise:
                        self.log_test("Specific Exercise Names", False, 
                                    f"Exercise missing required field: {field}", {"exercise": exercise})
                        return False
                
                # Validate videoUrl format (should be Cloudinary URL)
                video_url = exercise.get('videoUrl')
                if video_url and not video_url.startswith('https://res.cloudinary.com/'):
                    # Allow other valid video URLs but note them
                    if not video_url.startswith('https://'):
                        self.log_test("Specific Exercise Names", False, 
                                    f"Invalid videoUrl format: {video_url}")
                        return False
            
            self.log_test("Specific Exercise Names", True, 
                        f"Successfully fetched {len(found_exercises)}/{len(test_names)} exercises with required fields",
                        {"found_count": len(found_exercises), "sample_exercise": found_exercises[0] if found_exercises else None})
            return True
            
        except Exception as e:
            self.log_test("Specific Exercise Names", False, f"Error: {str(e)}")
            return False
    
    def test_exercise_by_bench_press_slug(self) -> bool:
        """Test GET /api/exercises/bench-press (specific slug from review)"""
        try:
            test_slug = "bench-press"
            
            response = self.session.get(f"{API_BASE}/exercises/{test_slug}")
            
            if response.status_code != 200:
                self.log_test("Bench Press Slug", False, 
                            f"Expected status 200 for slug '{test_slug}', got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Should have exercise field
            if 'exercise' not in data:
                self.log_test("Bench Press Slug", False, "Missing 'exercise' field in response")
                return False
            
            exercise = data['exercise']
            
            # Validate exercise structure with all required fields
            required_fields = ['id', 'name', 'videoUrl', 'description', 'muscleGroups']
            for field in required_fields:
                if field not in exercise:
                    self.log_test("Bench Press Slug", False, 
                                f"Exercise missing required field: {field}")
                    return False
            
            # Validate that slug matches
            if exercise.get('slug') != test_slug:
                self.log_test("Bench Press Slug", False, 
                            f"Slug mismatch: expected {test_slug}, got {exercise.get('slug')}")
                return False
            
            # Validate videoUrl is valid
            video_url = exercise.get('videoUrl')
            if not video_url or not video_url.startswith('https://'):
                self.log_test("Bench Press Slug", False, 
                            f"Invalid or missing videoUrl: {video_url}")
                return False
            
            self.log_test("Bench Press Slug", True, 
                        f"Successfully fetched exercise by slug '{test_slug}' with all required fields",
                        {"exercise_name": exercise['name'], "video_url": video_url})
            return True
            
        except Exception as e:
            self.log_test("Bench Press Slug", False, f"Error: {str(e)}")
            return False
    
    def test_invalid_exercise_handling(self) -> bool:
        """Test graceful handling of invalid exercise names"""
        try:
            # Test with one valid and one invalid exercise name
            test_names = ["Bench Press", "NonExistentExercise123"]
            names_param = ",".join(test_names)
            
            response = self.session.get(f"{API_BASE}/exercises?names={names_param}")
            
            if response.status_code != 200:
                self.log_test("Invalid Exercise Handling", False, 
                            f"Expected status 200, got {response.status_code}")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            # Should have 2 items (one valid, one null)
            if len(exercises) != 2:
                self.log_test("Invalid Exercise Handling", False, 
                            f"Expected 2 exercises in response, got {len(exercises)}")
                return False
            
            # Should have one valid exercise and one null
            valid_exercises = [ex for ex in exercises if ex is not None]
            null_exercises = [ex for ex in exercises if ex is None]
            
            if len(valid_exercises) != 1 or len(null_exercises) != 1:
                self.log_test("Invalid Exercise Handling", False, 
                            f"Expected 1 valid and 1 null exercise, got {len(valid_exercises)} valid and {len(null_exercises)} null")
                return False
            
            self.log_test("Invalid Exercise Handling", True, 
                        "Correctly handled mix of valid and invalid exercise names")
            return True
            
        except Exception as e:
            self.log_test("Invalid Exercise Handling", False, f"Error: {str(e)}")
            return False
    
    def test_missing_names_parameter(self) -> bool:
        """Test GET /api/exercises without names parameter (should return reasonable default)"""
        try:
            response = self.session.get(f"{API_BASE}/exercises")
            
            if response.status_code != 200:
                self.log_test("Missing Names Parameter", False, 
                            f"Expected status 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            if 'exercises' not in data:
                self.log_test("Missing Names Parameter", False, "Missing 'exercises' field")
                return False
            
            exercises = data['exercises']
            
            # Should return some exercises (up to 100 as mentioned in review)
            if len(exercises) == 0:
                self.log_test("Missing Names Parameter", False, "No exercises returned")
                return False
            
            if len(exercises) > 100:
                self.log_test("Missing Names Parameter", False, f"Too many exercises returned: {len(exercises)}")
                return False
            
            # Validate first exercise has required fields
            first_exercise = exercises[0]
            required_fields = ['id', 'name', 'videoUrl', 'description', 'muscleGroups']
            for field in required_fields:
                if field not in first_exercise:
                    self.log_test("Missing Names Parameter", False, 
                                f"Exercise missing required field: {field}")
                    return False
            
            self.log_test("Missing Names Parameter", True, 
                        f"Successfully returned {len(exercises)} exercises without names parameter")
            return True
            
        except Exception as e:
            self.log_test("Missing Names Parameter", False, f"Error: {str(e)}")
            return False
    
    def test_video_url_validation(self) -> bool:
        """Test that video URLs are valid Cloudinary URLs"""
        try:
            # Get a few exercises to check video URLs
            response = self.session.get(f"{API_BASE}/exercises?names=Bench Press,Squats,Push-ups")
            
            if response.status_code != 200:
                self.log_test("Video URL Validation", False, "Could not fetch exercises for URL validation")
                return False
            
            data = response.json()
            exercises = [ex for ex in data.get('exercises', []) if ex is not None]
            
            if len(exercises) == 0:
                self.log_test("Video URL Validation", False, "No exercises found for URL validation")
                return False
            
            cloudinary_count = 0
            valid_url_count = 0
            
            for exercise in exercises:
                video_url = exercise.get('videoUrl')
                if video_url:
                    if video_url.startswith('https://res.cloudinary.com/'):
                        cloudinary_count += 1
                    elif video_url.startswith('https://'):
                        valid_url_count += 1
                    else:
                        self.log_test("Video URL Validation", False, 
                                    f"Invalid video URL format: {video_url}")
                        return False
            
            total_valid = cloudinary_count + valid_url_count
            
            if total_valid == 0:
                self.log_test("Video URL Validation", False, "No valid video URLs found")
                return False
            
            self.log_test("Video URL Validation", True, 
                        f"All video URLs are valid - {cloudinary_count} Cloudinary URLs, {valid_url_count} other valid URLs")
            return True
            
        except Exception as e:
            self.log_test("Video URL Validation", False, f"Error: {str(e)}")
            return False
    
    def run_workout_hub_tests(self):
        """Run all Workout Hub specific tests"""
        print("🏋️ Starting Workout Hub Backend API Testing Suite")
        print("=" * 60)
        
        # Run all tests as specified in the review request
        tests = [
            self.test_health_endpoint_specific,
            self.test_exercises_with_specific_names,
            self.test_exercise_by_bench_press_slug,
            self.test_invalid_exercise_handling,
            self.test_missing_names_parameter,
            self.test_video_url_validation,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print("\n" + "=" * 60)
        print(f"🏁 Workout Hub Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All Workout Hub API tests passed!")
            return True
        else:
            print(f"❌ {total - passed} tests failed")
            return False
    
    def print_summary(self):
        """Print detailed test summary"""
        print("\n📊 Detailed Test Summary:")
        print("-" * 40)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")

def main():
    """Main test runner"""
    tester = WorkoutHubTester()
    
    try:
        success = tester.run_workout_hub_tests()
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