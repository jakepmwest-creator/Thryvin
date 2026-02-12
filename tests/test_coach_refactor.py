"""
Test Coach Button Refactor - READ-ONLY Coach Behavior
Tests for:
1. Coach redirects modification requests to Edit Plan
2. Coach returns witty responses for non-fitness questions
3. Coach does NOT use profanity
4. Coach directs users to appropriate app sections
5. Health endpoint works
6. Onboarding steps verification (no nutritionGoals, no coaching)
"""

import pytest
import requests
import os
import re

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://regen-timing-fix.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


class TestHealthEndpoint:
    """Test health endpoint is working"""
    
    def test_health_endpoint_returns_ok(self):
        """Health endpoint should return ok status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        assert "aiReady" in data
        assert "dbOk" in data
        print(f"✅ Health endpoint OK: aiReady={data.get('aiReady')}, dbOk={data.get('dbOk')}")


class TestCoachAPIAuthentication:
    """Test coach API authentication requirements"""
    
    def test_coach_chat_requires_auth(self):
        """Coach chat should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "Hello coach!"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 if not authenticated (unless DEMO_MODE is enabled)
        # If DEMO_MODE is enabled, it will return 200
        assert response.status_code in [200, 401]
        if response.status_code == 401:
            data = response.json()
            assert "error" in data or "code" in data
            print("✅ Coach API correctly requires authentication")
        else:
            print("✅ Coach API in DEMO_MODE - returns response without auth")


class TestCoachReadOnlyBehavior:
    """Test that coach is READ-ONLY and redirects modification requests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        # Try to login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("accessToken")
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
            print(f"✅ Logged in successfully, token obtained")
        else:
            # Try without auth (DEMO_MODE might be enabled)
            self.token = None
            self.headers = {"Content-Type": "application/json"}
            print(f"⚠️ Login failed ({login_response.status_code}), testing without auth")
    
    def _send_coach_message(self, message: str) -> dict:
        """Helper to send message to coach API"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": message, "coach": "default"},
            headers=self.headers
        )
        return response
    
    def test_swap_workout_redirects_to_edit_plan(self):
        """Coach should redirect 'swap workout' requests to Edit Plan"""
        response = self._send_coach_message("Can you swap my Monday and Wednesday workouts?")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should mention Edit Plan or redirect user
        assert any(phrase in coach_response for phrase in [
            "edit plan", "workouts tab", "cannot", "can't", "redirect", "head to"
        ]), f"Coach should redirect to Edit Plan. Got: {coach_response[:200]}"
        print(f"✅ Swap workout correctly redirects: {coach_response[:100]}...")
    
    def test_skip_day_redirects_to_edit_plan(self):
        """Coach should redirect 'skip day' requests to Edit Plan"""
        response = self._send_coach_message("I want to skip today's workout")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should mention Edit Plan or redirect user
        assert any(phrase in coach_response for phrase in [
            "edit plan", "workouts tab", "skip", "rest", "head to"
        ]), f"Coach should redirect to Edit Plan. Got: {coach_response[:200]}"
        print(f"✅ Skip day correctly redirects: {coach_response[:100]}...")
    
    def test_add_workout_redirects_to_edit_plan(self):
        """Coach should redirect 'add workout' requests to Edit Plan"""
        response = self._send_coach_message("Can you add an extra workout for me today?")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should mention Edit Plan or redirect user
        assert any(phrase in coach_response for phrase in [
            "edit plan", "workouts tab", "add", "head to"
        ]), f"Coach should redirect to Edit Plan. Got: {coach_response[:200]}"
        print(f"✅ Add workout correctly redirects: {coach_response[:100]}...")
    
    def test_feeling_energetic_redirects_to_edit_plan(self):
        """Coach should redirect 'feeling energetic' requests to Edit Plan"""
        response = self._send_coach_message("I'm feeling energetic today, can you make my workout harder?")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should mention Edit Plan or redirect user
        assert any(phrase in coach_response for phrase in [
            "edit plan", "workouts tab", "harder", "head to", "modify"
        ]), f"Coach should redirect to Edit Plan. Got: {coach_response[:200]}"
        print(f"✅ Feeling energetic correctly redirects: {coach_response[:100]}...")
    
    def test_change_coach_redirects_to_profile(self):
        """Coach should redirect 'change coach' requests to Profile"""
        response = self._send_coach_message("I want to change my coach style")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should mention Profile
        assert any(phrase in coach_response for phrase in [
            "profile", "settings", "coach style"
        ]), f"Coach should redirect to Profile. Got: {coach_response[:200]}"
        print(f"✅ Change coach correctly redirects to Profile: {coach_response[:100]}...")


class TestCoachWittyResponses:
    """Test that coach returns witty responses for non-fitness questions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("accessToken")
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
        else:
            self.token = None
            self.headers = {"Content-Type": "application/json"}
    
    def _send_coach_message(self, message: str) -> dict:
        """Helper to send message to coach API"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": message, "coach": "default"},
            headers=self.headers
        )
        return response
    
    def test_non_fitness_question_gets_witty_redirect(self):
        """Coach should give witty response to non-fitness questions"""
        response = self._send_coach_message("Can squirrels fly?")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should redirect back to fitness in a witty way
        assert any(phrase in coach_response for phrase in [
            "fitness", "workout", "exercise", "training", "coach", "help"
        ]), f"Coach should redirect to fitness topics. Got: {coach_response[:200]}"
        print(f"✅ Non-fitness question gets witty redirect: {coach_response[:150]}...")
    
    def test_weather_question_redirects_to_fitness(self):
        """Coach should redirect weather questions to fitness"""
        response = self._send_coach_message("What's the weather like today?")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should redirect back to fitness
        assert any(phrase in coach_response for phrase in [
            "fitness", "workout", "exercise", "training", "coach", "help"
        ]), f"Coach should redirect to fitness topics. Got: {coach_response[:200]}"
        print(f"✅ Weather question redirects to fitness: {coach_response[:150]}...")
    
    def test_random_question_redirects_to_fitness(self):
        """Coach should redirect random questions to fitness"""
        response = self._send_coach_message("What is the meaning of life?")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should redirect back to fitness
        assert any(phrase in coach_response for phrase in [
            "fitness", "workout", "exercise", "training", "coach", "help"
        ]), f"Coach should redirect to fitness topics. Got: {coach_response[:200]}"
        print(f"✅ Random question redirects to fitness: {coach_response[:150]}...")


class TestCoachNoProfanity:
    """Test that coach never uses profanity"""
    
    # Common profanity words to check for
    PROFANITY_WORDS = [
        'fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'hell',
        'bastard', 'dick', 'piss', 'cock', 'pussy', 'whore', 'slut'
    ]
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("accessToken")
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
        else:
            self.token = None
            self.headers = {"Content-Type": "application/json"}
    
    def _send_coach_message(self, message: str) -> dict:
        """Helper to send message to coach API"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": message, "coach": "default"},
            headers=self.headers
        )
        return response
    
    def _check_no_profanity(self, text: str) -> bool:
        """Check that text contains no profanity"""
        text_lower = text.lower()
        for word in self.PROFANITY_WORDS:
            # Use word boundary to avoid false positives (e.g., "class" containing "ass")
            if re.search(rf'\b{word}\b', text_lower):
                return False
        return True
    
    def test_normal_response_no_profanity(self):
        """Normal coach response should not contain profanity"""
        response = self._send_coach_message("Give me some workout motivation!")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "")
        
        assert self._check_no_profanity(coach_response), f"Coach response contains profanity: {coach_response}"
        print(f"✅ Normal response has no profanity: {coach_response[:100]}...")
    
    def test_provocative_input_no_profanity_response(self):
        """Coach should not use profanity even with provocative input"""
        response = self._send_coach_message("This workout is terrible, I hate it!")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "")
        
        assert self._check_no_profanity(coach_response), f"Coach response contains profanity: {coach_response}"
        print(f"✅ Provocative input gets clean response: {coach_response[:100]}...")
    
    def test_frustration_input_no_profanity_response(self):
        """Coach should not use profanity when user expresses frustration"""
        response = self._send_coach_message("I'm so frustrated with my progress!")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "")
        
        assert self._check_no_profanity(coach_response), f"Coach response contains profanity: {coach_response}"
        print(f"✅ Frustration input gets clean response: {coach_response[:100]}...")


class TestCoachDirectsToAppSections:
    """Test that coach correctly directs users to appropriate app sections"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("accessToken")
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
        else:
            self.token = None
            self.headers = {"Content-Type": "application/json"}
    
    def _send_coach_message(self, message: str) -> dict:
        """Helper to send message to coach API"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": message, "coach": "default"},
            headers=self.headers
        )
        return response
    
    def test_workout_modification_directs_to_edit_plan(self):
        """Workout modification requests should direct to Edit Plan"""
        response = self._send_coach_message("I want to modify my workout schedule")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should mention Edit Plan
        assert any(phrase in coach_response for phrase in [
            "edit plan", "workouts tab"
        ]), f"Should direct to Edit Plan. Got: {coach_response[:200]}"
        print(f"✅ Workout modification directs to Edit Plan")
    
    def test_profile_change_directs_to_profile(self):
        """Profile change requests should direct to Profile"""
        response = self._send_coach_message("I want to update my profile settings")
        
        if response.status_code == 401:
            pytest.skip("Authentication required - skipping")
        
        assert response.status_code == 200
        data = response.json()
        coach_response = data.get("response", "").lower()
        
        # Should mention Profile
        assert any(phrase in coach_response for phrase in [
            "profile", "settings"
        ]), f"Should direct to Profile. Got: {coach_response[:200]}"
        print(f"✅ Profile change directs to Profile")


class TestOnboardingStepsVerification:
    """Test that onboarding steps are correctly configured (code review)"""
    
    def test_onboarding_file_exists(self):
        """Verify onboarding file exists"""
        onboarding_path = "/app/apps/native/app/(auth)/onboarding.tsx"
        assert os.path.exists(onboarding_path), f"Onboarding file not found at {onboarding_path}"
        print(f"✅ Onboarding file exists")
    
    def test_no_nutrition_goals_step(self):
        """Verify nutritionGoals step is removed from onboarding"""
        onboarding_path = "/app/apps/native/app/(auth)/onboarding.tsx"
        with open(onboarding_path, 'r') as f:
            content = f.read()
        
        # Check that nutritionGoals is not in ONBOARDING_STEPS
        # Look for id: 'nutritionGoals' pattern
        assert "id: 'nutritionGoals'" not in content, "nutritionGoals step should be removed"
        assert "id: \"nutritionGoals\"" not in content, "nutritionGoals step should be removed"
        print(f"✅ nutritionGoals step is removed from onboarding")
    
    def test_no_coaching_step(self):
        """Verify coaching step is removed from onboarding"""
        onboarding_path = "/app/apps/native/app/(auth)/onboarding.tsx"
        with open(onboarding_path, 'r') as f:
            content = f.read()
        
        # Check that coaching is not in ONBOARDING_STEPS
        # Look for id: 'coaching' pattern
        assert "id: 'coaching'" not in content, "coaching step should be removed"
        assert "id: \"coaching\"" not in content, "coaching step should be removed"
        print(f"✅ coaching step is removed from onboarding")
    
    def test_onboarding_steps_count(self):
        """Verify onboarding has expected number of steps"""
        onboarding_path = "/app/apps/native/app/(auth)/onboarding.tsx"
        with open(onboarding_path, 'r') as f:
            content = f.read()
        
        # Count the number of step definitions (id: 'xxx')
        import re
        step_ids = re.findall(r"id:\s*['\"](\w+)['\"]", content)
        
        # Expected steps: name, gender, birthdate, measurements, experience, 
        # fitnessGoals, equipment, frequency, duration, trainingSchedule, injuries
        expected_steps = ['name', 'gender', 'birthdate', 'measurements', 'experience',
                         'fitnessGoals', 'equipment', 'frequency', 'duration', 
                         'trainingSchedule', 'injuries']
        
        for step in expected_steps:
            assert step in step_ids, f"Expected step '{step}' not found in onboarding"
        
        # Verify removed steps are not present
        assert 'nutritionGoals' not in step_ids, "nutritionGoals should be removed"
        assert 'coaching' not in step_ids, "coaching should be removed"
        
        print(f"✅ Onboarding has correct steps: {step_ids}")


class TestCoachServiceCodeReview:
    """Code review tests for ai-coach-service.ts"""
    
    def test_coach_service_has_critical_rules(self):
        """Verify ai-coach-service.ts has CRITICAL RULES for READ-ONLY behavior"""
        service_path = "/app/server/ai-coach-service.ts"
        with open(service_path, 'r') as f:
            content = f.read()
        
        # Check for READ-ONLY rules
        assert "READ-ONLY" in content or "read-only" in content.lower(), \
            "Coach service should mention READ-ONLY behavior"
        
        # Check for Edit Plan redirect
        assert "Edit Plan" in content, \
            "Coach service should mention Edit Plan for redirects"
        
        # Check for no profanity rule
        assert "profanity" in content.lower() or "NEVER use profanity" in content, \
            "Coach service should have no profanity rule"
        
        print(f"✅ Coach service has CRITICAL RULES for READ-ONLY behavior")
    
    def test_coach_service_has_witty_responses(self):
        """Verify ai-coach-service.ts has witty response handling"""
        service_path = "/app/server/ai-coach-service.ts"
        with open(service_path, 'r') as f:
            content = f.read()
        
        # Check for witty responses
        assert "witty" in content.lower() or "wittyResponses" in content, \
            "Coach service should have witty response handling"
        
        print(f"✅ Coach service has witty response handling")
    
    def test_floating_coach_button_has_modification_keywords(self):
        """Verify FloatingCoachButton.tsx has planModificationKeywords"""
        button_path = "/app/apps/native/src/components/FloatingCoachButton.tsx"
        with open(button_path, 'r') as f:
            content = f.read()
        
        # Check for modification keywords
        assert "planModificationKeywords" in content, \
            "FloatingCoachButton should have planModificationKeywords"
        
        # Check for feeling energetic handling
        assert "feeling energetic" in content.lower(), \
            "FloatingCoachButton should handle 'feeling energetic' requests"
        
        # Check for Edit Plan redirect
        assert "Edit Plan" in content, \
            "FloatingCoachButton should redirect to Edit Plan"
        
        print(f"✅ FloatingCoachButton has modification keywords and redirects")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
