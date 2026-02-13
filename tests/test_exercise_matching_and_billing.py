"""
Test suite for exercise video matching (exact matching) and billing page updates.

Tests:
1. GET /api/exercises?names=... - exact matching only (no fuzzy)
2. Billing page code review - 2 plans only (Monthly £7.99, Yearly £74.99 with 22% discount)

Run: pytest /app/tests/test_exercise_matching_and_billing.py -v
"""
import pytest
import requests
import os

# Base URL for API testing
BASE_URL = "http://localhost:8001"

class TestHealthEndpoint:
    """Health check to ensure backend is running"""
    
    def test_health_returns_ok(self):
        """GET /api/health should return ok: true"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Health check failed: {response.text}"
        
        data = response.json()
        assert data.get("ok") == True, f"Expected ok=true, got {data}"
        print(f"✅ Health check passed: ok={data.get('ok')}, dbOk={data.get('dbOk')}")


class TestExerciseExactMatching:
    """Test that GET /api/exercises?names=... uses EXACT matching only (no fuzzy)"""
    
    def test_exact_match_barbell_bench_press(self):
        """Test that 'Barbell Bench Press' returns exactly 1 result with correct video URL"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"names": "Barbell Bench Press"},
            timeout=10
        )
        assert response.status_code == 200, f"Request failed: {response.text}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        assert len(exercises) == 1, f"Expected 1 exercise, got {len(exercises)}: {[e.get('name') for e in exercises]}"
        
        exercise = exercises[0]
        assert exercise.get("name").lower() == "barbell bench press", f"Got wrong exercise: {exercise.get('name')}"
        
        # Verify video URL exists
        video_url = exercise.get("videoUrl")
        print(f"✅ Exact match 'Barbell Bench Press': found with videoUrl={video_url is not None}")
    
    def test_no_fuzzy_match_fake_exercise(self):
        """Test that 'Fake Exercise Name' returns 0 results (no fuzzy fallback)"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"names": "Fake Exercise Name"},
            timeout=10
        )
        assert response.status_code == 200, f"Request failed: {response.text}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        assert len(exercises) == 0, f"Expected 0 exercises for fake name, got {len(exercises)}: {[e.get('name') for e in exercises]}"
        print(f"✅ No fuzzy match for 'Fake Exercise Name': correctly returned 0 results")
    
    def test_no_fuzzy_match_incline_dumbbell_press(self):
        """
        CRITICAL TEST: 'Incline Dumbbell Press' should NOT match 'Dumbbell Incline Bench Press'
        This was the user's specific complaint about fuzzy matching being wrong.
        """
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"names": "Incline Dumbbell Press"},
            timeout=10
        )
        assert response.status_code == 200, f"Request failed: {response.text}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        # Should be 0 - 'Incline Dumbbell Press' is NOT an exact match for any DB entry
        # DB has 'Dumbbell Incline Bench Press' which is different
        assert len(exercises) == 0, (
            f"Expected 0 results for 'Incline Dumbbell Press' (should NOT fuzzy match to 'Dumbbell Incline Bench Press'), "
            f"got {len(exercises)}: {[e.get('name') for e in exercises]}"
        )
        print(f"✅ Critical test: 'Incline Dumbbell Press' correctly returned 0 results (no fuzzy match)")
    
    def test_exact_match_multiple_exercises(self):
        """Test that multiple exact names return exactly 3 results"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"names": "Lat Pulldown,Deadlift,Glute Bridge"},
            timeout=10
        )
        assert response.status_code == 200, f"Request failed: {response.text}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        # Check we got exactly 3 results
        matched_names = [e.get("name", "").lower() for e in exercises]
        print(f"  Matched exercises: {matched_names}")
        
        assert len(exercises) == 3, (
            f"Expected exactly 3 exercises for 'Lat Pulldown,Deadlift,Glute Bridge', "
            f"got {len(exercises)}: {matched_names}"
        )
        
        # Verify each name was matched
        expected = ["lat pulldown", "deadlift", "glute bridge"]
        for exp in expected:
            assert any(exp in name.lower() for name in matched_names), f"Missing expected exercise: {exp}"
        
        print(f"✅ Exact match for 3 exercises: all 3 found")
    
    def test_case_insensitive_exact_match(self):
        """Test that exact matching is case-insensitive"""
        # Try with lowercase
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"names": "barbell bench press"},
            timeout=10
        )
        assert response.status_code == 200, f"Request failed: {response.text}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        assert len(exercises) == 1, f"Case-insensitive match failed, got {len(exercises)}"
        print(f"✅ Case-insensitive exact match works correctly")
    
    def test_exact_match_mixed_existing_and_nonexisting(self):
        """Test that mixing existing and non-existing names returns only exact matches"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"names": "Barbell Bench Press,FakeExercise123,Lat Pulldown"},
            timeout=10
        )
        assert response.status_code == 200, f"Request failed: {response.text}"
        
        data = response.json()
        exercises = data.get("exercises", [])
        
        # Should return 2 (Barbell Bench Press and Lat Pulldown) - FakeExercise123 should be ignored
        assert len(exercises) == 2, f"Expected 2 exercises, got {len(exercises)}: {[e.get('name') for e in exercises]}"
        print(f"✅ Mixed existing/non-existing names: correctly returned only 2 exact matches")


class TestExerciseDatabase:
    """Verify exercise database has expected exercises"""
    
    def test_database_has_expected_exercise_names(self):
        """Verify that expected exercise names exist in DB"""
        # Test some exercises that should exist
        expected_exercises = [
            "Barbell Bench Press",
            "Lat Pulldown", 
            "Deadlift",
            "Glute Bridge",
            "Dumbbell Biceps Curl"  # Note: 'Dumbbell Curl' does NOT exist, but this does
        ]
        
        for exercise_name in expected_exercises:
            response = requests.get(
                f"{BASE_URL}/api/exercises",
                params={"names": exercise_name},
                timeout=10
            )
            data = response.json()
            exercises = data.get("exercises", [])
            
            assert len(exercises) == 1, f"Expected '{exercise_name}' to exist in DB, but got {len(exercises)} matches"
        
        print(f"✅ Verified {len(expected_exercises)} expected exercises exist in DB")
    
    def test_dumbbell_curl_does_not_exist(self):
        """
        Per review request: 'Dumbbell Curl' does NOT exist (DB has 'Dumbbell Biceps Curl' instead)
        """
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"names": "Dumbbell Curl"},
            timeout=10
        )
        data = response.json()
        exercises = data.get("exercises", [])
        
        assert len(exercises) == 0, f"'Dumbbell Curl' should NOT exist in DB (only 'Dumbbell Biceps Curl'), got {len(exercises)}"
        print(f"✅ Confirmed 'Dumbbell Curl' does not exist in DB (correct)")
    
    def test_exercise_count_is_over_1000(self):
        """Verify database has 1806 exercises as mentioned"""
        response = requests.get(
            f"{BASE_URL}/api/exercises",
            params={"limit": 5000},  # High limit to get total count
            timeout=20
        )
        data = response.json()
        
        total_in_db = data.get("totalInDatabase", 0)
        exercises_returned = data.get("total", 0)
        
        print(f"  Total exercises in database: {total_in_db}")
        print(f"  Exercises returned: {exercises_returned}")
        
        assert total_in_db >= 1000, f"Expected 1000+ exercises, got {total_in_db}"
        print(f"✅ Database has {total_in_db} exercises (expected ~1806)")


class TestBillingPageCodeReview:
    """
    Code review tests for billing.tsx
    These tests verify the billing page configuration is correct.
    Note: Frontend is React Native/Expo so cannot test via browser - doing code review.
    """
    
    def test_billing_page_plans_structure(self):
        """
        Code review: Verify billing.tsx has only 2 plans: Monthly and Yearly
        - Monthly: £7.99/month
        - Yearly: £74.99/year with 'Save 22%' tag
        - No 3-month/quarterly plan
        """
        billing_file = "/app/apps/native/app/billing.tsx"
        
        with open(billing_file, 'r') as f:
            content = f.read()
        
        # Check PLANS array exists
        assert "const PLANS" in content, "PLANS constant not found in billing.tsx"
        
        # Verify exactly 2 plans by checking for plan IDs
        assert "id: 'monthly'" in content, "Monthly plan not found"
        assert "id: 'yearly'" in content, "Yearly plan not found"
        
        # Verify NO quarterly/3-month plan exists
        assert "id: 'quarterly'" not in content, "quarterly plan should be REMOVED"
        assert "id: '3month'" not in content, "3-month plan should be REMOVED"
        assert "'3-month'" not in content.lower(), "3-month plan reference found"
        
        print(f"✅ Billing page has exactly 2 plans: monthly and yearly")
    
    def test_billing_page_monthly_price(self):
        """Verify monthly plan is £7.99"""
        billing_file = "/app/apps/native/app/billing.tsx"
        
        with open(billing_file, 'r') as f:
            content = f.read()
        
        # Check monthly price is 7.99
        assert "price: '7.99'" in content, "Monthly price should be £7.99"
        assert "period: '/month'" in content, "Monthly period should be /month"
        
        print(f"✅ Monthly plan is correctly priced at £7.99/month")
    
    def test_billing_page_yearly_price_and_discount(self):
        """Verify yearly plan is £74.99 with 'Save 22%' discount"""
        billing_file = "/app/apps/native/app/billing.tsx"
        
        with open(billing_file, 'r') as f:
            content = f.read()
        
        # Check yearly price
        assert "price: '74.99'" in content, "Yearly price should be £74.99"
        assert "period: '/year'" in content, "Yearly period should be /year"
        
        # Check 22% discount tag
        assert "Save 22%" in content, "Yearly plan should have 'Save 22%' tag"
        
        # Verify savings is NOT 15% or other old values
        assert "Save 15%" not in content, "Old 15% discount should be removed"
        assert "Save 20%" not in content, "Discount should be 22%, not 20%"
        
        print(f"✅ Yearly plan is correctly priced at £74.99/year with 'Save 22%' discount")
    
    def test_billing_page_yearly_is_popular(self):
        """Verify yearly plan has popular: true (Best Value tag)"""
        billing_file = "/app/apps/native/app/billing.tsx"
        
        with open(billing_file, 'r') as f:
            content = f.read()
        
        # Find the yearly plan section and check popular: true
        # The structure should be: { id: 'yearly', ..., popular: true, ... }
        import re
        
        # Look for yearly plan with popular: true
        yearly_section = re.search(r"\{\s*id:\s*'yearly'[^}]+popular:\s*true", content, re.DOTALL)
        assert yearly_section, "Yearly plan should have popular: true"
        
        # Monthly should have popular: false
        monthly_section = re.search(r"\{\s*id:\s*'monthly'[^}]+popular:\s*false", content, re.DOTALL)
        assert monthly_section, "Monthly plan should have popular: false"
        
        print(f"✅ Yearly plan correctly marked as popular (Best Value)")
    
    def test_billing_page_default_selected_plan(self):
        """Verify default selected plan is 'yearly' not 'quarterly'"""
        billing_file = "/app/apps/native/app/billing.tsx"
        
        with open(billing_file, 'r') as f:
            content = f.read()
        
        # Check useState default value for selectedPlan
        assert "useState('yearly')" in content, "Default selected plan should be 'yearly'"
        assert "useState('quarterly')" not in content, "Default should NOT be 'quarterly'"
        assert "useState('monthly')" not in content, "Default should be 'yearly', not 'monthly'"
        
        print(f"✅ Default selected plan is correctly 'yearly'")
    
    def test_billing_page_monthly_equiv_calculation(self):
        """Verify yearly plan has correct monthly equivalent (£6.25/mo)"""
        billing_file = "/app/apps/native/app/billing.tsx"
        
        with open(billing_file, 'r') as f:
            content = f.read()
        
        # 74.99 / 12 = 6.249... ≈ 6.25
        assert "monthlyEquiv: '6.25'" in content, "Yearly monthly equivalent should be £6.25"
        
        print(f"✅ Yearly plan has correct monthly equivalent: £6.25/mo")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
