import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { Grid, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AccessMatrix = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchMatrix();
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

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/governance/access-matrix`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { client_id: selectedClient }
      });
      setMatrix(response.data);
    } catch (error) {
      console.error('Failed to fetch matrix:', error);
      toast.error('Failed to load access matrix');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(
        `${API}/governance/access-matrix/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { client_id: selectedClient },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `access_matrix_${selectedClient}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export access matrix');
    } finally {
      setExporting(false);
    }
  };

  const PERMISSION_DISPLAY = [
    { key: 'can_view_jobs', label: 'View Jobs' },
    { key: 'can_create_jobs', label: 'Create Jobs' },
    { key: 'can_edit_jobs', label: 'Edit Jobs' },
    { key: 'can_view_candidates', label: 'View Candidates' },
    { key: 'can_create_candidates', label: 'Create Candidates' },
    { key: 'can_upload_cv', label: 'Upload CV' },
    { key: 'can_replace_cv', label: 'Replace CV' },
    { key: 'can_view_full_cv', label: 'View Full CV' },
    { key: 'can_manage_users', label: 'Manage Users' }
  ];

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
            Access Matrix
          </h2>
          <p className="text-gray-600 mt-2" style={{ fontFamily: 'Helvetica, sans-serif' }}>
            View who has what permissions across all users
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || matrix.length === 0}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export CSV'}
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

      {/* Matrix Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden" style={{ borderColor: '#D4AF37' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Roles</th>
                {PERMISSION_DISPLAY.map(perm => (
                  <th key={perm.key} className="px-4 py-3 text-center text-xs font-semibold">
                    {perm.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {matrix.map((user, idx) => (
                <tr key={idx} className="hover:bg-amber-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.user_name}</p>
                      <p className="text-xs text-gray-600">{user.user_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  {PERMISSION_DISPLAY.map(perm => (
                    <td key={perm.key} className="px-4 py-3 text-center">
                      {user.permissions[perm.key] ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {matrix.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <Grid className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No users found for this client</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
