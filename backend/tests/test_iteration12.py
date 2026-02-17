"""
Test file for Iteration 12 - Testing coach chat API and code review verification
Tests: /api/health, /api/exercises (exact matching), /api/coach/chat (with auth)
Code review: FloatingCoachButton, ProPaywallModal, billing, AppHeader, workout-hub, workouts, index, awards-store, pro
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001').rstrip('/')

class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_ok(self):
        """Verify /api/health returns ok: true"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        assert "timestamp" in data
        print("✅ Health endpoint returns ok: true")


class TestExerciseExactMatching:
    """Exercise API exact matching tests"""
    
    def test_exact_match_barbell_bench_press(self):
        """GET /api/exercises?names=Barbell Bench Press returns exactly 1 result"""
        response = requests.get(f"{BASE_URL}/api/exercises", params={"names": "Barbell Bench Press"})
        assert response.status_code == 200
        data = response.json()
        assert data.get("total") == 1
        assert len(data.get("exercises", [])) == 1
        assert data["exercises"][0]["name"] == "Barbell Bench Press"
        print("✅ Exact match for 'Barbell Bench Press' returns 1 result")


class TestCoachChatAPI:
    """Coach chat API tests with authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token from test user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        if response.status_code != 200:
            pytest.skip("Test user login failed - skipping authenticated tests")
        return response.json().get("accessToken")
    
    def test_coach_chat_requires_auth(self):
        """POST /api/coach/chat without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/coach/chat", json={
            "message": "Hello",
            "coach": "nate-green"
        })
        assert response.status_code == 401
        data = response.json()
        assert data.get("code") == "AUTH_REQUIRED"
        print("✅ Coach chat correctly requires authentication")
    
    def test_coach_chat_with_auth_returns_response(self, auth_token):
        """POST /api/coach/chat with auth returns a response"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Hello coach!",
                "coach": "nate-green"
            },
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"✅ Coach chat returns response: {data['response'][:50]}...")


class TestCodeReviewFloatingCoachButton:
    """Code review: FloatingCoachButton.tsx line ~497"""
    
    def test_help_keyword_matching(self):
        """Verify 'help' keyword only matches explicit requests, not conversational usage"""
        file_path = "/app/apps/native/src/components/FloatingCoachButton.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Find the help matching line (around line 497)
        # Expected: if (lower === 'help' || lower === 'commands' || lower.includes('what can you do') || ...)
        help_match_pattern = r"if\s*\(\s*lower\s*===\s*['\"]help['\"]"
        match = re.search(help_match_pattern, content)
        assert match, "Help keyword matching should use strict equality (===)"
        
        # Verify it does NOT use .includes('help') - which would match "Can you help?"
        bad_pattern = r"lower\.includes\(['\"]help['\"]"
        bad_match = re.search(bad_pattern, content)
        assert not bad_match, "Should NOT use lower.includes('help') - would match conversational 'Can you help?'"
        
        # Verify 'what can you do' and 'how can you help me' are included
        assert "what can you do" in content.lower(), "'what can you do' should be a valid help trigger"
        assert "how can you help me" in content.lower(), "'how can you help me' should be a valid help trigger"
        
        print("✅ Help keyword correctly uses strict matching (===), not .includes('help')")


class TestCodeReviewProPaywallModal:
    """Code review: ProPaywallModal.tsx lines 27-34, 122"""
    
    def test_pricing_shows_correct_amount(self):
        """Verify pricing shows £6.25/mo (not £5.75)"""
        file_path = "/app/apps/native/src/components/ProPaywallModal.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Check for £6.25 price
        assert "£6.25" in content, "Price should show £6.25/mo"
        assert "£5.75" not in content, "Price should NOT show £5.75"
        print("✅ ProPaywallModal shows correct price: £6.25/mo")
    
    def test_features_include_nutrition_social(self):
        """Verify features include 'Nutrition & social features' with 'Coming soon' subtitle"""
        file_path = "/app/apps/native/src/components/ProPaywallModal.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Check for Nutrition & social features
        assert "Nutrition & social features" in content, "Should include 'Nutrition & social features'"
        assert "Coming soon" in content, "Should include 'Coming soon' subtitle"
        print("✅ ProPaywallModal includes 'Nutrition & social features' with 'Coming soon'")
    
    def test_no_coach_personality_selection(self):
        """Verify 'Coach personality selection' is NOT in features"""
        file_path = "/app/apps/native/src/components/ProPaywallModal.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Check that Coach personality selection is NOT included
        assert "Coach personality selection" not in content, "Should NOT include 'Coach personality selection'"
        assert "coach personality" not in content.lower() or "change coach personality" in content.lower(), \
            "Should NOT include coach personality as a Pro feature"
        print("✅ ProPaywallModal does NOT include 'Coach personality selection'")


class TestCodeReviewBilling:
    """Code review: billing.tsx lines 33-50, 55-61, 206-221"""
    
    def test_only_two_plans(self):
        """Verify only 2 plans: Monthly £7.99 and Yearly £74.99"""
        file_path = "/app/apps/native/app/billing.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Check PLANS constant structure
        assert "'monthly'" in content or '"monthly"' in content, "Should have monthly plan"
        assert "'yearly'" in content or '"yearly"' in content, "Should have yearly plan"
        assert "'quarterly'" not in content and '"quarterly"' not in content, "Should NOT have quarterly plan"
        assert "'3-month'" not in content and '"3-month"' not in content, "Should NOT have 3-month plan"
        
        # Check prices
        assert "7.99" in content, "Monthly price should be £7.99"
        assert "74.99" in content, "Yearly price should be £74.99"
        print("✅ Billing has only 2 plans: Monthly £7.99 and Yearly £74.99")
    
    def test_yearly_shows_as_monthly_equivalent(self):
        """Verify yearly shows as £6.25/month marketing style"""
        file_path = "/app/apps/native/app/billing.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        assert "6.25" in content, "Yearly should show £6.25/month equivalent"
        print("✅ Yearly plan shows £6.25/month equivalent")
    
    def test_billing_features_no_coach_personality(self):
        """Verify billing features don't include 'Coach personality selection'"""
        file_path = "/app/apps/native/app/billing.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        assert "Coach personality selection" not in content, "Should NOT include 'Coach personality selection'"
        print("✅ Billing features do NOT include 'Coach personality selection'")
    
    def test_billing_features_include_nutrition_social(self):
        """Verify billing features include 'Nutrition & social features' coming soon"""
        file_path = "/app/apps/native/app/billing.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        assert "Nutrition & social" in content, "Should include 'Nutrition & social features'"
        assert "Coming soon" in content, "Should include 'Coming soon' subtitle"
        print("✅ Billing features include 'Nutrition & social' with 'Coming soon'")


class TestCodeReviewAppHeader:
    """Code review: AppHeader.tsx lines 157-166"""
    
    def test_pro_badge_conditional_on_ispro(self):
        """Verify Pro badge only shows when isPro is true"""
        file_path = "/app/apps/native/src/components/AppHeader.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Check for conditional rendering: {isPro && (...PRO badge...)}
        assert "{isPro &&" in content or "isPro &&" in content, "Pro badge should be conditionally rendered with isPro"
        print("✅ Pro badge is conditionally rendered based on isPro")
    
    def test_pro_badge_uses_linear_gradient(self):
        """Verify Pro badge uses LinearGradient instead of flat View"""
        file_path = "/app/apps/native/src/components/AppHeader.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Find the Pro badge section and check for LinearGradient
        assert "LinearGradient" in content, "Pro badge should use LinearGradient"
        
        # Look for the pattern: isPro && ... LinearGradient ... PRO
        # This verifies the gradient is used for the Pro badge specifically
        pro_section_match = re.search(r'isPro\s*&&[\s\S]*?LinearGradient[\s\S]*?PRO', content)
        assert pro_section_match, "Pro badge section should contain LinearGradient"
        print("✅ Pro badge uses LinearGradient")


class TestCodeReviewWorkoutHub:
    """Code review: workout-hub.tsx line 727-730"""
    
    def test_handle_edit_workout_checks_ispro(self):
        """Verify handleEditWorkout checks isPro and shows paywall if not Pro"""
        file_path = "/app/apps/native/app/workout-hub.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Find handleEditWorkout function
        func_pattern = r'handleEditWorkout\s*=\s*\(\)\s*=>\s*\{[\s\S]*?if\s*\(\s*!isPro\s*\)'
        match = re.search(func_pattern, content)
        assert match, "handleEditWorkout should check !isPro"
        
        # Check that it shows paywall
        assert "setShowProPaywall(true)" in content, "Should show paywall when not Pro"
        print("✅ handleEditWorkout checks isPro and shows paywall")


class TestCodeReviewWorkouts:
    """Code review: workouts.tsx lines 603-616, 663-670"""
    
    def test_edit_plan_button_gated(self):
        """Verify Edit Plan button checks isPro and shows paywall if not Pro"""
        file_path = "/app/apps/native/app/(tabs)/workouts.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Find Edit Plan button onPress with isPro check
        # Pattern: onPress={() => { if (!isPro) { ... setShowProPaywall
        edit_plan_pattern = r'onPress=\{\(\)\s*=>\s*\{[\s\S]*?if\s*\(\s*!isPro\s*\)[\s\S]*?setShowProPaywall\(true\)[\s\S]*?setShowEditPlan'
        match = re.search(edit_plan_pattern, content)
        assert match, "Edit Plan button should check !isPro and show paywall"
        print("✅ Edit Plan button is gated for Standard users")
    
    def test_view_all_weeks_modal_edit_gated(self):
        """Verify ViewAllWeeksModal onEditPress checks isPro"""
        file_path = "/app/apps/native/app/(tabs)/workouts.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Find ViewAllWeeksModal with onEditPress checking isPro
        pattern = r'ViewAllWeeksModal[\s\S]*?onEditPress=\{\(\)\s*=>\s*\{[\s\S]*?if\s*\(\s*!isPro\s*\)'
        match = re.search(pattern, content)
        assert match, "ViewAllWeeksModal onEditPress should check !isPro"
        print("✅ ViewAllWeeksModal onEditPress is gated for Standard users")


class TestCodeReviewIndex:
    """Code review: index.tsx lines 1136-1143"""
    
    def test_index_view_all_weeks_modal_edit_gated(self):
        """Verify ViewAllWeeksModal onEditPress in index.tsx checks isPro"""
        file_path = "/app/apps/native/app/(tabs)/index.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Find ViewAllWeeksModal with onEditPress checking isPro
        pattern = r'ViewAllWeeksModal[\s\S]*?onEditPress=\{\(\)\s*=>\s*\{[\s\S]*?if\s*\(\s*!isPro\s*\)'
        match = re.search(pattern, content)
        assert match, "ViewAllWeeksModal onEditPress in index.tsx should check !isPro"
        print("✅ index.tsx ViewAllWeeksModal onEditPress is gated for Standard users")


class TestCodeReviewAwardsStore:
    """Code review: awards-store.ts lines 37, 976-983"""
    
    def test_island_2_requires_20_badges(self):
        """Verify requiredBadges for island 2 is 20 (100%)"""
        file_path = "/app/apps/native/src/stores/awards-store.ts"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Find island 2 definition with requiredBadges: 20
        pattern = r'id:\s*2[\s\S]*?requiredBadges:\s*20'
        match = re.search(pattern, content)
        assert match, "Island 2 should require 20 badges (100% of Island 1)"
        print("✅ Island 2 requires 20 badges (100% completion)")
    
    def test_island_progression_uses_full_count(self):
        """Verify island progression uses currentIslandBadges.length (not 0.8 multiplier)"""
        file_path = "/app/apps/native/src/stores/awards-store.ts"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Check for: requiredForNextIsland = currentIslandBadges.length (not * 0.8)
        assert "currentIslandBadges.length" in content, "Should use currentIslandBadges.length"
        
        # Ensure 0.8 multiplier is NOT used for island progression
        bad_pattern = r'currentIslandBadges\.length\s*\*\s*0\.8'
        bad_match = re.search(bad_pattern, content)
        assert not bad_match, "Should NOT use 0.8 multiplier for island progression"
        print("✅ Island progression uses full badge count (not 0.8 multiplier)")


class TestCodeReviewPro:
    """Code review: pro.tsx lines 30-38, 89-96"""
    
    def test_pro_features_no_coach_personality(self):
        """Verify PRO_FEATURES does NOT include 'Coach personality'"""
        file_path = "/app/apps/native/app/(tabs)/pro.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Check PRO_FEATURES constant does not include coach personality
        assert "Coach personality" not in content, "PRO_FEATURES should NOT include 'Coach personality'"
        print("✅ PRO_FEATURES does NOT include 'Coach personality'")
    
    def test_plan_chips_only_monthly_and_yearly(self):
        """Verify plan chips show only Monthly and Yearly (no 3-Month)"""
        file_path = "/app/apps/native/app/(tabs)/pro.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        # Find planChips array with Monthly and Yearly
        # Should be: ['Monthly', 'Yearly']
        assert "'Monthly'" in content or '"Monthly"' in content, "Should have Monthly chip"
        assert "'Yearly'" in content or '"Yearly"' in content, "Should have Yearly chip"
        assert "'3-Month'" not in content and '"3-Month"' not in content, "Should NOT have 3-Month chip"
        assert "'Quarterly'" not in content and '"Quarterly"' not in content, "Should NOT have Quarterly chip"
        print("✅ Plan chips show only Monthly and Yearly")
    
    def test_price_from_6_25_mo(self):
        """Verify price shows 'From £6.25/mo*'"""
        file_path = "/app/apps/native/app/(tabs)/pro.tsx"
        
        with open(file_path, "r") as f:
            content = f.read()
        
        assert "£6.25/mo" in content or "6.25/mo" in content, "Price should show 'From £6.25/mo*'"
        print("✅ Price shows 'From £6.25/mo*'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
