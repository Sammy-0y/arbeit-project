#!/usr/bin/env python3
"""
Comprehensive RBAC + Audit Foundation Testing
Tests: Permission enforcement, audit logging, role management, tenant isolation, admin bypass
"""

import requests
import json
import time
from typing import Dict, Optional

API_URL = "https://hirematch-52.preview.emergentagent.com/api"

class RBACTestSuite:
    def __init__(self):
        self.tokens = {}
        self.test_data = {}
        self.results = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def log_test(self, name: str, passed: bool, message: str = ""):
        """Log test result"""
        self.results['total'] += 1
        if passed:
            self.results['passed'] += 1
            print(f"✅ {name}")
        else:
            self.results['failed'] += 1
            error_msg = f"{name}: {message}"
            self.results['errors'].append(error_msg)
            print(f"❌ {name}")
            if message:
                print(f"   → {message}")
    
    def login(self, email: str, password: str, role_key: str) -> Optional[str]:
        """Login and store token"""
        try:
            resp = requests.post(f"{API_URL}/auth/login", json={
                "email": email,
                "password": password
            })
            if resp.status_code == 200:
                self.tokens[role_key] = resp.json()['access_token']
                return self.tokens[role_key]
            return None
        except Exception as e:
            print(f"Login error for {email}: {str(e)}")
            return None
    
    def setup_test_users(self):
        """Setup and authenticate test users"""
        print("\n🔧 SETUP: Authenticating test users...")
        
        users = [
            ("admin@arbeit.com", "admin123", "admin"),
            ("recruiter@arbeit.com", "recruiter123", "recruiter"),
            ("client@acme.com", "client123", "client_user")
        ]
        
        success = True
        for email, password, role in users:
            token = self.login(email, password, role)
            if token:
                print(f"  ✓ {role}: {email}")
            else:
                print(f"  ✗ Failed: {role}")
                success = False
        
        return success
    
    def setup_test_clients_and_roles(self):
        """Create test clients with default roles"""
        print("\n🔧 SETUP: Creating test clients and roles...")
        
        # Create two test clients for tenant isolation testing
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        # Client A
        import time
        timestamp = int(time.time())
        resp_a = requests.post(f"{API_URL}/clients", headers=headers, json={
            "company_name": f"RBAC Test Corp A {timestamp}",
            "status": "active"
        })
        
        if resp_a.status_code == 200:
            self.test_data['client_a_id'] = resp_a.json()['client_id']
            print(f"  ✓ Client A: {self.test_data['client_a_id']}")
        else:
            print(f"  ✗ Failed to create Client A: {resp_a.status_code}")
            return False
        
        # Client B
        resp_b = requests.post(f"{API_URL}/clients", headers=headers, json={
            "company_name": f"RBAC Test Corp B {timestamp}",
            "status": "active"
        })
        
        if resp_b.status_code == 200:
            self.test_data['client_b_id'] = resp_b.json()['client_id']
            print(f"  ✓ Client B: {self.test_data['client_b_id']}")
        else:
            print(f"  ✗ Failed to create Client B: {resp_b.status_code}")
            return False
        
        # Give system time to create default roles
        time.sleep(1)
        
        # Verify default roles were created
        roles_resp = requests.get(
            f"{API_URL}/governance/roles?client_id={self.test_data['client_a_id']}",
            headers=headers
        )
        
        if roles_resp.status_code == 200:
            roles = roles_resp.json()
            self.test_data['roles_client_a'] = roles
            print(f"  ✓ Client A has {len(roles)} default roles")
            
            # Store role IDs by name
            for role in roles:
                if role['name'] == 'Hiring Manager':
                    self.test_data['hiring_manager_role_id'] = role['role_id']
                elif role['name'] == 'Interviewer':
                    self.test_data['interviewer_role_id'] = role['role_id']
                elif role['name'] == 'Client Owner':
                    self.test_data['client_owner_role_id'] = role['role_id']
        else:
            print(f"  ✗ Failed to get roles for Client A")
            return False
        
        return True
    
    def setup_test_users_with_roles(self):
        """Create test users and assign roles"""
        print("\n🔧 SETUP: Creating test users with specific roles...")
        
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        # Create test user for Client A with Interviewer role (read-only)
        import time
        timestamp = int(time.time())
        test_email = f"interviewer{timestamp}@testcorpa.com"
        
        user_resp = requests.post(f"{API_URL}/clients/{self.test_data['client_a_id']}/users",
            headers=headers,
            json={
                "email": test_email,
                "password": "test123",
                "name": "Test Interviewer"
            }
        )
        
        if user_resp.status_code == 200:
            print(f"  ✓ Created interviewer user")
            
            # Assign Interviewer role
            assignment_resp = requests.post(f"{API_URL}/governance/user-roles",
                headers=headers,
                json={
                    "user_id": test_email,
                    "client_role_id": self.test_data['interviewer_role_id']
                }
            )
            
            if assignment_resp.status_code == 200:
                print(f"  ✓ Assigned Interviewer role")
                
                # Login as interviewer
                token = self.login(test_email, "test123", "interviewer")
                if token:
                    print(f"  ✓ Interviewer logged in")
                else:
                    print(f"  ✗ Failed to login as interviewer")
                    return False
            else:
                print(f"  ✗ Failed to assign role: {assignment_resp.text}")
                return False
        else:
            print(f"  ✗ Failed to create user: {user_resp.text}")
            return False
        
        return True
    
    # ========== TEST CASES ==========
    
    def test_default_roles_created(self):
        """Test that default roles are created for new clients"""
        roles = self.test_data.get('roles_client_a', [])
        
        expected_roles = ['Client Owner', 'Hiring Manager', 'Interviewer']
        found_roles = [r['name'] for r in roles]
        
        passed = all(role in found_roles for role in expected_roles)
        self.log_test(
            "Default roles created for new client",
            passed,
            f"Expected {expected_roles}, found {found_roles}"
        )
    
    def test_role_permissions_structure(self):
        """Test that roles have correct permission structure"""
        roles = self.test_data.get('roles_client_a', [])
        
        if not roles:
            self.log_test("Role permissions structure", False, "No roles found")
            return
        
        # Check that Client Owner has full permissions
        client_owner = next((r for r in roles if r['name'] == 'Client Owner'), None)
        if client_owner:
            perms = client_owner['permissions']
            passed = (
                perms['can_create_jobs'] == True and
                perms['can_edit_jobs'] == True and
                perms['can_view_full_cv'] == True and
                perms['can_manage_users'] == True and
                perms['can_export_reports'] == True
            )
            self.log_test(
                "Client Owner has full permissions",
                passed,
                f"Permissions check failed" if not passed else ""
            )
        else:
            self.log_test("Client Owner role exists", False, "Client Owner role not found")
        
        # Check that Interviewer has read-only permissions
        interviewer = next((r for r in roles if r['name'] == 'Interviewer'), None)
        if interviewer:
            perms = interviewer['permissions']
            passed = (
                perms['can_view_jobs'] == True and
                perms['can_create_jobs'] == False and
                perms['can_edit_jobs'] == False and
                perms['can_upload_cv'] == False and
                perms['can_view_full_cv'] == False and
                perms['can_view_redacted_cv'] == True
            )
            self.log_test(
                "Interviewer has read-only permissions",
                passed,
                f"Permissions check failed" if not passed else ""
            )
        else:
            self.log_test("Interviewer role exists", False, "Interviewer role not found")
    
    def test_admin_bypass_permissions(self):
        """Test that Arbeit Admin can access all resources"""
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        # Admin should be able to list all roles across all clients
        resp = requests.get(f"{API_URL}/governance/roles", headers=headers)
        passed = resp.status_code == 200
        
        if passed:
            roles = resp.json()
            # Should see roles from both Client A and Client B
            client_ids = set(r['client_id'] for r in roles)
            passed = len(client_ids) >= 2
            self.log_test(
                "Admin can view roles across all clients",
                passed,
                f"Found roles for {len(client_ids)} clients, expected >= 2"
            )
        else:
            self.log_test(
                "Admin can access governance endpoints",
                False,
                f"Status {resp.status_code}"
            )
    
    def test_recruiter_bypass_permissions(self):
        """Test that Recruiter has same access as Admin"""
        headers = {"Authorization": f"Bearer {self.tokens['recruiter']}"}
        
        # Recruiter should be able to list all roles
        resp = requests.get(f"{API_URL}/governance/roles", headers=headers)
        passed = resp.status_code == 200
        
        self.log_test(
            "Recruiter has admin-level access",
            passed,
            f"Status {resp.status_code}" if not passed else ""
        )
    
    def test_permission_enforcement_create_job(self):
        """Test that Interviewer (read-only) cannot create jobs"""
        if 'interviewer' not in self.tokens:
            self.log_test("Permission enforcement - create job", False, "Interviewer not logged in")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['interviewer']}"}
        
        # Try to create a job (should fail)
        resp = requests.post(f"{API_URL}/jobs", headers=headers, json={
            "title": "Test Job",
            "location": "Remote",
            "employment_type": "Full-time",
            "experience_range": {"min_years": 0, "max_years": 2},
            "work_model": "Remote",
            "required_skills": ["Testing"],
            "description": "Test job for permission check",
            "status": "Active"
        })
        
        # Should get 403 Forbidden
        passed = resp.status_code == 403
        self.log_test(
            "Interviewer cannot create jobs (403)",
            passed,
            f"Got status {resp.status_code}, expected 403"
        )
    
    def test_tenant_isolation_roles(self):
        """Test that Client A user cannot see Client B roles"""
        if 'interviewer' not in self.tokens:
            self.log_test("Tenant isolation - roles", False, "Interviewer not logged in")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['interviewer']}"}
        
        # Try to get roles for Client B (should only see Client A)
        resp = requests.get(
            f"{API_URL}/governance/roles?client_id={self.test_data['client_b_id']}",
            headers=headers
        )
        
        if resp.status_code == 200:
            roles = resp.json()
            # Should get empty list or only Client A roles
            passed = len(roles) == 0 or all(r['client_id'] == self.test_data['client_a_id'] for r in roles)
            self.log_test(
                "Client A user cannot see Client B roles",
                passed,
                f"User saw {len(roles)} roles from Client B"
            )
        else:
            # Access denied is also acceptable
            passed = resp.status_code in [403, 404]
            self.log_test(
                "Client A user denied access to Client B roles",
                passed,
                f"Status {resp.status_code}"
            )
    
    def test_audit_log_creation(self):
        """Test that audit logs are created for actions"""
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        # Get audit logs
        resp = requests.get(f"{API_URL}/governance/audit", headers=headers)
        
        if resp.status_code == 200:
            logs = resp.json()
            
            # Should have logs for CLIENT_CREATE, ROLE_CREATE, etc.
            action_types = [log['action_type'] for log in logs]
            
            has_client_create = 'CLIENT_CREATE' in action_types
            has_role_assign = 'ROLE_ASSIGN' in action_types
            
            passed = has_client_create and len(logs) > 0
            self.log_test(
                "Audit logs created for actions",
                passed,
                f"Found {len(logs)} logs, has CLIENT_CREATE: {has_client_create}"
            )
            
            # Check log structure
            if logs:
                log = logs[0]
                required_fields = ['log_id', 'timestamp', 'user_email', 'action_type', 'entity_type']
                has_all_fields = all(field in log for field in required_fields)
                self.log_test(
                    "Audit log has required fields",
                    has_all_fields,
                    f"Missing fields" if not has_all_fields else ""
                )
        else:
            self.log_test(
                "Can retrieve audit logs",
                False,
                f"Status {resp.status_code}"
            )
    
    def test_audit_log_filtering(self):
        """Test that audit logs can be filtered"""
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        # Filter by action type
        resp = requests.get(
            f"{API_URL}/governance/audit?action_type=CLIENT_CREATE",
            headers=headers
        )
        
        if resp.status_code == 200:
            logs = resp.json()
            passed = all(log['action_type'] == 'CLIENT_CREATE' for log in logs)
            self.log_test(
                "Audit logs can be filtered by action_type",
                passed,
                f"Filter returned {len(logs)} logs"
            )
        else:
            self.log_test(
                "Audit log filtering",
                False,
                f"Status {resp.status_code}"
            )
    
    def test_client_user_audit_access_restricted(self):
        """Test that client user can only see their own audit logs"""
        if 'interviewer' not in self.tokens:
            self.log_test("Client audit access restriction", False, "Interviewer not logged in")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['interviewer']}"}
        
        # Try to get audit logs (should fail - interviewer doesn't have can_view_audit_log)
        resp = requests.get(f"{API_URL}/governance/audit", headers=headers)
        
        passed = resp.status_code == 403
        self.log_test(
            "Interviewer cannot view audit logs (403)",
            passed,
            f"Got status {resp.status_code}, expected 403"
        )
    
    def test_access_matrix_generation(self):
        """Test that access matrix can be generated"""
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        resp = requests.get(
            f"{API_URL}/governance/access-matrix?client_id={self.test_data['client_a_id']}",
            headers=headers
        )
        
        if resp.status_code == 200:
            matrix = resp.json()
            
            # Should have at least 1 user (the interviewer we created)
            passed = len(matrix) >= 1
            
            if passed and matrix:
                # Check structure
                user = matrix[0]
                required_fields = ['user_email', 'roles', 'permissions']
                has_all_fields = all(field in user for field in required_fields)
                passed = passed and has_all_fields
            
            self.log_test(
                "Access matrix generation works",
                passed,
                f"Found {len(matrix)} users in matrix"
            )
        else:
            self.log_test(
                "Access matrix endpoint",
                False,
                f"Status {resp.status_code}"
            )
    
    def test_role_crud_operations(self):
        """Test creating, updating, and deleting custom roles"""
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        # Create a custom role
        create_resp = requests.post(
            f"{API_URL}/governance/roles?client_id={self.test_data['client_a_id']}",
            headers=headers,
            json={
                "name": "Custom Test Role",
                "description": "A test role for RBAC testing",
                "permissions": {
                    "can_view_jobs": True,
                    "can_create_jobs": False,
                    "can_edit_jobs": False,
                    "can_delete_jobs": False,
                    "can_view_candidates": True,
                    "can_create_candidates": False,
                    "can_edit_candidates": False,
                    "can_delete_candidates": False,
                    "can_update_candidate_status": False,
                    "can_upload_cv": False,
                    "can_replace_cv": False,
                    "can_regenerate_story": False,
                    "can_view_full_cv": False,
                    "can_view_redacted_cv": True,
                    "can_view_audit_log": False,
                    "can_manage_roles": False,
                    "can_manage_users": False,
                    "can_export_reports": False
                }
            }
        )
        
        if create_resp.status_code == 200:
            role = create_resp.json()
            role_id = role['role_id']
            
            self.log_test("Custom role creation", True)
            
            # Update the role
            update_resp = requests.put(
                f"{API_URL}/governance/roles/{role_id}",
                headers=headers,
                json={
                    "name": "Updated Test Role"
                }
            )
            
            passed = update_resp.status_code == 200
            if passed:
                updated_role = update_resp.json()
                passed = updated_role['name'] == "Updated Test Role"
            
            self.log_test("Custom role update", passed)
            
            # Delete the role
            delete_resp = requests.delete(
                f"{API_URL}/governance/roles/{role_id}",
                headers=headers
            )
            
            passed = delete_resp.status_code == 200
            self.log_test("Custom role deletion", passed)
        else:
            self.log_test(
                "Custom role creation",
                False,
                f"Status {create_resp.status_code}: {create_resp.text}"
            )
    
    def test_failed_permission_logged(self):
        """Test that failed permission checks are logged in audit"""
        if 'interviewer' not in self.tokens:
            self.log_test("Failed permission logging", False, "Interviewer not logged in")
            return
        
        headers_interviewer = {"Authorization": f"Bearer {self.tokens['interviewer']}"}
        headers_admin = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        # Get current audit log count
        before_resp = requests.get(f"{API_URL}/governance/audit", headers=headers_admin)
        before_count = len(before_resp.json()) if before_resp.status_code == 200 else 0
        
        # Attempt forbidden action
        requests.post(f"{API_URL}/jobs", headers=headers_interviewer, json={
            "title": "Should Fail",
            "location": "Remote",
            "employment_type": "Full-time",
            "experience_range": {"min_years": 0, "max_years": 2},
            "work_model": "Remote",
            "required_skills": ["Test"],
            "description": "Test",
            "status": "Active"
        })
        
        time.sleep(1)
        
        # Check if ACCESS_DENIED was logged
        after_resp = requests.get(f"{API_URL}/governance/audit?action_type=ACCESS_DENIED", headers=headers_admin)
        
        if after_resp.status_code == 200:
            denied_logs = after_resp.json()
            passed = len(denied_logs) > 0
            self.log_test(
                "Failed permission attempts are logged",
                passed,
                f"Found {len(denied_logs)} ACCESS_DENIED logs"
            )
        else:
            self.log_test("Failed permission logging check", False, "Could not retrieve logs")
    
    def test_export_audit_csv(self):
        """Test that audit logs can be exported as CSV"""
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        resp = requests.get(f"{API_URL}/governance/audit/export", headers=headers)
        
        passed = resp.status_code == 200 and 'text/csv' in resp.headers.get('content-type', '')
        
        if passed:
            content = resp.text
            passed = 'log_id' in content and 'timestamp' in content
        
        self.log_test(
            "Audit log CSV export",
            passed,
            "" if passed else f"Status {resp.status_code}"
        )
    
    def test_export_access_matrix_csv(self):
        """Test that access matrix can be exported as CSV"""
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        resp = requests.get(
            f"{API_URL}/governance/access-matrix/export?client_id={self.test_data['client_a_id']}",
            headers=headers
        )
        
        passed = resp.status_code == 200 and 'text/csv' in resp.headers.get('content-type', '')
        
        if passed:
            content = resp.text
            passed = 'user_email' in content and 'can_view_jobs' in content
        
        self.log_test(
            "Access matrix CSV export",
            passed,
            "" if passed else f"Status {resp.status_code}"
        )
    
    # ========== RUN ALL TESTS ==========
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("\n" + "="*60)
        print("🧪 RBAC + AUDIT FOUNDATION TEST SUITE")
        print("="*60)
        
        # Setup
        if not self.setup_test_users():
            print("\n❌ CRITICAL: Failed to authenticate test users")
            return
        
        if not self.setup_test_clients_and_roles():
            print("\n❌ CRITICAL: Failed to setup test clients and roles")
            return
        
        if not self.setup_test_users_with_roles():
            print("\n❌ CRITICAL: Failed to setup users with specific roles")
            return
        
        print("\n" + "="*60)
        print("📋 RUNNING TESTS")
        print("="*60)
        
        # Run all test cases
        print("\n🔐 RBAC Tests:")
        self.test_default_roles_created()
        self.test_role_permissions_structure()
        self.test_admin_bypass_permissions()
        self.test_recruiter_bypass_permissions()
        
        print("\n🚫 Permission Enforcement Tests:")
        self.test_permission_enforcement_create_job()
        self.test_failed_permission_logged()
        
        print("\n🏢 Tenant Isolation Tests:")
        self.test_tenant_isolation_roles()
        
        print("\n📊 Audit Logging Tests:")
        self.test_audit_log_creation()
        self.test_audit_log_filtering()
        self.test_client_user_audit_access_restricted()
        
        print("\n🗂️ Governance Features Tests:")
        self.test_access_matrix_generation()
        self.test_role_crud_operations()
        self.test_export_audit_csv()
        self.test_export_access_matrix_csv()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests:  {self.results['total']}")
        print(f"✅ Passed:    {self.results['passed']}")
        print(f"❌ Failed:    {self.results['failed']}")
        print(f"Success Rate: {(self.results['passed']/self.results['total']*100):.1f}%")
        
        if self.results['errors']:
            print("\n" + "="*60)
            print("❌ FAILED TESTS DETAILS")
            print("="*60)
            for error in self.results['errors']:
                print(f"  • {error}")
        
        print("\n" + "="*60)
        
        return self.results['failed'] == 0


if __name__ == "__main__":
    suite = RBACTestSuite()
    success = suite.run_all_tests()
    
    exit(0 if success else 1)
