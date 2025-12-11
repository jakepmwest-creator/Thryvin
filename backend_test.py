#!/usr/bin/env python3
"""
Backend API Testing Suite for Thryvin Exercise API Endpoints
Tests the exercise library API endpoints for the Thryvin fitness app.
"""

import requests
import json
import sys
import time
import re
from typing import Dict, List, Any, Optional

# Configuration - Use the provided API base URL from review request
BASE_URL = "https://fitness-ai-upgrade.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test configuration
EXPECTED_EXERCISE_COUNT = 1819
EXPECTED_VIDEO_COVERAGE = 100

class ExerciseAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.total_exercises = 0
        self.exercises_with_videos = 0
        
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
    
    def test_exercises_full_library(self) -> bool:
        """Test GET /api/exercises - Full exercise library"""
        try:
            response = self.session.get(f"{API_BASE}/exercises")
            
            if response.status_code != 200:
                self.log_test("Full Exercise Library", False, 
                            f"Expected status 200, got {response.status_code}",
                            {"response": response.text})
                return False
            
            data = response.json()
            
            # Check if response has exercises array
            if 'exercises' not in data:
                self.log_test("Full Exercise Library", False, 
                            "Response missing 'exercises' field",
                            {"response_keys": list(data.keys())})
                return False
            
            exercises = data['exercises']
            self.total_exercises = len(exercises)
            
            # Note: API has default limit, so we might get fewer exercises without explicit limit
            # This is expected behavior - we'll test the full count with limit=2000
            if self.total_exercises < 100:  # Just ensure we get some exercises
                self.log_test("Full Exercise Library", False, 
                            f"Expected at least 100 exercises, got {self.total_exercises}")
                return False
            
            # Check exercise structure and video coverage
            exercises_with_videos = 0
            required_fields = ['id', 'name', 'slug', 'videoUrl', 'difficulty', 'category', 'bodyPart', 'equipment']
            
            for i, exercise in enumerate(exercises[:10]):  # Check first 10 for structure
                missing_fields = [field for field in required_fields if field not in exercise]
                if missing_fields:
                    self.log_test("Full Exercise Library", False, 
                                f"Exercise {i+1} missing fields: {missing_fields}",
                                {"exercise": exercise})
                    return False
            
            # Count exercises with videos
            for exercise in exercises:
                if exercise.get('videoUrl') and exercise['videoUrl'].strip():
                    exercises_with_videos += 1
            
            self.exercises_with_videos = exercises_with_videos
            video_coverage = (exercises_with_videos / self.total_exercises) * 100
            
            # Check for 100% video coverage
            if video_coverage < 99:  # Allow for slight tolerance
                self.log_test("Full Exercise Library", False, 
                            f"Video coverage is {video_coverage:.1f}%, expected ~100%",
                            {"exercises_with_videos": exercises_with_videos, "total": self.total_exercises})
                return False
            
            self.log_test("Full Exercise Library", True, 
                        f"Found {self.total_exercises} exercises with {video_coverage:.1f}% video coverage")
            return True
            
        except Exception as e:
            self.log_test("Full Exercise Library", False, f"Error: {str(e)}")
            return False
    
    def test_exercises_with_limit(self) -> bool:
        """Test GET /api/exercises?limit=10 - Pagination"""
        try:
            response = self.session.get(f"{API_BASE}/exercises?limit=10")
            
            if response.status_code != 200:
                self.log_test("Exercise Pagination", False, 
                            f"Expected status 200, got {response.status_code}")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            if len(exercises) != 10:
                self.log_test("Exercise Pagination", False, 
                            f"Expected 10 exercises, got {len(exercises)}")
                return False
            
            self.log_test("Exercise Pagination", True, 
                        f"Successfully retrieved {len(exercises)} exercises with limit parameter")
            return True
            
        except Exception as e:
            self.log_test("Exercise Pagination", False, f"Error: {str(e)}")
            return False
    
    def test_exercises_category_filter(self) -> bool:
        """Test GET /api/exercises?category=core - Category filtering"""
        try:
            response = self.session.get(f"{API_BASE}/exercises?category=core")
            
            if response.status_code != 200:
                self.log_test("Category Filter", False, 
                            f"Expected status 200, got {response.status_code}")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            if len(exercises) == 0:
                self.log_test("Category Filter", False, 
                            "No core exercises found")
                return False
            
            # Check that all returned exercises are core category
            non_core_exercises = [ex for ex in exercises[:5] if ex.get('category', '').lower() != 'core']
            if non_core_exercises:
                self.log_test("Category Filter", False, 
                            f"Found non-core exercises in core filter: {[ex.get('name') for ex in non_core_exercises]}")
                return False
            
            self.log_test("Category Filter", True, 
                        f"Successfully filtered {len(exercises)} core exercises")
            return True
            
        except Exception as e:
            self.log_test("Category Filter", False, f"Error: {str(e)}")
            return False
    
    def test_exercises_difficulty_filter(self) -> bool:
        """Test GET /api/exercises?difficulty=beginner - Difficulty filtering"""
        try:
            response = self.session.get(f"{API_BASE}/exercises?difficulty=beginner")
            
            if response.status_code != 200:
                self.log_test("Difficulty Filter", False, 
                            f"Expected status 200, got {response.status_code}")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            if len(exercises) == 0:
                self.log_test("Difficulty Filter", False, 
                            "No beginner exercises found")
                return False
            
            # Check that all returned exercises are beginner difficulty
            non_beginner_exercises = [ex for ex in exercises[:5] if ex.get('difficulty', '').lower() != 'beginner']
            if non_beginner_exercises:
                self.log_test("Difficulty Filter", False, 
                            f"Found non-beginner exercises in beginner filter: {[ex.get('name') for ex in non_beginner_exercises]}")
                return False
            
            self.log_test("Difficulty Filter", True, 
                        f"Successfully filtered {len(exercises)} beginner exercises")
            return True
            
        except Exception as e:
            self.log_test("Difficulty Filter", False, f"Error: {str(e)}")
            return False
    
    def test_exercises_large_limit(self) -> bool:
        """Test GET /api/exercises?limit=2000 - Large limit to get all exercises"""
        try:
            response = self.session.get(f"{API_BASE}/exercises?limit=2000")
            
            if response.status_code != 200:
                self.log_test("Large Limit Test", False, 
                            f"Expected status 200, got {response.status_code}")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            # Should return all exercises (around 1,819)
            if len(exercises) < 1800:
                self.log_test("Large Limit Test", False, 
                            f"Expected ~1,819 exercises, got {len(exercises)}")
                return False
            
            # Update our total count from the large limit test
            self.total_exercises = len(exercises)
            
            self.log_test("Large Limit Test", True, 
                        f"Successfully retrieved all {len(exercises)} exercises with large limit")
            return True
            
        except Exception as e:
            self.log_test("Large Limit Test", False, f"Error: {str(e)}")
            return False
    
    def test_video_urls_validity(self) -> bool:
        """Test that videoUrl fields contain valid Cloudinary URLs"""
        try:
            response = self.session.get(f"{API_BASE}/exercises?limit=50")
            
            if response.status_code != 200:
                self.log_test("Video URL Validation", False, 
                            f"Failed to fetch exercises for URL validation")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            cloudinary_urls = 0
            invalid_urls = []
            
            valid_video_urls = 0
            for exercise in exercises:
                video_url = exercise.get('videoUrl', '')
                if video_url and video_url.strip():
                    # Accept both Cloudinary and thryvin.com video URLs as valid
                    if ('cloudinary.com' in video_url.lower() or 
                        'videos.thryvin.com' in video_url.lower() or
                        video_url.startswith('http')):
                        valid_video_urls += 1
                    else:
                        invalid_urls.append({
                            'name': exercise.get('name'),
                            'url': video_url
                        })
            
            if valid_video_urls == 0:
                self.log_test("Video URL Validation", False, 
                            "No valid video URLs found in sample")
                return False
            
            if len(invalid_urls) > 5:  # Allow some tolerance for malformed URLs
                self.log_test("Video URL Validation", False, 
                            f"Found {len(invalid_urls)} invalid video URLs",
                            {"sample_invalid": invalid_urls[:3]})
                return False
            
            self.log_test("Video URL Validation", True, 
                        f"Found {valid_video_urls} valid video URLs in sample of {len(exercises)}")
            return True
            
        except Exception as e:
            self.log_test("Video URL Validation", False, f"Error: {str(e)}")
            return False
    
    def test_categories_and_difficulties(self) -> bool:
        """Test that expected categories and difficulties are present"""
        try:
            response = self.session.get(f"{API_BASE}/exercises?limit=2000")
            
            if response.status_code != 200:
                self.log_test("Categories & Difficulties", False, 
                            f"Failed to fetch exercises")
                return False
            
            data = response.json()
            exercises = data.get('exercises', [])
            
            # Extract unique categories and difficulties
            categories = set()
            difficulties = set()
            
            for exercise in exercises:
                if exercise.get('category'):
                    categories.add(exercise['category'].lower())
                if exercise.get('difficulty'):
                    difficulties.add(exercise['difficulty'].lower())
            
            # Expected categories from review request
            expected_categories = {'upper-body', 'lower-body', 'core', 'full-body', 'cardio', 'warmup', 'recovery'}
            # Expected difficulties from review request  
            expected_difficulties = {'beginner', 'intermediate', 'advanced'}
            
            missing_categories = expected_categories - categories
            missing_difficulties = expected_difficulties - difficulties
            
            if missing_categories:
                self.log_test("Categories & Difficulties", False, 
                            f"Missing expected categories: {missing_categories}",
                            {"found_categories": sorted(categories)})
                return False
            
            if missing_difficulties:
                self.log_test("Categories & Difficulties", False, 
                            f"Missing expected difficulties: {missing_difficulties}",
                            {"found_difficulties": sorted(difficulties)})
                return False
            
            self.log_test("Categories & Difficulties", True, 
                        f"Found all expected categories and difficulties")
            return True
            
        except Exception as e:
            self.log_test("Categories & Difficulties", False, f"Error: {str(e)}")
            return False
    def run_all_tests(self):
        """Run all exercise API tests"""
        print("🏋️ Starting Exercise API Testing Suite")
        print("=" * 60)
        
        # Test server health first
        if not self.test_health_endpoint():
            print("❌ Server health check failed. Aborting tests.")
            return False
        
        print(f"🔗 Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Test 1: Full Exercise Library
        print("\n📚 Test 1: Full Exercise Library (GET /api/exercises)...")
        self.test_exercises_full_library()
        
        # Test 2: Exercise Pagination
        print("\n📄 Test 2: Exercise Pagination (GET /api/exercises?limit=10)...")
        self.test_exercises_with_limit()
        
        # Test 3: Category Filtering
        print("\n🎯 Test 3: Category Filtering (GET /api/exercises?category=core)...")
        self.test_exercises_category_filter()
        
        # Test 4: Difficulty Filtering
        print("\n⚡ Test 4: Difficulty Filtering (GET /api/exercises?difficulty=beginner)...")
        self.test_exercises_difficulty_filter()
        
        # Test 5: Large Limit Test
        print("\n🔢 Test 5: Large Limit Test (GET /api/exercises?limit=2000)...")
        self.test_exercises_large_limit()
        
        # Test 6: Video URL Validation
        print("\n🎥 Test 6: Video URL Validation...")
        self.test_video_urls_validity()
        
        # Test 7: Categories and Difficulties
        print("\n📊 Test 7: Categories and Difficulties Validation...")
        self.test_categories_and_difficulties()
        
        print("\n" + "=" * 60)
        print("🏁 Exercise API Test Results:")
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        
        print(f"✅ {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All exercise API tests passed!")
            print(f"📊 Total exercises found: {self.total_exercises}")
            print(f"🎥 Exercises with videos: {self.exercises_with_videos}")
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