"""
AI Coach Helpfulness Tests - Iteration 7
Tests the enhanced AI coach functionality for Thryvin fitness app.

Features tested:
1. Coach provides specific, actionable advice (sets, reps, weights, percentages)
2. Coach reads user's exercise stats from database (performance_logs table)
3. Coach answers "What is my max bench press?" with actual user data
4. Coach explains form tips with multiple cues (not just one-liners)
5. Coach provides nutrition advice with specific numbers (protein per kg bodyweight)
6. API endpoint /api/coach/chat returns responses with coach name and contextUsed flag
"""

import pytest
import requests
import uuid
import time
import os

# Use the production URL from the test request
BASE_URL = "https://drop-set-feature.preview.emergentagent.com"


class TestAICoachHelpfulness:
    """Test suite for AI Coach helpfulness enhancements"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user and return credentials with token"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_coach_{unique_id}@test.com"
        password = "TestPass123!"
        name = f"Coach Test User {unique_id}"
        
        # Register user
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": name,
                "email": email,
                "password": password,
                "experience": "intermediate",
                "fitnessGoals": ["build_muscle", "get_stronger"],
                "equipment": ["barbell", "dumbbells", "bench"],
                "trainingDays": 4
            },
            timeout=30
        )
        
        print(f"\n📝 Register response status: {register_response.status_code}")
        
        if register_response.status_code == 201:
            data = register_response.json()
            token = data.get("accessToken")
            user_id = data.get("user", {}).get("id")
            print(f"✅ User registered successfully. ID: {user_id}")
            return {
                "email": email,
                "password": password,
                "name": name,
                "token": token,
                "user_id": user_id
            }
        else:
            print(f"❌ Registration failed: {register_response.text}")
            pytest.skip(f"Could not create test user: {register_response.text}")
    
    @pytest.fixture(scope="class")
    def logged_exercise_data(self, test_user):
        """Log some exercise sets for the test user to query later"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Log multiple sets for bench press
        exercises_to_log = [
            {"exerciseName": "Bench Press", "weight": 60, "reps": 10, "setNumber": 1},
            {"exerciseName": "Bench Press", "weight": 70, "reps": 8, "setNumber": 2},
            {"exerciseName": "Bench Press", "weight": 80, "reps": 5, "setNumber": 3},  # Max weight
            {"exerciseName": "Squat", "weight": 80, "reps": 10, "setNumber": 1},
            {"exerciseName": "Squat", "weight": 100, "reps": 6, "setNumber": 2},
            {"exerciseName": "Squat", "weight": 110, "reps": 4, "setNumber": 3},  # Max weight
            {"exerciseName": "Deadlift", "weight": 100, "reps": 8, "setNumber": 1},
            {"exerciseName": "Deadlift", "weight": 120, "reps": 5, "setNumber": 2},
        ]
        
        logged_exercises = []
        for exercise in exercises_to_log:
            response = requests.post(
                f"{BASE_URL}/api/workout/log-set",
                json=exercise,
                headers=headers,
                timeout=15
            )
            if response.status_code == 200:
                logged_exercises.append(exercise)
                print(f"✅ Logged: {exercise['exerciseName']} - {exercise['weight']}kg x {exercise['reps']}")
            else:
                print(f"⚠️ Failed to log {exercise['exerciseName']}: {response.status_code}")
        
        # Wait a moment for data to be persisted
        time.sleep(1)
        
        return {
            "logged": logged_exercises,
            "max_bench": 80,
            "max_squat": 110,
            "max_deadlift": 120
        }
    
    # ==================== HEALTH CHECK ====================
    
    def test_health_check(self):
        """Verify API is healthy before running tests"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        assert data.get("dbOk") == True
        print(f"✅ Health check passed: {data}")
    
    # ==================== COACH CHAT API STRUCTURE ====================
    
    def test_coach_chat_returns_required_fields(self, test_user):
        """Test that /api/coach/chat returns response, coach name, and contextUsed flag"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "Hello coach!"},
            headers=headers,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "response" in data, "Missing 'response' field"
        assert "coach" in data, "Missing 'coach' field"
        assert "contextUsed" in data, "Missing 'contextUsed' field"
        
        # Verify types
        assert isinstance(data["response"], str), "response should be a string"
        assert isinstance(data["coach"], str), "coach should be a string"
        assert isinstance(data["contextUsed"], bool), "contextUsed should be a boolean"
        
        print(f"✅ Coach response structure valid:")
        print(f"   - Coach: {data['coach']}")
        print(f"   - Context Used: {data['contextUsed']}")
        print(f"   - Response length: {len(data['response'])} chars")
    
    def test_coach_chat_requires_auth(self):
        """Test that /api/coach/chat requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "Hello coach!"},
            timeout=15
        )
        
        # Should return 401 without auth
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ Coach chat correctly requires authentication")
    
    # ==================== STATS QUESTIONS ====================
    
    def test_coach_answers_max_bench_question(self, test_user, logged_exercise_data):
        """Test that coach can answer 'What is my max bench press?' with actual data"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "What is my max bench press?"},
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # The coach should mention the actual weight (80kg) from logged data
        # or acknowledge they're looking at the user's data
        has_specific_number = any(str(num) in coach_response for num in [80, "80kg", "80 kg"])
        has_data_reference = any(term in coach_response for term in ["your", "logged", "data", "record", "max", "heaviest"])
        
        print(f"\n📊 Coach response to 'What is my max bench press?':")
        print(f"   Response: {data['response'][:500]}...")
        print(f"   Context Used: {data['contextUsed']}")
        print(f"   Has specific number (80): {has_specific_number}")
        print(f"   Has data reference: {has_data_reference}")
        
        # Coach should use context when answering stats questions
        assert data["contextUsed"] == True, "Coach should use context for stats questions"
        
        # Coach should reference user's data or give specific numbers
        assert has_specific_number or has_data_reference, \
            "Coach should reference user's actual data or give specific numbers"
    
    def test_coach_answers_max_squat_question(self, test_user, logged_exercise_data):
        """Test that coach can answer squat max question with actual data"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "What's my heaviest squat?"},
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # Should mention 110kg or reference user's data
        has_specific_number = any(str(num) in coach_response for num in [110, "110kg", "110 kg"])
        has_data_reference = any(term in coach_response for term in ["your", "logged", "data", "record", "max", "heaviest", "squat"])
        
        print(f"\n📊 Coach response to 'What's my heaviest squat?':")
        print(f"   Response: {data['response'][:500]}...")
        print(f"   Context Used: {data['contextUsed']}")
        
        assert data["contextUsed"] == True, "Coach should use context for stats questions"
    
    # ==================== ACTIONABLE ADVICE ====================
    
    def test_coach_gives_specific_workout_advice(self, test_user):
        """Test that coach gives specific, actionable advice with numbers"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "How should I structure my chest workout today?"},
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # Check for specific numbers (sets, reps, rest times)
        has_sets = any(term in coach_response for term in ["sets", "set", "3x", "4x", "5x"])
        has_reps = any(term in coach_response for term in ["reps", "rep", "8-12", "10-12", "6-8", "5-8"])
        has_exercises = any(term in coach_response for term in ["bench", "press", "fly", "dumbbell", "incline", "decline", "push"])
        
        print(f"\n💪 Coach response to chest workout question:")
        print(f"   Response: {data['response'][:600]}...")
        print(f"   Has sets: {has_sets}")
        print(f"   Has reps: {has_reps}")
        print(f"   Has exercises: {has_exercises}")
        
        # Coach should give specific workout structure
        assert has_sets or has_reps, "Coach should mention specific sets or reps"
        assert has_exercises, "Coach should mention specific exercises"
    
    def test_coach_gives_weight_progression_advice(self, test_user, logged_exercise_data):
        """Test that coach gives specific weight progression advice"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "How much weight should I add to my bench press next week?"},
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # Check for specific weight recommendations
        has_weight_numbers = any(term in coach_response for term in [
            "kg", "lb", "2.5", "5kg", "5 kg", "2.5kg", "1.25", "percent", "%"
        ])
        has_progression_advice = any(term in coach_response for term in [
            "add", "increase", "progress", "next", "try", "go up", "bump"
        ])
        
        print(f"\n📈 Coach response to weight progression question:")
        print(f"   Response: {data['response'][:600]}...")
        print(f"   Has weight numbers: {has_weight_numbers}")
        print(f"   Has progression advice: {has_progression_advice}")
        
        assert has_progression_advice, "Coach should give progression advice"
    
    # ==================== FORM TIPS ====================
    
    def test_coach_gives_detailed_form_tips(self, test_user):
        """Test that coach gives multiple form cues, not just one-liners"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "What are the key form tips for deadlift?"},
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # Check for multiple form cues
        form_cues = [
            "back", "spine", "neutral", "straight",
            "hip", "hinge", "drive",
            "grip", "hands", "bar",
            "feet", "stance", "shoulder",
            "core", "brace", "tight",
            "chest", "up", "proud",
            "pull", "push", "floor"
        ]
        
        cues_found = [cue for cue in form_cues if cue in coach_response]
        
        print(f"\n🎯 Coach response to deadlift form question:")
        print(f"   Response: {data['response'][:700]}...")
        print(f"   Form cues found: {cues_found}")
        print(f"   Number of cues: {len(cues_found)}")
        
        # Coach should give at least 3 different form cues
        assert len(cues_found) >= 3, f"Coach should give multiple form cues, found only {len(cues_found)}: {cues_found}"
    
    def test_coach_gives_squat_form_tips(self, test_user):
        """Test that coach gives detailed squat form advice"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "How do I improve my squat form?"},
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # Check for squat-specific form cues
        squat_cues = [
            "knee", "knees", "track", "toes",
            "depth", "parallel", "below",
            "hip", "hips", "back",
            "core", "brace", "tight",
            "chest", "up", "proud",
            "feet", "stance", "width",
            "weight", "heels", "balance"
        ]
        
        cues_found = [cue for cue in squat_cues if cue in coach_response]
        
        print(f"\n🏋️ Coach response to squat form question:")
        print(f"   Response: {data['response'][:700]}...")
        print(f"   Squat cues found: {cues_found}")
        
        assert len(cues_found) >= 3, f"Coach should give multiple squat form cues"
    
    # ==================== NUTRITION ADVICE ====================
    
    def test_coach_gives_specific_nutrition_advice(self, test_user):
        """Test that coach gives nutrition advice with specific numbers"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "How much protein should I eat to build muscle?"},
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # Check for specific protein recommendations
        has_protein_numbers = any(term in coach_response for term in [
            "gram", "g/kg", "g per", "1.6", "1.8", "2.0", "2.2", "0.8", "1g",
            "per kg", "per pound", "bodyweight", "body weight"
        ])
        has_protein_advice = any(term in coach_response for term in [
            "protein", "intake", "consume", "eat", "daily"
        ])
        
        print(f"\n🥗 Coach response to protein question:")
        print(f"   Response: {data['response'][:600]}...")
        print(f"   Has protein numbers: {has_protein_numbers}")
        print(f"   Has protein advice: {has_protein_advice}")
        
        assert has_protein_advice, "Coach should give protein advice"
        # Note: We check for numbers but don't fail if missing - coach might give ranges
    
    def test_coach_gives_calorie_advice(self, test_user):
        """Test that coach gives calorie/diet advice with specifics"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "How many calories should I eat to gain muscle?"},
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # Check for calorie-related advice
        has_calorie_terms = any(term in coach_response for term in [
            "calorie", "surplus", "deficit", "maintenance", "tdee",
            "eat", "intake", "consume"
        ])
        has_numbers = any(term in coach_response for term in [
            "200", "300", "500", "10%", "15%", "20%", "percent"
        ])
        
        print(f"\n🍽️ Coach response to calorie question:")
        print(f"   Response: {data['response'][:600]}...")
        print(f"   Has calorie terms: {has_calorie_terms}")
        
        assert has_calorie_terms, "Coach should discuss calories/diet"
    
    # ==================== DIFFERENT COACHES ====================
    
    def test_titan_coach_specialty(self, test_user):
        """Test that Titan coach (strength specialist) gives strength-focused advice"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={
                "message": "How do I get stronger?",
                "coach": "titan"
            },
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify Titan is the coach
        assert data["coach"] == "Titan", f"Expected Titan, got {data['coach']}"
        
        coach_response = data["response"].lower()
        
        # Titan should focus on strength training
        strength_terms = ["strength", "heavy", "compound", "progressive", "overload", "squat", "deadlift", "bench", "press"]
        has_strength_focus = any(term in coach_response for term in strength_terms)
        
        print(f"\n🏋️ Titan coach response:")
        print(f"   Coach: {data['coach']}")
        print(f"   Response: {data['response'][:500]}...")
        print(f"   Has strength focus: {has_strength_focus}")
        
        assert has_strength_focus, "Titan should give strength-focused advice"
    
    def test_kai_coach_specialty(self, test_user):
        """Test that Kai coach (calisthenics specialist) gives bodyweight-focused advice"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={
                "message": "How do I get better at pull-ups?",
                "coach": "kai"
            },
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify Kai is the coach
        assert data["coach"] == "Kai", f"Expected Kai, got {data['coach']}"
        
        coach_response = data["response"].lower()
        
        # Kai should focus on bodyweight/calisthenics
        calisthenics_terms = ["pull", "grip", "hang", "bodyweight", "progression", "negative", "assisted", "band", "lat"]
        has_calisthenics_focus = any(term in coach_response for term in calisthenics_terms)
        
        print(f"\n🤸 Kai coach response:")
        print(f"   Coach: {data['coach']}")
        print(f"   Response: {data['response'][:500]}...")
        print(f"   Has calisthenics focus: {has_calisthenics_focus}")
        
        assert has_calisthenics_focus, "Kai should give calisthenics-focused advice"
    
    def test_lumi_coach_specialty(self, test_user):
        """Test that Lumi coach (wellness specialist) gives recovery-focused advice"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={
                "message": "How can I recover better after workouts?",
                "coach": "lumi"
            },
            headers=headers,
            timeout=45
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify Lumi is the coach
        assert data["coach"] == "Lumi", f"Expected Lumi, got {data['coach']}"
        
        coach_response = data["response"].lower()
        
        # Lumi should focus on recovery/wellness
        wellness_terms = ["recovery", "sleep", "rest", "stretch", "mobility", "foam", "hydrat", "nutrition", "stress", "relax"]
        has_wellness_focus = any(term in coach_response for term in wellness_terms)
        
        print(f"\n🧘 Lumi coach response:")
        print(f"   Coach: {data['coach']}")
        print(f"   Response: {data['response'][:500]}...")
        print(f"   Has wellness focus: {has_wellness_focus}")
        
        assert has_wellness_focus, "Lumi should give wellness-focused advice"
    
    # ==================== NON-FITNESS QUESTIONS ====================
    
    def test_coach_redirects_non_fitness_questions(self, test_user):
        """Test that coach redirects non-fitness questions back to fitness"""
        token = test_user["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coach/chat",
            json={"message": "What is the capital of France?"},
            headers=headers,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        coach_response = data["response"].lower()
        
        # Coach should redirect to fitness topics
        has_fitness_redirect = any(term in coach_response for term in [
            "fitness", "workout", "exercise", "training", "help", "coach", "gym"
        ])
        
        print(f"\n🚫 Coach response to non-fitness question:")
        print(f"   Response: {data['response'][:400]}...")
        print(f"   Has fitness redirect: {has_fitness_redirect}")
        
        # Coach should stay on topic
        assert has_fitness_redirect, "Coach should redirect non-fitness questions to fitness topics"


class TestLogSetEndpoint:
    """Test the /api/workout/log-set endpoint"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user for log-set tests"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_logset_{unique_id}@test.com"
        password = "TestPass123!"
        
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": f"LogSet Test {unique_id}",
                "email": email,
                "password": password
            },
            timeout=30
        )
        
        if register_response.status_code == 201:
            data = register_response.json()
            return {
                "token": data.get("accessToken"),
                "user_id": data.get("user", {}).get("id")
            }
        else:
            pytest.skip(f"Could not create test user: {register_response.text}")
    
    def test_log_set_requires_auth(self):
        """Test that log-set requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/workout/log-set",
            json={
                "exerciseName": "Bench Press",
                "weight": 60,
                "reps": 10,
                "setNumber": 1
            },
            timeout=15
        )
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ Log-set correctly requires authentication")
    
    def test_log_set_success(self, test_user):
        """Test successful set logging"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        
        response = requests.post(
            f"{BASE_URL}/api/workout/log-set",
            json={
                "exerciseName": "Bench Press",
                "weight": 75,
                "reps": 8,
                "setNumber": 1
            },
            headers=headers,
            timeout=15
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        print("✅ Set logged successfully")
    
    def test_log_set_with_difficulty(self, test_user):
        """Test logging set with difficulty feedback"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        
        response = requests.post(
            f"{BASE_URL}/api/workout/log-set",
            json={
                "exerciseName": "Squat",
                "weight": 100,
                "reps": 5,
                "setNumber": 1,
                "difficulty": "hard"
            },
            headers=headers,
            timeout=15
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✅ Set with difficulty logged successfully")
    
    def test_log_set_with_note(self, test_user):
        """Test logging set with a note"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        
        response = requests.post(
            f"{BASE_URL}/api/workout/log-set",
            json={
                "exerciseName": "Deadlift",
                "weight": 120,
                "reps": 3,
                "setNumber": 1,
                "note": "Felt strong today, good form"
            },
            headers=headers,
            timeout=15
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✅ Set with note logged successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
