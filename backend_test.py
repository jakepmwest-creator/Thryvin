#!/usr/bin/env python3
"""
Backend API Testing Suite for AI Workout Generation
Tests the AI workout generation feature for the Thryvin fitness app.
"""

import requests
import json
import sys
import time
from typing import Dict, List, Any, Optional

# Configuration - Use environment variable or default to localhost
import os
BASE_URL = os.environ.get('EXPO_PUBLIC_API_URL', 'http://localhost:5000')
API_BASE = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

class AIWorkoutTester:
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
    
    def authenticate(self) -> bool:
        """Authenticate with test user credentials"""
        try:
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                self.log_test("Authentication", True, "Successfully logged in with test credentials")
                return True
            else:
                self.log_test("Authentication", False, f"Login failed with status {response.status_code}", 
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_health_endpoint(self) -> bool:
        """Test the health endpoint to verify server is running"""
        try:
            response = self.session.get(f"{API_BASE}/health")
            
            if response.status_code == 200:
                health_data = response.json()
                self.log_test("Health Check", True, "Server is healthy", health_data)
                return True
            else:
                self.log_test("Health Check", False, f"Health check failed with status {response.status_code}",
                            {"response": response.text})
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Health check error: {str(e)}")
            return False
    
    def test_basic_ai_workout_generation(self) -> bool:
        """Test POST /api/workouts/generate with basic user profile"""
        try:
            # Test user profile: intermediate experience, muscle-gain goal, 45 min session, Strength Training
            user_profile = {
                "experience": "intermediate",
                "goal": "muscle-gain", 
                "sessionDuration": 45,
                "workoutType": "Strength Training",
                "equipment": ["dumbbells", "barbell", "bench"],
                "injuries": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json={
                "userProfile": user_profile,
                "dayOfWeek": 1  # Monday
            })
            
            if response.status_code != 200:
                self.log_test("Basic AI Workout Generation", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Validate response structure
            required_fields = ['title', 'type', 'difficulty', 'duration', 'exercises', 'overview', 'targetMuscles', 'caloriesBurn']
            for field in required_fields:
                if field not in data:
                    self.log_test("Basic AI Workout Generation", False, 
                                f"Missing required field: {field}", {"response": data})
                    return False
            
            # Validate exercises array
            exercises = data['exercises']
            if not isinstance(exercises, list) or len(exercises) == 0:
                self.log_test("Basic AI Workout Generation", False, "Exercises should be a non-empty list")
                return False
            
            # Validate exercise structure
            for exercise in exercises:
                required_exercise_fields = ['id', 'name', 'sets', 'reps', 'restTime', 'videoUrl', 'category']
                for field in required_exercise_fields:
                    if field not in exercise:
                        self.log_test("Basic AI Workout Generation", False, 
                                    f"Exercise missing required field: {field}", {"exercise": exercise})
                        return False
                
                # Check for video URL (most should have real Cloudinary URLs)
                video_url = exercise.get('videoUrl')
                if video_url and video_url != "":
                    if not video_url.startswith('https://res.cloudinary.com/'):
                        # Log but don't fail - some exercises might have different video sources
                        print(f"   Note: Exercise '{exercise['name']}' has non-Cloudinary video URL: {video_url}")
            
            # Check for workout phases (warmup, main, cooldown)
            exercise_categories = [ex.get('category', '').lower() for ex in exercises]
            has_warmup = any('warmup' in cat or 'warm-up' in cat for cat in exercise_categories)
            has_main = any('main' in cat or 'strength' in cat or 'cardio' in cat for cat in exercise_categories)
            has_cooldown = any('cooldown' in cat or 'cool-down' in cat or 'stretch' in cat for cat in exercise_categories)
            
            # Count exercises with real video URLs
            exercises_with_videos = sum(1 for ex in exercises if ex.get('videoUrl') and ex['videoUrl'].startswith('https://res.cloudinary.com/'))
            video_percentage = (exercises_with_videos / len(exercises)) * 100
            
            self.log_test("Basic AI Workout Generation", True, 
                        f"Successfully generated workout: '{data['title']}' with {len(exercises)} exercises ({video_percentage:.1f}% have Cloudinary videos)",
                        {
                            "workout_type": data['type'],
                            "difficulty": data['difficulty'], 
                            "duration": data['duration'],
                            "target_muscles": data['targetMuscles'],
                            "calories_burn": data['caloriesBurn'],
                            "has_warmup": has_warmup,
                            "has_main": has_main,
                            "has_cooldown": has_cooldown,
                            "exercises_with_videos": exercises_with_videos,
                            "total_exercises": len(exercises)
                        })
            return True
            
        except Exception as e:
            self.log_test("Basic AI Workout Generation", False, f"Error: {str(e)}")
            return False
    
    def test_beginner_weight_loss_profile(self) -> bool:
        """Test AI workout generation for beginner with weight-loss goal"""
        try:
            # Beginner with weight-loss goal, 30 min session
            user_profile = {
                "experience": "beginner",
                "goal": "weight-loss", 
                "sessionDuration": 30,
                "workoutType": "Cardio",
                "equipment": ["bodyweight"],
                "injuries": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json={
                "userProfile": user_profile,
                "dayOfWeek": 2  # Tuesday
            })
            
            if response.status_code != 200:
                self.log_test("Beginner Weight Loss Profile", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Validate basic structure
            if 'title' not in data or 'exercises' not in data:
                self.log_test("Beginner Weight Loss Profile", False, "Missing basic workout structure")
                return False
            
            exercises = data['exercises']
            if len(exercises) == 0:
                self.log_test("Beginner Weight Loss Profile", False, "No exercises generated")
                return False
            
            # Check that workout is appropriate for beginner (reasonable duration and intensity)
            duration = data.get('duration', 0)
            if duration > 35:  # Should be around 30 minutes for beginner
                self.log_test("Beginner Weight Loss Profile", False, 
                            f"Workout too long for beginner: {duration} minutes")
                return False
            
            self.log_test("Beginner Weight Loss Profile", True, 
                        f"Generated appropriate beginner workout: '{data['title']}' ({duration} min, {len(exercises)} exercises)")
            return True
            
        except Exception as e:
            self.log_test("Beginner Weight Loss Profile", False, f"Error: {str(e)}")
            return False
    
    def test_exercises_nonexistent(self) -> bool:
        """Test with non-existent exercise names"""
        try:
            # Test with completely made-up exercise names
            test_names = ["NonExistentExercise1", "FakeExercise2", "NotRealExercise3"]
            names_param = ",".join(test_names)
            
            response = self.session.get(f"{API_BASE}/exercises?names={names_param}")
            
            if response.status_code != 200:
                self.log_test("Non-existent Exercises", False, 
                            f"Expected status 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            # Should return null for all exercises
            if data['found'] == 0 and data['requested'] == len(test_names):
                self.log_test("Non-existent Exercises", True, 
                            "Correctly handled non-existent exercise names")
                return True
            else:
                self.log_test("Non-existent Exercises", False, 
                            f"Unexpected results: found={data['found']}, requested={data['requested']}")
                return False
                
        except Exception as e:
            self.log_test("Non-existent Exercises", False, f"Error: {str(e)}")
            return False
    
    def test_exercises_no_names_param(self) -> bool:
        """Test GET /api/exercises without names parameter (should return up to 100 exercises)"""
        try:
            response = self.session.get(f"{API_BASE}/exercises")
            
            if response.status_code != 200:
                self.log_test("Exercises No Names Param", False, 
                            f"Expected status 200, got {response.status_code}")
                return False
            
            data = response.json()
            
            # Should have exercises field
            if 'exercises' not in data:
                self.log_test("Exercises No Names Param", False, "Missing exercises field")
                return False
            
            exercises = data['exercises']
            if not isinstance(exercises, list):
                self.log_test("Exercises No Names Param", False, "Exercises should be a list")
                return False
            
            # Should return some exercises (up to 100)
            if len(exercises) == 0:
                self.log_test("Exercises No Names Param", False, "No exercises returned")
                return False
            
            if len(exercises) > 100:
                self.log_test("Exercises No Names Param", False, f"Too many exercises returned: {len(exercises)}")
                return False
            
            # Validate first exercise structure
            first_exercise = exercises[0]
            required_fields = ['id', 'name', 'slug', 'videoUrl']
            for field in required_fields:
                if field not in first_exercise:
                    self.log_test("Exercises No Names Param", False, 
                                f"Exercise missing required field: {field}")
                    return False
            
            self.log_test("Exercises No Names Param", True, 
                        f"Successfully fetched {len(exercises)} exercises without names parameter")
            return True
            
        except Exception as e:
            self.log_test("Exercises No Names Param", False, f"Error: {str(e)}")
            return False
    
    def test_exercise_by_slug(self) -> bool:
        """Test GET /api/exercises/:slug endpoint"""
        try:
            # First, get some exercises to find valid slugs
            response = self.session.get(f"{API_BASE}/exercises")
            if response.status_code != 200:
                self.log_test("Exercise By Slug Setup", False, "Could not fetch exercises for slug test")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            if len(exercises) == 0:
                self.log_test("Exercise By Slug", False, "No exercises available for slug testing")
                return False
            
            # Test with first available exercise slug
            test_exercise = exercises[0]
            test_slug = test_exercise.get('slug')
            
            if not test_slug:
                self.log_test("Exercise By Slug", False, "No slug found in exercise data")
                return False
            
            # Test valid slug
            response = self.session.get(f"{API_BASE}/exercises/{test_slug}")
            
            if response.status_code != 200:
                self.log_test("Exercise By Slug", False, 
                            f"Expected status 200 for valid slug, got {response.status_code}")
                return False
            
            data = response.json()
            
            # Should have exercise field
            if 'exercise' not in data:
                self.log_test("Exercise By Slug", False, "Missing exercise field in response")
                return False
            
            exercise = data['exercise']
            
            # Validate exercise structure
            required_fields = ['id', 'name', 'slug', 'videoUrl']
            for field in required_fields:
                if field not in exercise:
                    self.log_test("Exercise By Slug", False, 
                                f"Exercise missing required field: {field}")
                    return False
            
            # Validate that slug matches
            if exercise['slug'] != test_slug:
                self.log_test("Exercise By Slug", False, 
                            f"Slug mismatch: expected {test_slug}, got {exercise['slug']}")
                return False
            
            self.log_test("Exercise By Slug", True, 
                        f"Successfully fetched exercise by slug: {test_slug}",
                        {"exercise_name": exercise['name']})
            return True
            
        except Exception as e:
            self.log_test("Exercise By Slug", False, f"Error: {str(e)}")
            return False
    
    def test_exercise_by_invalid_slug(self) -> bool:
        """Test GET /api/exercises/:slug with invalid slug (should return 404)"""
        try:
            invalid_slug = "non-existent-exercise-slug-12345"
            
            response = self.session.get(f"{API_BASE}/exercises/{invalid_slug}")
            
            if response.status_code != 404:
                self.log_test("Exercise By Invalid Slug", False, 
                            f"Expected status 404 for invalid slug, got {response.status_code}")
                return False
            
            data = response.json()
            
            # Should have error field
            if 'error' not in data:
                self.log_test("Exercise By Invalid Slug", False, "Missing error field in 404 response")
                return False
            
            self.log_test("Exercise By Invalid Slug", True, 
                        "Correctly returned 404 for invalid slug")
            return True
            
        except Exception as e:
            self.log_test("Exercise By Invalid Slug", False, f"Error: {str(e)}")
            return False
    
    def test_exercise_metadata_validation(self) -> bool:
        """Test that exercise metadata fields are present and valid"""
        try:
            # Get a few exercises to validate metadata
            response = self.session.get(f"{API_BASE}/exercises")
            if response.status_code != 200:
                self.log_test("Exercise Metadata Validation", False, "Could not fetch exercises")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            if len(exercises) == 0:
                self.log_test("Exercise Metadata Validation", False, "No exercises to validate")
                return False
            
            # Check metadata fields on first few exercises
            metadata_fields = ['category', 'muscleGroups', 'difficulty', 'instructions', 'tips']
            valid_count = 0
            
            for i, exercise in enumerate(exercises[:5]):  # Check first 5 exercises
                has_all_metadata = True
                for field in metadata_fields:
                    if field not in exercise:
                        has_all_metadata = False
                        break
                
                if has_all_metadata:
                    valid_count += 1
            
            if valid_count > 0:
                self.log_test("Exercise Metadata Validation", True, 
                            f"Found {valid_count}/5 exercises with complete metadata")
                return True
            else:
                self.log_test("Exercise Metadata Validation", False, 
                            "No exercises found with complete metadata")
                return False
                
        except Exception as e:
            self.log_test("Exercise Metadata Validation", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all exercise API tests"""
        print("🏋️ Starting Exercise Video API Testing Suite")
        print("=" * 60)
        
        # Test server health first
        if not self.test_health_endpoint():
            print("❌ Server health check failed. Aborting tests.")
            return False
        
        # Authentication is optional for exercise endpoints, but let's try it
        self.authenticate()  # Don't fail if auth fails, exercises might be public
        
        # Run all exercise endpoint tests
        tests = [
            self.test_exercises_bulk_fetch,
            self.test_exercises_case_insensitive,
            self.test_exercises_nonexistent,
            self.test_exercises_no_names_param,
            self.test_exercise_by_slug,
            self.test_exercise_by_invalid_slug,
            self.test_exercise_metadata_validation,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            time.sleep(0.5)  # Small delay between tests
        
        print("\n" + "=" * 60)
        print(f"🏁 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All exercise API tests passed!")
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
            
            if result['details'] and not result['success']:
                print(f"   Error details: {json.dumps(result['details'], indent=2)}")

def main():
    """Main test runner"""
    tester = ExerciseAPITester()
    
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