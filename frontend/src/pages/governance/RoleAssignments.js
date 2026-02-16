import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus, X, Loader2, UserCheck } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const RoleAssignments = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientData();
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
      if (response.data.length > 0) {
        setSelectedClient(response.data[0].client_id);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // Fetch users, roles, and assignments in parallel
      const [usersRes, rolesRes, assignmentsRes] = await Promise.all([
        axios.get(`${API}/clients/${selectedClient}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/governance/roles`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { client_id: selectedClient }
        }),
        axios.get(`${API}/governance/user-roles`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { client_id: selectedClient }
        })
      ]);

      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      console.error('Failed to fetch client data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = (userEmail) => {
    return assignments
      .filter(a => a.user_email === userEmail)
      .map(a => a.role_name);
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      await axios.post(
        `${API}/governance/user-roles`,
        {
          user_id: userId,
          client_role_id: roleId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Role assigned successfully');
      fetchClientData();
      setShowAssignModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast.error(error.response?.data?.detail || 'Failed to assign role');
    }
  };

  const handleRevokeRole = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to revoke this role assignment?')) {
      return;
    }

    try {
      await axios.delete(`${API}/governance/user-roles/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Role revoked successfully');
      fetchClientData();
    } catch (error) {
      console.error('Failed to revoke role:', error);
      toast.error(error.response?.data?.detail || 'Failed to revoke role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 
          className="text-3xl font-bold text-gray-900"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Assign Roles to Users
        </h2>
        <p className="text-gray-600 mt-2" style={{ fontFamily: 'Helvetica, sans-serif' }}>
          Manage which users have which roles within each client organization
        </p>
      </div>

      {/* Client Selector */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Select Client:
        </label>
        <select
          value={selectedClient || ''}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          {clients.map(client => (
            <option key={client.client_id} value={client.client_id}>
              {client.company_name}
            </option>
          ))}
        </select>
      </div>

      {/* Users List */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border" style={{ borderColor: '#D4AF37' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-600" />
            <h3 
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Users & Role Assignments
            </h3>
          </div>
          <Badge className="px-3 py-1" style={{ backgroundColor: '#D4AF37', color: 'white' }}>
            {users.length} Users
          </Badge>
        </div>

        <div className="space-y-3">
          {users.map(user => {
            const userRoles = getUserRoles(user.email);
            const userAssignments = assignments.filter(a => a.user_email === user.email);

            return (
              <div
                key={user.email}
                className="bg-white/50 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-amber-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>

                    {/* Role Chips */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {userAssignments.length === 0 ? (
                        <Badge variant="outline" className="text-gray-500">
                          No roles assigned
                        </Badge>
                      ) : (
                        userAssignments.map(assignment => (
                          <Badge
                            key={assignment.assignment_id}
                            className="px-3 py-1 bg-amber-100 text-amber-800 flex items-center gap-2"
                          >
                            <UserCheck className="h-3 w-3" />
                            {assignment.role_name}
                            <button
                              onClick={() => handleRevokeRole(assignment.assignment_id)}
                              className="ml-1 hover:text-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowAssignModal(true);
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Assign Role
                  </Button>
                </div>
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No users found for this client</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Role Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            style={{ backgroundColor: '#F7F5F1' }}
          >
            <h3 
              className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Assign Role
            </h3>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">User:</p>
              <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                <p className="font-semibold">{selectedUser.name}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Select Role to Assign:</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {roles.map(role => {
                  const userRoles = getUserRoles(selectedUser.email);
                  const isAssigned = userRoles.includes(role.name);

                  return (
                    <button
                      key={role.role_id}
                      onClick={() => !isAssigned && handleAssignRole(selectedUser.email, role.role_id)}
                      disabled={isAssigned}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isAssigned
                          ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                          : 'border-amber-300 hover:border-amber-500 hover:bg-amber-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{role.name}</p>
                          <p className="text-xs text-gray-600">{role.description}</p>
                        </div>
                        {isAssigned && (
                          <Badge className="bg-green-100 text-green-800">
                            Assigned
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUser(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
