# Thryvin - QA Login JSON Fix Test Results

## Test Summary
**Date**: 2026-01-06
**Focus**: QA login endpoints ALWAYS return valid JSON

---

## Backend API Tests Required

### 1. QA Login - Beginner Profile
- **Endpoint**: POST /api/qa/login-as
- **Body**: {"profile": "beginner"}
- **Expected**: Content-Type: application/json, ok=true
- **Status**: NEEDS TESTING

### 2. QA Login - All Profiles (10x)
- Run 10 consecutive login requests
- Expected: 10/10 success with JSON responses
- **Status**: NEEDS TESTING

### 3. QA Login - Invalid Profile
- **Body**: {"profile": "invalid"}
- **Expected**: 400 JSON with code=INVALID_PROFILE
- **Status**: NEEDS TESTING

### 4. QA Reset User
- **Endpoint**: POST /api/qa/reset-user
- **Body**: {"email": "qa_beginner@thryvin.test"}
- **Expected**: JSON with ok=true
- **Status**: NEEDS TESTING

### 5. QA Profiles
- **Endpoint**: GET /api/qa/profiles
- **Expected**: JSON with profiles array
- **Status**: NEEDS TESTING

---

## Test Credentials
- Endpoint: POST /api/qa/login-as
- Bodies: {"profile": "beginner"}, {"profile": "intermediate"}, {"profile": "injury"}

---

## Metadata

```yaml
backend:
  - task: "QA Login JSON Fix"
    endpoint: "POST /api/qa/login-as"
    implemented: true
    working: "needs_testing"
    file: "server/qa-service.ts"
    priority: "critical"

metadata:
  created_by: "main_agent"
  version: "3.0"
  test_sequence: 4
  run_ui: false

test_plan:
  current_focus:
    - "QA login JSON responses"
  test_all: true
  test_priority: "critical_first"
```
