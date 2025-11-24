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
                required_exercise_fields = ['id', 'name', 'sets', 'reps', 'restTime', 'category']
                for field in required_exercise_fields:
                    if field not in exercise:
                        self.log_test("Basic AI Workout Generation", False, 
                                    f"Exercise missing required field: {field}", {"exercise": exercise})
                        return False
                
                # Check for video URL (videoUrl field should be present, but can be empty for some exercises)
                if 'videoUrl' not in exercise:
                    print(f"   Note: Exercise '{exercise['name']}' missing videoUrl field")
                else:
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
    
    def test_advanced_endurance_profile(self) -> bool:
        """Test AI workout generation for advanced user with endurance goal"""
        try:
            # Advanced with endurance goal, 60 min session
            user_profile = {
                "experience": "advanced",
                "goal": "endurance", 
                "sessionDuration": 60,
                "workoutType": "Endurance",
                "equipment": ["treadmill", "bike", "bodyweight"],
                "injuries": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json={
                "userProfile": user_profile,
                "dayOfWeek": 4  # Thursday
            })
            
            if response.status_code != 200:
                self.log_test("Advanced Endurance Profile", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Validate basic structure
            if 'title' not in data or 'exercises' not in data:
                self.log_test("Advanced Endurance Profile", False, "Missing basic workout structure")
                return False
            
            exercises = data['exercises']
            if len(exercises) == 0:
                self.log_test("Advanced Endurance Profile", False, "No exercises generated")
                return False
            
            # Check that workout is appropriate for advanced user (longer duration, more exercises)
            duration = data.get('duration', 0)
            if duration < 45:  # Should be closer to 60 minutes for advanced
                self.log_test("Advanced Endurance Profile", False, 
                            f"Workout too short for advanced user: {duration} minutes")
                return False
            
            self.log_test("Advanced Endurance Profile", True, 
                        f"Generated appropriate advanced workout: '{data['title']}' ({duration} min, {len(exercises)} exercises)")
            return True
            
        except Exception as e:
            self.log_test("Advanced Endurance Profile", False, f"Error: {str(e)}")
            return False
    
    def test_profile_with_injuries(self) -> bool:
        """Test AI workout generation with injuries field populated"""
        try:
            # User with knee injury
            user_profile = {
                "experience": "intermediate",
                "goal": "strength", 
                "sessionDuration": 40,
                "workoutType": "Strength Training",
                "equipment": ["dumbbells", "resistance_bands"],
                "injuries": ["knee", "lower_back"]
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json={
                "userProfile": user_profile,
                "dayOfWeek": 3  # Wednesday
            })
            
            if response.status_code != 200:
                self.log_test("Profile With Injuries", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Validate basic structure
            if 'title' not in data or 'exercises' not in data:
                self.log_test("Profile With Injuries", False, "Missing basic workout structure")
                return False
            
            exercises = data['exercises']
            if len(exercises) == 0:
                self.log_test("Profile With Injuries", False, "No exercises generated")
                return False
            
            # Check that workout avoids high-impact exercises (this is more of a validation that AI processed the injury info)
            exercise_names = [ex.get('name', '').lower() for ex in exercises]
            high_impact_exercises = ['jumping', 'jump', 'squat jump', 'burpee', 'box jump']
            has_high_impact = any(impact in ' '.join(exercise_names) for impact in high_impact_exercises)
            
            self.log_test("Profile With Injuries", True, 
                        f"Generated injury-aware workout: '{data['title']}' ({len(exercises)} exercises, high-impact: {has_high_impact})",
                        {"injuries_considered": user_profile["injuries"], "high_impact_detected": has_high_impact})
            return True
            
        except Exception as e:
            self.log_test("Profile With Injuries", False, f"Error: {str(e)}")
            return False
    
    def test_different_days_of_week(self) -> bool:
        """Test AI workout generation for different days of week"""
        try:
            # Test Monday (0), Thursday (3), Sunday (6)
            test_days = [0, 3, 6]
            day_names = ["Monday", "Thursday", "Sunday"]
            
            user_profile = {
                "experience": "intermediate",
                "goal": "general_fitness", 
                "sessionDuration": 35,
                "workoutType": "Mixed",
                "equipment": ["dumbbells", "bodyweight"],
                "injuries": []
            }
            
            generated_workouts = []
            
            for i, day in enumerate(test_days):
                response = self.session.post(f"{API_BASE}/workouts/generate", json={
                    "userProfile": user_profile,
                    "dayOfWeek": day
                })
                
                if response.status_code != 200:
                    self.log_test("Different Days of Week", False, 
                                f"Failed to generate workout for {day_names[i]} (day {day}): {response.status_code}")
                    return False
                
                data = response.json()
                if 'title' not in data or 'exercises' not in data:
                    self.log_test("Different Days of Week", False, 
                                f"Invalid workout structure for {day_names[i]}")
                    return False
                
                generated_workouts.append({
                    "day": day_names[i],
                    "title": data['title'],
                    "type": data.get('type', 'Unknown'),
                    "exercises": len(data['exercises'])
                })
                
                # Small delay between requests
                time.sleep(0.5)
            
            # Check that we got different workout types/focuses for different days
            workout_types = [w['type'] for w in generated_workouts]
            unique_types = len(set(workout_types))
            
            self.log_test("Different Days of Week", True, 
                        f"Generated workouts for 3 different days ({unique_types} unique types)",
                        {"workouts": generated_workouts})
            return True
            
        except Exception as e:
            self.log_test("Different Days of Week", False, f"Error: {str(e)}")
            return False
    
    def test_video_urls_validation(self) -> bool:
        """Test that most exercises have valid Cloudinary video URLs"""
        try:
            # Generate a workout and check video URLs
            user_profile = {
                "experience": "intermediate",
                "goal": "strength", 
                "sessionDuration": 30,
                "workoutType": "Strength Training",
                "equipment": ["dumbbells", "barbell"],
                "injuries": []
            }
            
            response = self.session.post(f"{API_BASE}/workouts/generate", json={
                "userProfile": user_profile,
                "dayOfWeek": 1
            })
            
            if response.status_code != 200:
                self.log_test("Video URLs Validation", False, 
                            f"Failed to generate workout: {response.status_code}")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            if len(exercises) == 0:
                self.log_test("Video URLs Validation", False, "No exercises to validate")
                return False
            
            # Check video URLs
            total_exercises = len(exercises)
            exercises_with_videos = 0
            cloudinary_videos = 0
            valid_https_videos = 0
            
            for exercise in exercises:
                video_url = exercise.get('videoUrl', '')
                if video_url and video_url != '':
                    exercises_with_videos += 1
                    
                    if video_url.startswith('https://res.cloudinary.com/'):
                        cloudinary_videos += 1
                    elif video_url.startswith('https://'):
                        valid_https_videos += 1
            
            # Calculate percentages
            video_percentage = (exercises_with_videos / total_exercises) * 100
            cloudinary_percentage = (cloudinary_videos / total_exercises) * 100
            
            # Most exercises should have video URLs
            if video_percentage < 70:  # At least 70% should have videos
                self.log_test("Video URLs Validation", False, 
                            f"Too few exercises have video URLs: {video_percentage:.1f}%")
                return False
            
            self.log_test("Video URLs Validation", True, 
                        f"Video URL validation passed: {video_percentage:.1f}% have videos ({cloudinary_percentage:.1f}% Cloudinary)",
                        {
                            "total_exercises": total_exercises,
                            "exercises_with_videos": exercises_with_videos,
                            "cloudinary_videos": cloudinary_videos,
                            "valid_https_videos": valid_https_videos
                        })
            return True
            
        except Exception as e:
            self.log_test("Video URLs Validation", False, f"Error: {str(e)}")
            return False
    
    def test_error_handling(self) -> bool:
        """Test error handling for invalid requests"""
        try:
            # Test 1: Missing userProfile
            response = self.session.post(f"{API_BASE}/workouts/generate", json={
                "dayOfWeek": 1
            })
            
            if response.status_code == 200:
                self.log_test("Error Handling", False, 
                            "Should have failed with missing userProfile")
                return False
            
            # Test 2: Invalid data
            response = self.session.post(f"{API_BASE}/workouts/generate", json={
                "userProfile": "invalid_string_instead_of_object",
                "dayOfWeek": 1
            })
            
            if response.status_code == 200:
                self.log_test("Error Handling", False, 
                            "Should have failed with invalid userProfile")
                return False
            
            # Test 3: Empty userProfile
            response = self.session.post(f"{API_BASE}/workouts/generate", json={
                "userProfile": {},
                "dayOfWeek": 1
            })
            
            # This might succeed with defaults, so we just check it doesn't crash
            if response.status_code >= 500:
                self.log_test("Error Handling", False, 
                            f"Server error with empty profile: {response.status_code}")
                return False
            
            self.log_test("Error Handling", True, 
                        "Error handling working correctly for invalid requests")
            return True
            
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all AI workout generation tests"""
        print("🤖 Starting AI Workout Generation Testing Suite")
        print("=" * 60)
        
        # Test server health first
        if not self.test_health_endpoint():
            print("❌ Server health check failed. Aborting tests.")
            return False
        
        # Authentication might be required for workout generation
        auth_success = self.authenticate()
        if not auth_success:
            print("⚠️ Authentication failed, but continuing with tests...")
        
        # Run all AI workout generation tests
        tests = [
            self.test_basic_ai_workout_generation,
            self.test_beginner_weight_loss_profile,
            self.test_advanced_endurance_profile,
            self.test_profile_with_injuries,
            self.test_different_days_of_week,
            self.test_video_urls_validation,
            self.test_error_handling,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            time.sleep(1.0)  # Longer delay between AI generation requests
        
        print("\n" + "=" * 60)
        print(f"🏁 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All AI workout generation tests passed!")
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
    tester = AIWorkoutTester()
    
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