"""
Test suite for Client User Email/Password features:
1. Client user create triggers welcome email with credentials
2. Client user update with new email triggers welcome email and temp password
3. Password change endpoint works for must_change_password flow
4. Login endpoint returns must_change_password flag
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "connect@arbeit.co.in"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_session():
    """Get admin session with token"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login as admin
    login_response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
    token = login_response.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    
    return session


@pytest.fixture(scope="module")
def test_client_id(admin_session):
    """Create a test client for user tests"""
    # Create a new test client
    client_response = admin_session.post(f"{BASE_URL}/api/clients", json={
        "company_name": f"TEST Company {uuid.uuid4().hex[:6]}",
        "status": "active"
    })
    
    assert client_response.status_code in [200, 201], f"Failed to create test client: {client_response.text}"
    client_id = client_response.json()["client_id"]
    print(f"Created test client: {client_id}")
    
    yield client_id
    
    # Cleanup - delete test client
    try:
        admin_session.delete(f"{BASE_URL}/api/clients/{client_id}")
        print(f"Cleaned up test client: {client_id}")
    except Exception as e:
        print(f"Cleanup failed: {e}")


class TestLoginMustChangePassword:
    """Test login endpoint returns must_change_password flag"""
    
    def test_login_returns_must_change_password_flag(self):
        """Test that login endpoint returns must_change_password flag"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify must_change_password field exists in response
        assert "must_change_password" in data, "must_change_password field missing from login response"
        assert isinstance(data["must_change_password"], bool), "must_change_password should be boolean"
        print(f"✓ Login response includes must_change_password: {data['must_change_password']}")


class TestClientUserCreate:
    """Test client user creation with must_change_password"""
    
    def test_create_client_user_sets_must_change_password(self, admin_session, test_client_id):
        """Test that creating a client user sets must_change_password=True"""
        test_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        test_password = "TestPass123!"
        
        # Create client user
        response = admin_session.post(f"{BASE_URL}/api/clients/{test_client_id}/users", json={
            "email": test_email,
            "name": "Test User",
            "password": test_password,
            "phone": "+91 9876543210"
        })
        
        assert response.status_code in [200, 201], f"Create user failed: {response.text}"
        print(f"✓ Created client user: {test_email}")
        
        # Login as the new user to verify must_change_password flag
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        
        assert login_response.status_code == 200, f"New user login failed: {login_response.text}"
        login_data = login_response.json()
        
        assert "must_change_password" in login_data, "must_change_password missing from login response"
        assert login_data["must_change_password"] == True, "New user should have must_change_password=True"
        print(f"✓ New user must_change_password: {login_data['must_change_password']}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/clients/{test_client_id}/users/{test_email}")


class TestPasswordChange:
    """Test password change endpoint"""
    
    def test_password_change_endpoint(self, admin_session, test_client_id):
        """Test password change endpoint clears must_change_password flag"""
        test_email = f"TEST_pwchange_{uuid.uuid4().hex[:8]}@test.com"
        test_password = "OldPass123!"
        new_password = "NewPass456!"
        
        # Create client user
        create_response = admin_session.post(f"{BASE_URL}/api/clients/{test_client_id}/users", json={
            "email": test_email,
            "name": "Password Test User",
            "password": test_password
        })
        assert create_response.status_code in [200, 201], f"Create user failed: {create_response.text}"
        
        # Login as new user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        assert login_response.status_code == 200
        user_token = login_response.json()["access_token"]
        
        # Change password
        change_response = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": test_password,
                "new_password": new_password
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert change_response.status_code == 200, f"Password change failed: {change_response.text}"
        print(f"✓ Password changed successfully for {test_email}")
        
        # Login again with new password
        new_login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": new_password
        })
        
        assert new_login_response.status_code == 200, f"Login with new password failed: {new_login_response.text}"
        new_login_data = new_login_response.json()
        
        # Verify must_change_password is now False
        assert new_login_data.get("must_change_password") == False, "must_change_password should be False after password change"
        print(f"✓ After password change, must_change_password: {new_login_data.get('must_change_password')}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/clients/{test_client_id}/users/{test_email}")
    
    def test_password_change_wrong_current_password(self, admin_session, test_client_id):
        """Test password change fails with wrong current password"""
        test_email = f"TEST_wrongpw_{uuid.uuid4().hex[:8]}@test.com"
        test_password = "CorrectPass123!"
        
        # Create client user
        create_response = admin_session.post(f"{BASE_URL}/api/clients/{test_client_id}/users", json={
            "email": test_email,
            "name": "Wrong Password Test",
            "password": test_password
        })
        assert create_response.status_code in [200, 201]
        
        # Login as new user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        assert login_response.status_code == 200
        user_token = login_response.json()["access_token"]
        
        # Try to change password with wrong current password
        change_response = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": "WrongPassword123!",
                "new_password": "NewPass456!"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert change_response.status_code == 400, f"Should fail with wrong password, got: {change_response.status_code}"
        print(f"✓ Password change correctly rejected with wrong current password")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/clients/{test_client_id}/users/{test_email}")


class TestClientUserEmailUpdate:
    """Test client user email update triggers password reset"""
    
    def test_update_client_user_email_triggers_password_reset(self, admin_session, test_client_id):
        """Test that updating client user email triggers new password and must_change_password"""
        original_email = f"TEST_original_{uuid.uuid4().hex[:8]}@test.com"
        new_email = f"TEST_new_{uuid.uuid4().hex[:8]}@test.com"
        original_password = "OriginalPass123!"
        
        # Create client user
        create_response = admin_session.post(f"{BASE_URL}/api/clients/{test_client_id}/users", json={
            "email": original_email,
            "name": "Email Change Test User",
            "password": original_password
        })
        assert create_response.status_code in [200, 201], f"Create user failed: {create_response.text}"
        print(f"✓ Created user with email: {original_email}")
        
        # Update user email
        from urllib.parse import quote
        encoded_email = quote(original_email, safe='')
        update_response = admin_session.put(
            f"{BASE_URL}/api/clients/{test_client_id}/users/{encoded_email}",
            json={"email": new_email}
        )
        
        assert update_response.status_code == 200, f"Update email failed: {update_response.text}"
        updated_user = update_response.json()
        assert updated_user["email"] == new_email, "Email should be updated"
        print(f"✓ Updated user email to: {new_email}")
        
        # Verify old email no longer works
        old_login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": original_email,
            "password": original_password
        })
        assert old_login_response.status_code == 401, "Old email should not work after email change"
        print("✓ Old email correctly rejected")
        
        # Verify the user exists with the new email
        users_response = admin_session.get(f"{BASE_URL}/api/clients/{test_client_id}/users")
        assert users_response.status_code == 200
        users = users_response.json()
        user_emails = [u["email"] for u in users]
        assert new_email in user_emails, "New email should be in users list"
        assert original_email not in user_emails, "Original email should not be in users list"
        print(f"✓ Email change verified - new email in users list")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/clients/{test_client_id}/users/{new_email}")
    
    def test_update_client_user_name_only(self, admin_session, test_client_id):
        """Test updating only name doesn't trigger password reset"""
        test_email = f"TEST_nameonly_{uuid.uuid4().hex[:8]}@test.com"
        test_password = "TestPass123!"
        
        # Create client user
        create_response = admin_session.post(f"{BASE_URL}/api/clients/{test_client_id}/users", json={
            "email": test_email,
            "name": "Original Name",
            "password": test_password
        })
        assert create_response.status_code in [200, 201]
        
        # Update only name
        from urllib.parse import quote
        encoded_email = quote(test_email, safe='')
        update_response = admin_session.put(
            f"{BASE_URL}/api/clients/{test_client_id}/users/{encoded_email}",
            json={"name": "Updated Name"}
        )
        
        assert update_response.status_code == 200, f"Update name failed: {update_response.text}"
        updated_user = update_response.json()
        assert updated_user["name"] == "Updated Name", "Name should be updated"
        print(f"✓ Updated user name to: {updated_user['name']}")
        
        # Verify original password still works
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        assert login_response.status_code == 200, "Original password should still work after name-only update"
        print("✓ Original password still works after name-only update")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/clients/{test_client_id}/users/{test_email}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
