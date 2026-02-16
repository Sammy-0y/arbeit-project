import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Briefcase,
  Calendar,
  Trash2,
  Edit,
  KeyRound,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Linkedin
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CandidatePortalManagement = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [portalUsers, setPortalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    linkedin_url: '',
    current_company: '',
    experience_years: '',
    send_welcome_email: true
  });

  useEffect(() => {
    fetchPortalUsers();
  }, [statusFilter]);

  const fetchPortalUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/admin/candidate-portal-users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortalUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch portal users:', error);
      toast.error('Failed to load candidate portal users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API}/admin/candidate-portal-users`, {
        ...formData,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Candidate portal user created successfully');
      if (formData.send_welcome_email) {
        toast.info('Welcome email with login credentials sent');
      }
      setShowCreateDialog(false);
      resetForm();
      fetchPortalUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await axios.put(`${API}/admin/candidate-portal-users/${selectedUser.candidate_portal_id}`, {
        name: formData.name,
        phone: formData.phone,
        linkedin_url: formData.linkedin_url || null,
        current_company: formData.current_company || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        status: formData.status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('User updated successfully');
      setShowEditDialog(false);
      setSelectedUser(null);
      resetForm();
      fetchPortalUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (portalId, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/candidate-portal-users/${portalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchPortalUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (portalId, email) => {
    if (!window.confirm(`Reset password for ${email}? A new temporary password will be sent to their email.`)) {
      return;
    }

    try {
      await axios.post(`${API}/admin/candidate-portal-users/${portalId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      linkedin_url: user.linkedin_url || '',
      current_company: user.current_company || '',
      experience_years: user.experience_years?.toString() || '',
      status: user.status || 'active'
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      phone: '',
      linkedin_url: '',
      current_company: '',
      experience_years: '',
      send_welcome_email: true
    });
  };

  const filteredUsers = portalUsers.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading portal users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="text-white hover:bg-white/10"
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-white/30" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidate Portal Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {filteredUsers.length} users
            </Badge>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="bg-white text-purple-900 hover:bg-gray-100"
              data-testid="create-user-button"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Portal User
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Search & Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {portalUsers.filter(u => u.status === 'active' || !u.status).length}
                </p>
                <p className="text-sm text-green-600">Active Users</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-800">
                  {portalUsers.filter(u => u.must_change_password).length}
                </p>
                <p className="text-sm text-amber-600">Pending Password Change</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {portalUsers.filter(u => u.status === 'inactive').length}
                </p>
                <p className="text-sm text-gray-600">Inactive Users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No portal users found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Create a candidate portal user to get started'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add First User
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((portalUser) => (
              <Card
                key={portalUser.candidate_portal_id}
                className="border-0 shadow-lg hover:shadow-xl transition-all"
                data-testid={`portal-user-${portalUser.candidate_portal_id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {portalUser.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{portalUser.name}</h3>
                          <Badge 
                            className={portalUser.status === 'inactive' 
                              ? 'bg-gray-100 text-gray-700' 
                              : 'bg-green-100 text-green-700'
                            }
                          >
                            {portalUser.status || 'active'}
                          </Badge>
                          {portalUser.must_change_password && (
                            <Badge className="bg-amber-100 text-amber-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Password Change Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {portalUser.email}
                          </span>
                          {portalUser.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {portalUser.phone}
                            </span>
                          )}
                          {portalUser.current_company && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {portalUser.current_company}
                            </span>
                          )}
                          {portalUser.linkedin_url && (
                            <a 
                              href={portalUser.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Linkedin className="h-4 w-4" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created: {new Date(portalUser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(portalUser.candidate_portal_id, portalUser.email)}
                        title="Reset Password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(portalUser)}
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteUser(portalUser.candidate_portal_id, portalUser.email)}
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              Create Portal User
            </DialogTitle>
            <DialogDescription>
              Create a new candidate portal account. A welcome email with login credentials will be sent.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="candidate@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Company</Label>
                <Input
                  value={formData.current_company}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_company: e.target.value }))}
                  placeholder="Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Experience (Years)</Label>
                <Input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                  placeholder="5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input
                value={formData.linkedin_url}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="send_welcome_email"
                checked={formData.send_welcome_email}
                onChange={(e) => setFormData(prev => ({ ...prev, send_welcome_email: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="send_welcome_email" className="font-normal">
                Send welcome email with login credentials
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} className="bg-purple-600 hover:bg-purple-700">
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Portal User
            </DialogTitle>
            <DialogDescription>
              Update user information. Email cannot be changed here.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Company</Label>
                <Input
                  value={formData.current_company}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_company: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Experience (Years)</Label>
                <Input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input
                value={formData.linkedin_url}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status || 'active'} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatePortalManagement;
