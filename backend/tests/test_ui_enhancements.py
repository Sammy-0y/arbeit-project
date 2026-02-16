"""
Test suite for UI/UX Enhancement features:
1. Dashboard stat cards navigation
2. Interview Pipeline status filtering
3. Delete candidate functionality
4. Extended Client Detail fields
5. Client user management (edit/delete)
"""

import pytest
import requests
import os
from urllib.parse import quote

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "connect@arbeit.co.in"
ADMIN_PASSWORD = "admin123"


class TestSetup:
    """Setup and authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {admin_token}"}


class TestClientExtendedFields(TestSetup):
    """Test extended client fields (industry, website, phone, address, etc.)"""
    
    def test_create_client_with_extended_fields(self, auth_headers):
        """Test creating a client with all extended fields"""
        client_data = {
            "company_name": f"TEST_ExtendedClient_{os.urandom(4).hex()}",
            "status": "active",
            "industry": "Technology",
            "website": "https://example.com",
            "phone": "+91 98765 43210",
            "address": "123 Tech Park",
            "city": "Bangalore",
            "state": "Karnataka",
            "country": "India",
            "postal_code": "560001",
            "notes": "Test client with extended fields"
        }
        
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=auth_headers)
        assert response.status_code in [200, 201], f"Create client failed: {response.text}"
        
        data = response.json()
        assert data["company_name"] == client_data["company_name"]
        assert data["industry"] == "Technology"
        assert data["website"] == "https://example.com"
        assert data["phone"] == "+91 98765 43210"
        assert data["city"] == "Bangalore"
        assert data["country"] == "India"
        
        # Store client_id for cleanup
        self.__class__.test_client_id = data["client_id"]
        print(f"Created test client: {data['client_id']}")
    
    def test_update_client_extended_fields(self, auth_headers):
        """Test updating client with extended fields"""
        if not hasattr(self.__class__, 'test_client_id'):
            pytest.skip("No test client created")
        
        update_data = {
            "industry": "Healthcare",
            "website": "https://updated-example.com",
            "phone": "+91 11111 22222",
            "address": "456 Health Center",
            "city": "Mumbai",
            "state": "Maharashtra",
            "notes": "Updated notes"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/clients/{self.__class__.test_client_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Update client failed: {response.text}"
        
        data = response.json()
        assert data["industry"] == "Healthcare"
        assert data["website"] == "https://updated-example.com"
        assert data["city"] == "Mumbai"
        print(f"Updated client extended fields successfully")
    
    def test_get_client_returns_extended_fields(self, auth_headers):
        """Test that GET client returns all extended fields"""
        if not hasattr(self.__class__, 'test_client_id'):
            pytest.skip("No test client created")
        
        response = requests.get(
            f"{BASE_URL}/api/clients/{self.__class__.test_client_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get client failed: {response.text}"
        
        data = response.json()
        # Verify extended fields are present
        assert "industry" in data
        assert "website" in data
        assert "phone" in data
        assert "address" in data
        assert "city" in data
        assert "state" in data
        assert "country" in data
        assert "postal_code" in data
        assert "notes" in data
        print(f"Client extended fields verified: industry={data.get('industry')}, city={data.get('city')}")


class TestClientUserManagement(TestSetup):
    """Test client user edit and delete functionality"""
    
    @pytest.fixture(scope="class")
    def test_client_with_user(self, auth_headers):
        """Create a test client with a user for testing"""
        # Create client
        client_data = {
            "company_name": f"TEST_UserMgmtClient_{os.urandom(4).hex()}",
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=auth_headers)
        assert response.status_code in [200, 201]
        client_id = response.json()["client_id"]
        
        # Create user for this client
        user_data = {
            "email": f"test_user_{os.urandom(4).hex()}@example.com",
            "name": "Test User",
            "password": "testpass123",
            "phone": "+91 12345 67890"
        }
        response = requests.post(
            f"{BASE_URL}/api/clients/{client_id}/users",
            json=user_data,
            headers=auth_headers
        )
        assert response.status_code in [200, 201], f"Create user failed: {response.text}"
        
        return {
            "client_id": client_id,
            "user_email": user_data["email"],
            "user_name": user_data["name"]
        }
    
    def test_update_client_user(self, auth_headers, test_client_with_user):
        """Test updating a client user's name and phone"""
        client_id = test_client_with_user["client_id"]
        user_email = test_client_with_user["user_email"]
        
        update_data = {
            "name": "Updated User Name",
            "phone": "+91 99999 88888"
        }
        
        # URL encode the email
        encoded_email = quote(user_email, safe='')
        
        response = requests.put(
            f"{BASE_URL}/api/clients/{client_id}/users/{encoded_email}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Update user failed: {response.text}"
        
        data = response.json()
        assert data["name"] == "Updated User Name"
        assert data["phone"] == "+91 99999 88888"
        print(f"Updated client user: {user_email}")
    
    def test_update_client_user_partial(self, auth_headers, test_client_with_user):
        """Test partial update of client user (only name)"""
        client_id = test_client_with_user["client_id"]
        user_email = test_client_with_user["user_email"]
        
        update_data = {
            "name": "Partially Updated Name"
        }
        
        encoded_email = quote(user_email, safe='')
        
        response = requests.put(
            f"{BASE_URL}/api/clients/{client_id}/users/{encoded_email}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Partial update failed: {response.text}"
        
        data = response.json()
        assert data["name"] == "Partially Updated Name"
        print(f"Partial update successful")
    
    def test_update_nonexistent_user(self, auth_headers, test_client_with_user):
        """Test updating a non-existent user returns 404"""
        client_id = test_client_with_user["client_id"]
        
        response = requests.put(
            f"{BASE_URL}/api/clients/{client_id}/users/nonexistent@example.com",
            json={"name": "Test"},
            headers=auth_headers
        )
        assert response.status_code == 404
        print("Non-existent user update correctly returns 404")
    
    def test_delete_client_user(self, auth_headers, test_client_with_user):
        """Test deleting a client user"""
        client_id = test_client_with_user["client_id"]
        user_email = test_client_with_user["user_email"]
        
        encoded_email = quote(user_email, safe='')
        
        response = requests.delete(
            f"{BASE_URL}/api/clients/{client_id}/users/{encoded_email}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete user failed: {response.text}"
        
        # Verify user is deleted
        response = requests.get(
            f"{BASE_URL}/api/clients/{client_id}/users",
            headers=auth_headers
        )
        users = response.json()
        user_emails = [u["email"] for u in users]
        assert user_email not in user_emails
        print(f"Deleted client user: {user_email}")
    
    def test_delete_nonexistent_user(self, auth_headers, test_client_with_user):
        """Test deleting a non-existent user returns 404"""
        client_id = test_client_with_user["client_id"]
        
        response = requests.delete(
            f"{BASE_URL}/api/clients/{client_id}/users/nonexistent@example.com",
            headers=auth_headers
        )
        assert response.status_code == 404
        print("Non-existent user delete correctly returns 404")


class TestDeleteCandidate(TestSetup):
    """Test candidate deletion functionality"""
    
    @pytest.fixture(scope="class")
    def test_candidate(self, auth_headers):
        """Create a test candidate for deletion testing"""
        # First get or create a job
        response = requests.get(f"{BASE_URL}/api/jobs", headers=auth_headers)
        jobs = response.json()
        
        if jobs:
            job_id = jobs[0]["job_id"]
        else:
            # Create a client first
            client_response = requests.post(
                f"{BASE_URL}/api/clients",
                json={"company_name": f"TEST_DeleteCandClient_{os.urandom(4).hex()}"},
                headers=auth_headers
            )
            client_id = client_response.json()["client_id"]
            
            # Create a job
            job_response = requests.post(
                f"{BASE_URL}/api/jobs",
                json={
                    "title": "Test Position",
                    "location": "Remote",
                    "employment_type": "Full-time",
                    "experience_range": {"min_years": 0, "max_years": 5},
                    "work_model": "Remote",
                    "description": "Test job for candidate deletion",
                    "client_id": client_id
                },
                headers=auth_headers
            )
            job_id = job_response.json()["job_id"]
        
        # Create a candidate
        candidate_data = {
            "job_id": job_id,
            "name": f"TEST_DeleteCandidate_{os.urandom(4).hex()}",
            "email": f"delete_test_{os.urandom(4).hex()}@example.com",
            "phone": "+91 12345 67890",
            "skills": ["Python", "Testing"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/candidates",
            json=candidate_data,
            headers=auth_headers
        )
        assert response.status_code in [200, 201], f"Create candidate failed: {response.text}"
        
        return response.json()
    
    def test_delete_candidate_success(self, auth_headers, test_candidate):
        """Test successful candidate deletion"""
        candidate_id = test_candidate["candidate_id"]
        
        response = requests.delete(
            f"{BASE_URL}/api/candidates/{candidate_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete candidate failed: {response.text}"
        
        # Verify candidate is deleted
        response = requests.get(
            f"{BASE_URL}/api/candidates/{candidate_id}",
            headers=auth_headers
        )
        assert response.status_code == 404
        print(f"Deleted candidate: {candidate_id}")
    
    def test_delete_nonexistent_candidate(self, auth_headers):
        """Test deleting a non-existent candidate returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/candidates/nonexistent_candidate_id",
            headers=auth_headers
        )
        assert response.status_code == 404
        print("Non-existent candidate delete correctly returns 404")


class TestInterviewPipelineStats(TestSetup):
    """Test interview pipeline statistics endpoint"""
    
    def test_get_pipeline_stats(self, auth_headers):
        """Test getting interview pipeline statistics"""
        response = requests.get(
            f"{BASE_URL}/api/interviews/stats/pipeline",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get pipeline stats failed: {response.text}"
        
        data = response.json()
        # Verify all expected fields are present
        assert "total_interviews" in data
        assert "awaiting_confirmation" in data
        assert "confirmed" in data
        assert "scheduled" in data
        assert "completed" in data
        assert "no_shows" in data
        assert "cancelled" in data
        
        # All values should be non-negative integers
        for key, value in data.items():
            assert isinstance(value, int), f"{key} should be an integer"
            assert value >= 0, f"{key} should be non-negative"
        
        print(f"Pipeline stats: {data}")


class TestDashboardNavigation(TestSetup):
    """Test that dashboard endpoints return proper data for navigation"""
    
    def test_clients_list_endpoint(self, auth_headers):
        """Test clients list endpoint works for dashboard navigation"""
        response = requests.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"Clients endpoint returns {len(response.json())} clients")
    
    def test_jobs_list_endpoint(self, auth_headers):
        """Test jobs list endpoint works for dashboard navigation"""
        response = requests.get(f"{BASE_URL}/api/jobs", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"Jobs endpoint returns {len(response.json())} jobs")
    
    def test_candidates_list_endpoint(self, auth_headers):
        """Test candidates list endpoint works for dashboard navigation"""
        # First get a job to list candidates for
        response = requests.get(f"{BASE_URL}/api/jobs", headers=auth_headers)
        assert response.status_code == 200
        jobs = response.json()
        
        if jobs:
            job_id = jobs[0]["job_id"]
            response = requests.get(f"{BASE_URL}/api/jobs/{job_id}/candidates", headers=auth_headers)
            assert response.status_code == 200
            assert isinstance(response.json(), list)
            print(f"Candidates endpoint returns {len(response.json())} candidates for job {job_id}")
        else:
            print("No jobs found to test candidates endpoint")
    
    def test_interviews_list_endpoint(self, auth_headers):
        """Test interviews list endpoint works for dashboard navigation"""
        response = requests.get(f"{BASE_URL}/api/interviews", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"Interviews endpoint returns {len(response.json())} interviews")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup(request):
    """Cleanup test data after all tests"""
    def cleanup_test_data():
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            return
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get all clients and delete TEST_ prefixed ones
        response = requests.get(f"{BASE_URL}/api/clients", headers=headers)
        if response.status_code == 200:
            for client in response.json():
                if client["company_name"].startswith("TEST_"):
                    requests.patch(
                        f"{BASE_URL}/api/clients/{client['client_id']}/disable",
                        headers=headers
                    )
                    print(f"Disabled test client: {client['company_name']}")
    
    request.addfinalizer(cleanup_test_data)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
