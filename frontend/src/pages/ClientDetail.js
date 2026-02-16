import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Mail, 
  Shield, 
  Building2, 
  Edit, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase,
  Calendar,
  Trash2,
  Save,
  X
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ClientDetail = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { token, logout, user } = useAuth();
  const [client, setClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '', confirmPassword: '', phone: '' });
  const [editData, setEditData] = useState({ 
    company_name: '', 
    status: 'active',
    industry: '',
    website: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    notes: ''
  });
  const [editUserData, setEditUserData] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    fetchClientDetails();
    fetchClientUsers();
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      const response = await axios.get(`${API}/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClient(response.data);
      setEditData({
        company_name: response.data.company_name || '',
        status: response.data.status || 'active',
        industry: response.data.industry || '',
        website: response.data.website || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        country: response.data.country || '',
        postal_code: response.data.postal_code || '',
        notes: response.data.notes || ''
      });
    } catch (error) {
      console.error('Failed to fetch client:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load client details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClientUsers = async () => {
    try {
      const response = await axios.get(`${API}/clients/${clientId}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await axios.post(`${API}/clients/${clientId}/users`, {
        email: newUser.email,
        name: newUser.name,
        password: newUser.password,
        phone: newUser.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      setShowUserForm(false);
      setNewUser({ email: '', name: '', password: '', confirmPassword: '', phone: '' });
      fetchClientUsers();
      fetchClientDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/clients/${clientId}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Client updated successfully');
      setShowEditForm(false);
      fetchClientDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update client');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || ''
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Build update payload - only include fields that changed
      const updatePayload = {};
      if (editUserData.name !== selectedUser.name) updatePayload.name = editUserData.name;
      if (editUserData.phone !== (selectedUser.phone || '')) updatePayload.phone = editUserData.phone;
      if (editUserData.email !== selectedUser.email) updatePayload.email = editUserData.email;
      
      if (Object.keys(updatePayload).length === 0) {
        toast.info('No changes to save');
        setShowEditUserDialog(false);
        return;
      }
      
      // Show warning if email is being changed
      const emailChanged = updatePayload.email && updatePayload.email !== selectedUser.email;
      if (emailChanged) {
        if (!window.confirm(`Changing email will send new login credentials to ${updatePayload.email}. Continue?`)) {
          return;
        }
      }
      
      await axios.put(`${API}/clients/${clientId}/users/${encodeURIComponent(selectedUser.email)}`, updatePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (emailChanged) {
        toast.success(`User updated. New login credentials sent to ${updatePayload.email}`);
      } else {
        toast.success('User updated successfully');
      }
      setShowEditUserDialog(false);
      setSelectedUser(null);
      fetchClientUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userEmail) => {
    if (!window.confirm(`Are you sure you want to remove ${userEmail} from this client?`)) return;
    
    try {
      await axios.delete(`${API}/clients/${clientId}/users/${encodeURIComponent(userEmail)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User removed successfully');
      fetchClientUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove user');
    }
  };

  const handleDisableClient = async () => {
    if (!window.confirm('Are you sure you want to disable this client?')) return;
    
    try {
      await axios.patch(`${API}/clients/${clientId}/disable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Client disabled successfully');
      fetchClientDetails();
    } catch (error) {
      toast.error('Failed to disable client');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return <div className="min-h-screen flex items-center justify-center">Client not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <nav className="bg-blue-900 text-white p-4 shadow-lg" data-testid="client-detail-nav">
        <div className="container mx-auto flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/clients')}
              variant="ghost"
              className="text-white hover:bg-blue-800"
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <h1 className="text-xl font-bold">{client.company_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={client.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
              {client.status}
            </Badge>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Client Information Card */}
          <Card className="lg:col-span-2 shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6" />
                  <CardTitle>Company Information</CardTitle>
                </div>
                <Button
                  onClick={() => setShowEditForm(!showEditForm)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {showEditForm ? (
                <form onSubmit={handleUpdateClient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input
                        value={editData.company_name}
                        onChange={(e) => setEditData(prev => ({ ...prev, company_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input
                        value={editData.industry}
                        onChange={(e) => setEditData(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder="e.g., Technology, Healthcare, Finance"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={editData.website}
                        onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editData.phone}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Address</Label>
                      <Input
                        value={editData.address}
                        onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={editData.city}
                        onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State/Province</Label>
                      <Input
                        value={editData.state}
                        onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={editData.country}
                        onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input
                        value={editData.postal_code}
                        onChange={(e) => setEditData(prev => ({ ...prev, postal_code: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={editData.status}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
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
                    <div className="space-y-2 md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={editData.notes}
                        onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about this client..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Company Name
                      </p>
                      <p className="font-medium text-lg">{client.company_name}</p>
                    </div>
                    {client.industry && (
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Briefcase className="h-4 w-4" /> Industry
                        </p>
                        <p className="font-medium">{client.industry}</p>
                      </div>
                    )}
                    {client.website && (
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Website
                        </p>
                        <a href={client.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                          {client.website}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone
                        </p>
                        <p className="font-medium">{client.phone}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {(client.address || client.city || client.state || client.country) && (
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Address
                        </p>
                        <p className="font-medium">
                          {[client.address, client.city, client.state, client.postal_code, client.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Client Since
                      </p>
                      <p className="font-medium">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {client.notes && (
                      <div>
                        <p className="text-sm text-gray-500">Notes</p>
                        <p className="font-medium text-gray-700">{client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div 
                className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-all"
                onClick={() => navigate(`/jobs?client=${clientId}`)}
              >
                <p className="text-3xl font-bold text-blue-600">{client.job_count || 0}</p>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{users.length}</p>
                <p className="text-sm text-gray-600">Client Users</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Client ID</p>
                <p className="text-xs text-gray-500 font-mono">{client.client_id}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Users Section */}
        <Card className="mt-6 shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6" />
                <CardTitle>Client Users ({users.length})</CardTitle>
              </div>
              <Button
                onClick={() => setShowUserForm(!showUserForm)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {showUserForm && (
              <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-4">Create New Client User</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newUser.phone}
                      onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password *</Label>
                    <Input
                      type="password"
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    Create User
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUserForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No users yet. Add a user to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user, index) => (
                  <div
                    key={user.email || index}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{user.name || 'Unnamed'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-purple-200 text-purple-700">
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role || 'client_user'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.email)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {client.status === 'active' && (
          <Card className="mt-6 border-red-200 shadow-xl">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                Disabling this client will prevent them from accessing the portal. This action can be reversed.
              </p>
              <Button
                onClick={handleDisableClient}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                Disable Client
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Changing email will trigger a new account setup email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email (Login ID)</Label>
              <Input
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
              {editUserData.email !== selectedUser?.email && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <span>⚠️</span> Email change will send new login credentials to this address
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editUserData.name}
                onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editUserData.phone}
                onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
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

export default ClientDetail;
