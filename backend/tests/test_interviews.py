"""
Interview Orchestration API Tests
Tests for interview creation, slot booking, invite sending, and status management
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@arbeit.com"
ADMIN_PASSWORD = "admin123"
CLIENT_EMAIL = "client@acme.com"
CLIENT_PASSWORD = "client123"

# Known test data from manual testing
EXISTING_JOB_ID = "job_4a1de442"
EXISTING_CANDIDATE_ID = "cand_ffec2ded"
EXISTING_INTERVIEW_ID = "int_2027ba976be2"


class TestAuthSetup:
    """Authentication setup tests"""
    
    def test_admin_login(self, api_client):
        """Test admin login and get token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        return data["access_token"]
    
    def test_client_login(self, api_client):
        """Test client user login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Client login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "client_user"


class TestInterviewCreate:
    """POST /api/interviews - Create interview tests"""
    
    def test_create_interview_success(self, authenticated_admin_client):
        """Test creating a new interview with proposed slots"""
        # Generate future time slots
        now = datetime.utcnow()
        slot1_start = (now + timedelta(days=1, hours=10)).isoformat() + "Z"
        slot1_end = (now + timedelta(days=1, hours=11)).isoformat() + "Z"
        slot2_start = (now + timedelta(days=2, hours=14)).isoformat() + "Z"
        slot2_end = (now + timedelta(days=2, hours=15)).isoformat() + "Z"
        
        payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Video",
            "interview_duration": 60,
            "time_zone": "Asia/Kolkata",
            "proposed_slots": [
                {"start_time": slot1_start, "end_time": slot1_end},
                {"start_time": slot2_start, "end_time": slot2_end}
            ],
            "meeting_link": "https://meet.google.com/test-meeting",
            "additional_instructions": "Please join 5 minutes early"
        }
        
        response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=payload)
        assert response.status_code == 200, f"Create interview failed: {response.text}"
        
        data = response.json()
        assert "interview_id" in data
        assert data["interview_id"].startswith("int_")
        assert data["job_id"] == EXISTING_JOB_ID
        assert data["candidate_id"] == EXISTING_CANDIDATE_ID
        assert data["interview_mode"] == "Video"
        assert data["interview_duration"] == 60
        assert data["interview_status"] == "Awaiting Candidate Confirmation"
        assert len(data["proposed_slots"]) == 2
        assert data["meeting_link"] == "https://meet.google.com/test-meeting"
        
        # Store for later tests
        return data["interview_id"]
    
    def test_create_interview_invalid_job(self, authenticated_admin_client):
        """Test creating interview with non-existent job"""
        payload = {
            "job_id": "job_nonexistent",
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Phone",
            "interview_duration": 30,
            "proposed_slots": [
                {"start_time": "2025-01-20T10:00:00Z", "end_time": "2025-01-20T10:30:00Z"}
            ]
        }
        
        response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=payload)
        assert response.status_code == 404
        assert "Job not found" in response.json()["detail"]
    
    def test_create_interview_invalid_candidate(self, authenticated_admin_client):
        """Test creating interview with non-existent candidate"""
        payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": "cand_nonexistent",
            "interview_mode": "Onsite",
            "interview_duration": 45,
            "proposed_slots": [
                {"start_time": "2025-01-20T10:00:00Z", "end_time": "2025-01-20T10:45:00Z"}
            ]
        }
        
        response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=payload)
        assert response.status_code == 404
        assert "Candidate not found" in response.json()["detail"]
    
    def test_create_interview_without_auth(self, api_client):
        """Test creating interview without authentication"""
        payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Video",
            "interview_duration": 60,
            "proposed_slots": []
        }
        
        response = api_client.post(f"{BASE_URL}/api/interviews", json=payload)
        assert response.status_code in [401, 403]


class TestInterviewList:
    """GET /api/interviews - List interviews tests"""
    
    def test_list_interviews(self, authenticated_admin_client):
        """Test listing all interviews"""
        response = authenticated_admin_client.get(f"{BASE_URL}/api/interviews")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            interview = data[0]
            assert "interview_id" in interview
            assert "job_id" in interview
            assert "candidate_id" in interview
            assert "interview_mode" in interview
            assert "interview_status" in interview
    
    def test_list_interviews_filter_by_job(self, authenticated_admin_client):
        """Test filtering interviews by job_id"""
        response = authenticated_admin_client.get(
            f"{BASE_URL}/api/interviews",
            params={"job_id": EXISTING_JOB_ID}
        )
        assert response.status_code == 200
        
        data = response.json()
        for interview in data:
            assert interview["job_id"] == EXISTING_JOB_ID
    
    def test_list_interviews_filter_by_status(self, authenticated_admin_client):
        """Test filtering interviews by status"""
        response = authenticated_admin_client.get(
            f"{BASE_URL}/api/interviews",
            params={"status_filter": "Awaiting Candidate Confirmation"}
        )
        assert response.status_code == 200
        
        data = response.json()
        for interview in data:
            assert interview["interview_status"] == "Awaiting Candidate Confirmation"


class TestInterviewDetails:
    """GET /api/interviews/{interview_id} - Get interview details tests"""
    
    def test_get_interview_details(self, authenticated_admin_client):
        """Test getting interview details"""
        response = authenticated_admin_client.get(f"{BASE_URL}/api/interviews/{EXISTING_INTERVIEW_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["interview_id"] == EXISTING_INTERVIEW_ID
        assert "job_id" in data
        assert "candidate_id" in data
        assert "interview_mode" in data
        assert "interview_status" in data
        assert "proposed_slots" in data
        assert "created_at" in data
    
    def test_get_interview_not_found(self, authenticated_admin_client):
        """Test getting non-existent interview"""
        response = authenticated_admin_client.get(f"{BASE_URL}/api/interviews/int_nonexistent")
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]


class TestInterviewSlotBooking:
    """POST /api/interviews/{interview_id}/book-slot - Book slot tests"""
    
    def test_book_slot_success(self, authenticated_admin_client):
        """Test booking an interview slot"""
        # First create a new interview to book
        now = datetime.utcnow()
        slot1_start = (now + timedelta(days=3, hours=10)).isoformat() + "Z"
        slot1_end = (now + timedelta(days=3, hours=11)).isoformat() + "Z"
        
        create_payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Video",
            "interview_duration": 60,
            "proposed_slots": [
                {"start_time": slot1_start, "end_time": slot1_end}
            ]
        }
        
        create_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=create_payload)
        assert create_response.status_code == 200
        interview_data = create_response.json()
        interview_id = interview_data["interview_id"]
        slot_id = interview_data["proposed_slots"][0]["slot_id"]
        
        # Now book the slot
        book_payload = {
            "slot_id": slot_id,
            "confirmed": True
        }
        
        book_response = authenticated_admin_client.post(
            f"{BASE_URL}/api/interviews/{interview_id}/book-slot",
            json=book_payload
        )
        assert book_response.status_code == 200
        
        booked_data = book_response.json()
        assert booked_data["interview_status"] == "Confirmed"
        assert booked_data["selected_slot_id"] == slot_id
        assert booked_data["scheduled_start_time"] is not None
    
    def test_book_slot_invalid_slot(self, authenticated_admin_client):
        """Test booking with invalid slot_id"""
        # First create a new interview
        now = datetime.utcnow()
        slot1_start = (now + timedelta(days=4, hours=10)).isoformat() + "Z"
        slot1_end = (now + timedelta(days=4, hours=11)).isoformat() + "Z"
        
        create_payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Phone",
            "interview_duration": 30,
            "proposed_slots": [
                {"start_time": slot1_start, "end_time": slot1_end}
            ]
        }
        
        create_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=create_payload)
        interview_id = create_response.json()["interview_id"]
        
        # Try to book with invalid slot
        book_payload = {
            "slot_id": "slot_invalid",
            "confirmed": True
        }
        
        book_response = authenticated_admin_client.post(
            f"{BASE_URL}/api/interviews/{interview_id}/book-slot",
            json=book_payload
        )
        assert book_response.status_code == 404
        assert "Slot not found" in book_response.json()["detail"]


class TestInterviewInvite:
    """POST /api/interviews/{interview_id}/send-invite - Send invite tests"""
    
    def test_send_invite_success(self, authenticated_admin_client):
        """Test sending interview invite"""
        # Create and book an interview first
        now = datetime.utcnow()
        slot1_start = (now + timedelta(days=5, hours=10)).isoformat() + "Z"
        slot1_end = (now + timedelta(days=5, hours=11)).isoformat() + "Z"
        
        create_payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Video",
            "interview_duration": 60,
            "proposed_slots": [
                {"start_time": slot1_start, "end_time": slot1_end}
            ]
        }
        
        create_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=create_payload)
        interview_data = create_response.json()
        interview_id = interview_data["interview_id"]
        slot_id = interview_data["proposed_slots"][0]["slot_id"]
        
        # Book the slot
        book_payload = {"slot_id": slot_id, "confirmed": True}
        authenticated_admin_client.post(f"{BASE_URL}/api/interviews/{interview_id}/book-slot", json=book_payload)
        
        # Send invite
        invite_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews/{interview_id}/send-invite")
        assert invite_response.status_code == 200
        
        invite_data = invite_response.json()
        assert invite_data["message"] == "Invite marked as sent"
        assert invite_data["interview_id"] == interview_id
        
        # Verify interview status updated
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/interviews/{interview_id}")
        assert get_response.json()["invite_sent"] == True
        assert get_response.json()["interview_status"] == "Scheduled"


class TestInterviewStatusActions:
    """Tests for mark-completed, mark-no-show, cancel endpoints"""
    
    def test_mark_completed(self, authenticated_admin_client):
        """Test marking interview as completed"""
        # Create a scheduled interview
        now = datetime.utcnow()
        slot1_start = (now + timedelta(days=6, hours=10)).isoformat() + "Z"
        slot1_end = (now + timedelta(days=6, hours=11)).isoformat() + "Z"
        
        create_payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Video",
            "interview_duration": 60,
            "proposed_slots": [{"start_time": slot1_start, "end_time": slot1_end}]
        }
        
        create_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=create_payload)
        interview_id = create_response.json()["interview_id"]
        
        # Mark as completed
        complete_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews/{interview_id}/mark-completed")
        assert complete_response.status_code == 200
        assert complete_response.json()["message"] == "Interview marked as completed"
        
        # Verify status
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/interviews/{interview_id}")
        assert get_response.json()["interview_status"] == "Completed"
    
    def test_mark_no_show(self, authenticated_admin_client):
        """Test marking interview as no-show"""
        # Create interview
        now = datetime.utcnow()
        slot1_start = (now + timedelta(days=7, hours=10)).isoformat() + "Z"
        slot1_end = (now + timedelta(days=7, hours=11)).isoformat() + "Z"
        
        create_payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Phone",
            "interview_duration": 30,
            "proposed_slots": [{"start_time": slot1_start, "end_time": slot1_end}]
        }
        
        create_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=create_payload)
        interview_id = create_response.json()["interview_id"]
        
        # Mark as no-show
        no_show_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews/{interview_id}/mark-no-show")
        assert no_show_response.status_code == 200
        assert no_show_response.json()["message"] == "Interview marked as no-show"
        assert no_show_response.json()["no_show_count"] == 1
        
        # Verify status
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/interviews/{interview_id}")
        assert get_response.json()["interview_status"] == "No Show"
        assert get_response.json()["no_show_flag"] == True
    
    def test_cancel_interview(self, authenticated_admin_client):
        """Test cancelling an interview"""
        # Create interview
        now = datetime.utcnow()
        slot1_start = (now + timedelta(days=8, hours=10)).isoformat() + "Z"
        slot1_end = (now + timedelta(days=8, hours=11)).isoformat() + "Z"
        
        create_payload = {
            "job_id": EXISTING_JOB_ID,
            "candidate_id": EXISTING_CANDIDATE_ID,
            "interview_mode": "Onsite",
            "interview_duration": 90,
            "proposed_slots": [{"start_time": slot1_start, "end_time": slot1_end}]
        }
        
        create_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews", json=create_payload)
        interview_id = create_response.json()["interview_id"]
        
        # Cancel interview
        cancel_response = authenticated_admin_client.post(f"{BASE_URL}/api/interviews/{interview_id}/cancel")
        assert cancel_response.status_code == 200
        assert cancel_response.json()["message"] == "Interview cancelled"
        
        # Verify status
        get_response = authenticated_admin_client.get(f"{BASE_URL}/api/interviews/{interview_id}")
        assert get_response.json()["interview_status"] == "Cancelled"


class TestInterviewPipelineStats:
    """GET /api/interviews/stats/pipeline - Pipeline statistics tests"""
    
    def test_get_pipeline_stats(self, authenticated_admin_client):
        """Test getting interview pipeline statistics"""
        response = authenticated_admin_client.get(f"{BASE_URL}/api/interviews/stats/pipeline")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_interviews" in data
        assert "awaiting_confirmation" in data
        assert "confirmed" in data
        assert "scheduled" in data
        assert "completed" in data
        assert "no_shows" in data
        assert "cancelled" in data
        
        # All values should be non-negative integers
        for key, value in data.items():
            assert isinstance(value, int)
            assert value >= 0


class TestCandidateInterviews:
    """GET /api/candidates/{candidate_id}/interviews - Candidate interviews tests"""
    
    def test_get_candidate_interviews(self, authenticated_admin_client):
        """Test getting all interviews for a candidate"""
        response = authenticated_admin_client.get(f"{BASE_URL}/api/candidates/{EXISTING_CANDIDATE_ID}/interviews")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        for interview in data:
            assert interview["candidate_id"] == EXISTING_CANDIDATE_ID
            assert "interview_id" in interview
            assert "interview_status" in interview
    
    def test_get_candidate_interviews_not_found(self, authenticated_admin_client):
        """Test getting interviews for non-existent candidate"""
        response = authenticated_admin_client.get(f"{BASE_URL}/api/candidates/cand_nonexistent/interviews")
        assert response.status_code == 404


# ============ FIXTURES ============

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed - skipping authenticated tests")


@pytest.fixture
def client_token(api_client):
    """Get client user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": CLIENT_EMAIL,
        "password": CLIENT_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Client authentication failed - skipping authenticated tests")


@pytest.fixture
def authenticated_admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


@pytest.fixture
def authenticated_client_user(api_client, client_token):
    """Session with client user auth header"""
    api_client.headers.update({"Authorization": f"Bearer {client_token}"})
    return api_client
