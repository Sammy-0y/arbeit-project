import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Save, 
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PERMISSION_CATEGORIES = {
  'Job Management': ['can_view_jobs', 'can_create_jobs', 'can_edit_jobs', 'can_delete_jobs'],
  'Candidate Management': ['can_view_candidates', 'can_create_candidates', 'can_edit_candidates', 'can_delete_candidates'],
  'Candidate Actions': ['can_update_candidate_status', 'can_upload_cv', 'can_replace_cv', 'can_regenerate_story'],
  'CV Access': ['can_view_full_cv', 'can_view_redacted_cv'],
  'Governance': ['can_view_audit_log', 'can_manage_roles', 'can_manage_users', 'can_export_reports']
};

const PERMISSION_LABELS = {
  can_view_jobs: 'View Jobs',
  can_create_jobs: 'Create Jobs',
  can_edit_jobs: 'Edit Jobs',
  can_delete_jobs: 'Delete Jobs',
  can_view_candidates: 'View Candidates',
  can_create_candidates: 'Create Candidates',
  can_edit_candidates: 'Edit Candidates',
  can_delete_candidates: 'Delete Candidates',
  can_update_candidate_status: 'Update Candidate Status',
  can_upload_cv: 'Upload CV',
  can_replace_cv: 'Replace CV',
  can_regenerate_story: 'Regenerate AI Story',
  can_view_full_cv: 'View Full (Unredacted) CV',
  can_view_redacted_cv: 'View Redacted CV',
  can_view_audit_log: 'View Audit Logs',
  can_manage_roles: 'Manage Roles',
  can_manage_users: 'Manage Users',
  can_export_reports: 'Export Reports'
};

export const RolesPermissions = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [roles, setRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchRoles();
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

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API}/governance/roles`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { client_id: selectedClient }
      });
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const handlePermissionToggle = (roleId, permission) => {
    setRoles(roles.map(role => {
      if (role.role_id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permission]: !role.permissions[permission]
          }
        };
      }
      return role;
    }));
  };

  const handleSaveRole = async (role) => {
    try {
      await axios.put(
        `${API}/governance/roles/${role.role_id}`,
        {
          name: role.name,
          description: role.description,
          permissions: role.permissions
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Role updated successfully');
      setEditingRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? All user assignments will be removed.')) {
      return;
    }

    try {
      await axios.delete(`${API}/governance/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete role');
    }
  };

  const handleCreateRole = async (newRole) => {
    try {
      await axios.post(
        `${API}/governance/roles?client_id=${selectedClient}`,
        newRole,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Role created successfully');
      setShowCreateModal(false);
      fetchRoles();
    } catch (error) {
      console.error('Failed to create role:', error);
      toast.error(error.response?.data?.detail || 'Failed to create role');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Roles & Permissions
          </h2>
          <p className="text-gray-600 mt-2" style={{ fontFamily: 'Helvetica, sans-serif' }}>
            Manage role definitions and permission sets for each client
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Role
        </Button>
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

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map(role => (
          <div
            key={role.role_id}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border"
            style={{ borderColor: '#D4AF37' }}
          >
            {/* Role Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-amber-600" />
                  {editingRole === role.role_id ? (
                    <input
                      type="text"
                      value={role.name}
                      onChange={(e) => setRoles(roles.map(r => 
                        r.role_id === role.role_id ? {...r, name: e.target.value} : r
                      ))}
                      className="text-xl font-bold px-2 py-1 border border-amber-300 rounded"
                      style={{ fontFamily: 'Georgia, serif' }}
                    />
                  ) : (
                    <h3 
                      className="text-xl font-bold text-gray-900"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {role.name}
                    </h3>
                  )}
                </div>
                {editingRole === role.role_id ? (
                  <textarea
                    value={role.description || ''}
                    onChange={(e) => setRoles(roles.map(r => 
                      r.role_id === role.role_id ? {...r, description: e.target.value} : r
                    ))}
                    className="text-sm text-gray-600 w-full px-2 py-1 border border-amber-300 rounded"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm text-gray-600">{role.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {editingRole === role.role_id ? (
                  <>
                    <Button
                      onClick={() => handleSaveRole(role)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingRole(null);
                        fetchRoles();
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setEditingRole(role.role_id)}
                      size="sm"
                      variant="outline"
                      className="text-amber-700 border-amber-300"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteRole(role.role_id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-4 mt-6">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {permissions.map(permission => (
                      <label
                        key={permission}
                        className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-amber-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={role.permissions[permission] || false}
                          onChange={() => handlePermissionToggle(role.role_id, permission)}
                          disabled={editingRole !== role.role_id}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">
                          {PERMISSION_LABELS[permission]}
                        </span>
                        {role.permissions[permission] && (
                          <CheckCircle2 className="h-3 w-3 text-green-600 ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRole}
        />
      )}
    </div>
  );
};

// Create Role Modal Component
const CreateRoleModal = ({ onClose, onCreate }) => {
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: Object.keys(PERMISSION_LABELS).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  });

  const handleSubmit = () => {
    if (!newRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    onCreate(newRole);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#F7F5F1' }}
      >
        <h3 
          className="text-2xl font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Create New Role
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Role Name *
            </label>
            <input
              type="text"
              value={newRole.name}
              onChange={(e) => setNewRole({...newRole, name: e.target.value})}
              className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="e.g., Hiring Coordinator"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Description
            </label>
            <textarea
              value={newRole.description}
              onChange={(e) => setNewRole({...newRole, description: e.target.value})}
              className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              rows={3}
              placeholder="Brief description of this role..."
            />
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-4 mb-6">
          <h4 className="font-semibold text-gray-900">Permissions</h4>
          {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
            <div key={category} className="bg-white/50 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">{category}</h5>
              <div className="grid grid-cols-2 gap-2">
                {permissions.map(permission => (
                  <label
                    key={permission}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newRole.permissions[permission]}
                      onChange={(e) => setNewRole({
                        ...newRole,
                        permissions: {
                          ...newRole.permissions,
                          [permission]: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">
                      {PERMISSION_LABELS[permission]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
          >
            Create Role
          </Button>
        </div>
      </div>
    </div>
  );
};
