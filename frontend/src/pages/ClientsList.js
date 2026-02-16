import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Search, Plus, Users, Building2, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ClientsList = () => {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClient, setNewClient] = useState({ company_name: '', status: 'active' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async (searchQuery = '') => {
    try {
      const params = searchQuery ? `?search=${searchQuery}` : '';
      const response = await axios.get(`${API}/clients${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClients(search);
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/clients`, newClient, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Client created successfully');
      setShowCreateForm(false);
      setNewClient({ company_name: '', status: 'active' });
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create client');
    }
  };

  const handleDeleteClient = async (clientId, companyName) => {
    if (!window.confirm(`Are you sure you want to delete "${companyName}"? This will delete all associated jobs and candidates. This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete client');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <nav className="bg-blue-900 text-white p-4 shadow-lg" data-testid="clients-nav">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/dashboard')}>
              Arbeit Talent Portal
            </h1>
            <Badge variant="outline" className="border-white text-white">
              Client Management
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="text-white hover:bg-blue-800"
              data-testid="back-to-dashboard-button"
            >
              Dashboard
            </Button>
            <span className="text-sm">{user?.name}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white text-white hover:bg-blue-800"
              data-testid="logout-button"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-8">
        <Card className="shadow-xl mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                <CardTitle className="text-3xl" data-testid="page-title">
                  Client Companies
                </CardTitle>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-teal-500 hover:bg-teal-600 text-white"
                data-testid="add-client-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Create Form */}
            {showCreateForm && (
              <div className="mb-6 p-4 border border-teal-200 rounded-lg bg-teal-50" data-testid="create-client-form">
                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <Input
                      value={newClient.company_name}
                      onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                      placeholder="Enter company name"
                      required
                      data-testid="company-name-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-900 hover:bg-blue-800" data-testid="submit-client-button">
                      Create Client
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      data-testid="cancel-client-button"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" data-testid="search-button">Search</Button>
              {search && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSearch(''); fetchClients(); }}
                >
                  Clear
                </Button>
              )}
            </form>

            {/* Clients Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-gray-500" data-testid="empty-state">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No clients found</p>
                <p className="text-sm">Create your first client to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="clients-table">
                  <thead>
                    <tr className="border-b-2 border-blue-200">
                      <th className="text-left p-3 font-semibold text-blue-900">Company Name</th>
                      <th className="text-left p-3 font-semibold text-blue-900">Status</th>
                      <th className="text-left p-3 font-semibold text-blue-900">Users</th>
                      <th className="text-left p-3 font-semibold text-blue-900">Created</th>
                      <th className="text-right p-3 font-semibold text-blue-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr
                        key={client.client_id}
                        className="border-b hover:bg-blue-50 transition-colors"
                        data-testid={`client-row-${client.client_id}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{client.company_name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={client.status === 'active' ? 'default' : 'secondary'}
                            className={client.status === 'active' ? 'bg-teal-500' : 'bg-gray-500'}
                          >
                            {client.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{client.user_count || 0}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">
                          {new Date(client.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => navigate(`/clients/${client.client_id}`)}
                              size="sm"
                              className="bg-blue-900 hover:bg-blue-800"
                              data-testid={`view-client-button-${client.client_id}`}
                            >
                              View Details
                            </Button>
                            {user?.role === 'admin' && (
                              <Button
                                onClick={() => handleDeleteClient(client.client_id, client.company_name)}
                                size="sm"
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                                data-testid={`delete-client-button-${client.client_id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};