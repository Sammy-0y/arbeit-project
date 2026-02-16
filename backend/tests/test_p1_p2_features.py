"""
Test P1 and P2 Features:
1. Interview Pipeline Stats API
2. Public Candidate Booking Endpoints
3. Booking Link Generation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hirematch-52.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@arbeit.com"
ADMIN_PASSWORD = "admin123"

# Test interview data from main agent
TEST_INTERVIEW_ID = "int_e4d40d7d5aa6"
TEST_BOOKING_TOKEN = "0ac6e8764835e679ad33de728f2c96b7"


class TestInterviewPipelineStats:
    """Test Interview Pipeline Stats API for Dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_pipeline_stats(self):
        """Test GET /api/interviews/stats/pipeline returns correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/interviews/stats/pipeline",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Pipeline stats failed: {response.text}"
        data = response.json()
        
        # Verify all required fields are present
        required_fields = [
            "total_interviews",
            "awaiting_confirmation",
            "confirmed",
            "scheduled",
            "completed",
            "no_shows",
            "cancelled"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
            assert isinstance(data[field], int), f"Field {field} should be integer"
        
        print(f"Pipeline Stats: {data}")
        
        # Verify total is sum of all statuses
        status_sum = (
            data["awaiting_confirmation"] +
            data["confirmed"] +
            data["scheduled"] +
            data["completed"] +
            data["no_shows"] +
            data["cancelled"]
        )
        # Note: total_interviews might include other statuses like "Draft"
        assert data["total_interviews"] >= status_sum, "Total should be >= sum of tracked statuses"


class TestPublicBookingEndpoints:
    """Test Public Candidate Booking Endpoints (No Auth Required)"""
    
    def test_get_public_interview_valid_token(self):
        """Test GET /api/public/interviews/{id}?token=xxx with valid token"""
        response = requests.get(
            f"{BASE_URL}/api/public/interviews/{TEST_INTERVIEW_ID}",
            params={"token": TEST_BOOKING_TOKEN}
        )
        
        assert response.status_code == 200, f"Public interview fetch failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "interview_id" in data
        assert "interview_mode" in data
        assert "interview_duration" in data
        assert "interview_status" in data
        assert "proposed_slots" in data
        assert "candidate_name" in data
        assert "job_title" in data
        assert "company_name" in data
        
        print(f"Public Interview Data: {data}")
        
        # Verify interview_id matches
        assert data["interview_id"] == TEST_INTERVIEW_ID
    
    def test_get_public_interview_invalid_token(self):
        """Test GET /api/public/interviews/{id} with invalid token returns 403"""
        response = requests.get(
            f"{BASE_URL}/api/public/interviews/{TEST_INTERVIEW_ID}",
            params={"token": "invalid_token_12345"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"Invalid token response: {data}")
    
    def test_get_public_interview_nonexistent(self):
        """Test GET /api/public/interviews/{id} with non-existent interview"""
        # Generate a valid-looking token for a non-existent interview
        response = requests.get(
            f"{BASE_URL}/api/public/interviews/int_nonexistent123",
            params={"token": "some_token"}
        )
        
        # Should return 403 (invalid token) or 404 (not found)
        assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}"
    
    def test_public_book_slot_invalid_token(self):
        """Test POST /api/public/interviews/{id}/book with invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/public/interviews/{TEST_INTERVIEW_ID}/book",
            params={"slot_id": "slot_123", "token": "invalid_token"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


class TestBookingLinkGeneration:
    """Test Booking Link Generation Endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_booking_link(self):
        """Test GET /api/interviews/{id}/booking-link returns valid link"""
        response = requests.get(
            f"{BASE_URL}/api/interviews/{TEST_INTERVIEW_ID}/booking-link",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Booking link fetch failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "interview_id" in data
        assert "booking_link" in data
        assert "booking_token" in data
        
        # Verify booking link format
        assert f"/book/{TEST_INTERVIEW_ID}/" in data["booking_link"]
        assert data["booking_token"] == TEST_BOOKING_TOKEN
        
        print(f"Booking Link: {data['booking_link']}")
    
    def test_get_booking_link_nonexistent_interview(self):
        """Test GET /api/interviews/{id}/booking-link with non-existent interview"""
        response = requests.get(
            f"{BASE_URL}/api/interviews/int_nonexistent123/booking-link",
            headers=self.headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestGovernanceEndpoints:
    """Test Governance Console API Endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_client_roles(self):
        """Test GET /api/governance/roles - List all client roles"""
        response = requests.get(
            f"{BASE_URL}/api/governance/roles",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"List roles failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} roles")
        
        if len(data) > 0:
            role = data[0]
            assert "role_id" in role
            assert "name" in role
            assert "permissions" in role
    
    def test_list_role_assignments(self):
        """Test GET /api/governance/user-roles - List role assignments"""
        response = requests.get(
            f"{BASE_URL}/api/governance/user-roles",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"List assignments failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} role assignments")
    
    def test_get_audit_logs(self):
        """Test GET /api/governance/audit - Get audit logs"""
        response = requests.get(
            f"{BASE_URL}/api/governance/audit",
            headers=self.headers,
            params={"limit": 10}
        )
        
        assert response.status_code == 200, f"Get audit logs failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} audit log entries")
        
        if len(data) > 0:
            log = data[0]
            assert "log_id" in log
            assert "timestamp" in log
            assert "action_type" in log


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
