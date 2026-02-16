"""
Test suite for Candidate Portal API endpoints
Tests: Registration, Login, Token-based auth, My Interviews, Book Slot
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hirematch-52.preview.emergentagent.com')

# Test data
TEST_CANDIDATE_EMAIL = f"test_candidate_{uuid.uuid4().hex[:8]}@example.com"
TEST_CANDIDATE_PASSWORD = "testpass123"
TEST_CANDIDATE_NAME = "Test Candidate Portal User"
TEST_CANDIDATE_PHONE = "+91 9876543210"

class TestCandidatePortalRegistration:
    """Test candidate registration endpoint"""
    
    def test_register_candidate_success(self):
        """Test successful candidate registration with all required fields"""
        response = requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": TEST_CANDIDATE_EMAIL,
            "password": TEST_CANDIDATE_PASSWORD,
            "name": TEST_CANDIDATE_NAME,
            "phone": TEST_CANDIDATE_PHONE,
            "linkedin_url": "https://linkedin.com/in/testcandidate",
            "current_company": "Test Company",
            "experience_years": 5
        })
        
        print(f"Register response status: {response.status_code}")
        print(f"Register response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "candidate_portal_id" in data
        assert data["email"] == TEST_CANDIDATE_EMAIL
        assert data["name"] == TEST_CANDIDATE_NAME
        assert data["phone"] == TEST_CANDIDATE_PHONE
        assert data["linkedin_url"] == "https://linkedin.com/in/testcandidate"
        assert data["current_company"] == "Test Company"
        assert data["experience_years"] == 5
        assert "created_at" in data
    
    def test_register_candidate_duplicate_email(self):
        """Test registration fails with duplicate email"""
        # First registration
        requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": f"duplicate_{uuid.uuid4().hex[:8]}@example.com",
            "password": "test123",
            "name": "Duplicate Test",
            "phone": "+91 1234567890"
        })
        
        # Try to register with same email
        dup_email = f"dup_test_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": dup_email,
            "password": "test123",
            "name": "First User",
            "phone": "+91 1234567890"
        })
        
        response = requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": dup_email,
            "password": "test123",
            "name": "Second User",
            "phone": "+91 1234567890"
        })
        
        assert response.status_code == 400
        assert "already exists" in response.json().get("detail", "").lower()
    
    def test_register_candidate_required_fields_only(self):
        """Test registration with only required fields (no optional fields)"""
        response = requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": f"minimal_{uuid.uuid4().hex[:8]}@example.com",
            "password": "test123",
            "name": "Minimal User",
            "phone": "+91 9999999999"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["linkedin_url"] is None
        assert data["current_company"] is None
        assert data["experience_years"] is None
    
    def test_register_candidate_missing_required_field(self):
        """Test registration fails without required fields"""
        # Missing phone
        response = requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": f"nophone_{uuid.uuid4().hex[:8]}@example.com",
            "password": "test123",
            "name": "No Phone User"
        })
        
        assert response.status_code == 422  # Validation error


class TestCandidatePortalLogin:
    """Test candidate login endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup_test_candidate(self):
        """Create a test candidate for login tests"""
        self.login_email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        self.login_password = "logintest123"
        
        # Register the candidate
        response = requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": self.login_email,
            "password": self.login_password,
            "name": "Login Test User",
            "phone": "+91 8888888888"
        })
        
        if response.status_code == 200:
            self.candidate_portal_id = response.json()["candidate_portal_id"]
    
    def test_login_success(self):
        """Test successful login returns token and candidate data"""
        response = requests.post(f"{BASE_URL}/api/candidate-portal/login", json={
            "email": self.login_email,
            "password": self.login_password
        })
        
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json()}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "candidate" in data
        assert data["candidate"]["email"] == self.login_email
        assert data["candidate"]["name"] == "Login Test User"
    
    def test_login_invalid_email(self):
        """Test login fails with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/candidate-portal/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401
        assert "Invalid email or password" in response.json().get("detail", "")
    
    def test_login_invalid_password(self):
        """Test login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/candidate-portal/login", json={
            "email": self.login_email,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "Invalid email or password" in response.json().get("detail", "")


class TestCandidatePortalMe:
    """Test /me endpoint for authenticated candidate"""
    
    @pytest.fixture(autouse=True)
    def setup_authenticated_candidate(self):
        """Create and login a test candidate"""
        self.me_email = f"me_test_{uuid.uuid4().hex[:8]}@example.com"
        self.me_password = "metest123"
        
        # Register
        requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": self.me_email,
            "password": self.me_password,
            "name": "Me Test User",
            "phone": "+91 7777777777",
            "current_company": "Me Test Company",
            "experience_years": 3
        })
        
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/candidate-portal/login", json={
            "email": self.me_email,
            "password": self.me_password
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json()["access_token"]
    
    def test_me_endpoint_success(self):
        """Test /me returns current candidate profile"""
        response = requests.get(
            f"{BASE_URL}/api/candidate-portal/me",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        print(f"Me response status: {response.status_code}")
        print(f"Me response: {response.json()}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == self.me_email
        assert data["name"] == "Me Test User"
        assert data["current_company"] == "Me Test Company"
        assert data["experience_years"] == 3
    
    def test_me_endpoint_no_token(self):
        """Test /me fails without token"""
        response = requests.get(f"{BASE_URL}/api/candidate-portal/me")
        
        assert response.status_code in [401, 403]
    
    def test_me_endpoint_invalid_token(self):
        """Test /me fails with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/candidate-portal/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        assert response.status_code == 401


class TestCandidatePortalMyInterviews:
    """Test my-interviews endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup_authenticated_candidate(self):
        """Create and login a test candidate"""
        self.interview_email = f"interview_test_{uuid.uuid4().hex[:8]}@example.com"
        self.interview_password = "interviewtest123"
        
        # Register
        requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": self.interview_email,
            "password": self.interview_password,
            "name": "Interview Test User",
            "phone": "+91 6666666666"
        })
        
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/candidate-portal/login", json={
            "email": self.interview_email,
            "password": self.interview_password
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json()["access_token"]
    
    def test_my_interviews_endpoint_success(self):
        """Test my-interviews returns list (may be empty for new candidate)"""
        response = requests.get(
            f"{BASE_URL}/api/candidate-portal/my-interviews",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        print(f"My interviews response status: {response.status_code}")
        print(f"My interviews response: {response.json()}")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_my_interviews_no_token(self):
        """Test my-interviews fails without token"""
        response = requests.get(f"{BASE_URL}/api/candidate-portal/my-interviews")
        
        assert response.status_code in [401, 403]


class TestCandidatePortalBookSlot:
    """Test interview slot booking endpoint"""
    
    def test_book_slot_no_token(self):
        """Test book-slot fails without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/candidate-portal/interviews/fake_interview_id/book-slot?slot_id=fake_slot"
        )
        
        assert response.status_code in [401, 403]
    
    def test_book_slot_invalid_interview(self):
        """Test book-slot fails with non-existent interview"""
        # First create and login a candidate
        email = f"book_test_{uuid.uuid4().hex[:8]}@example.com"
        
        requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": email,
            "password": "booktest123",
            "name": "Book Test User",
            "phone": "+91 5555555555"
        })
        
        login_response = requests.post(f"{BASE_URL}/api/candidate-portal/login", json={
            "email": email,
            "password": "booktest123"
        })
        
        token = login_response.json()["access_token"]
        
        response = requests.post(
            f"{BASE_URL}/api/candidate-portal/interviews/nonexistent_interview/book-slot?slot_id=fake_slot",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404


class TestExistingCandidateLogin:
    """Test login with provided test credentials"""
    
    def test_login_with_test_credentials(self):
        """Test login with test.candidate@example.com / test123"""
        # First try to register the test candidate (in case it doesn't exist)
        requests.post(f"{BASE_URL}/api/candidate-portal/register", json={
            "email": "test.candidate@example.com",
            "password": "test123",
            "name": "Test Candidate",
            "phone": "+91 1234567890"
        })
        
        # Now try to login
        response = requests.post(f"{BASE_URL}/api/candidate-portal/login", json={
            "email": "test.candidate@example.com",
            "password": "test123"
        })
        
        print(f"Test credentials login status: {response.status_code}")
        print(f"Test credentials login response: {response.json()}")
        
        # Should succeed (either existing or newly created)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["candidate"]["email"] == "test.candidate@example.com"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
