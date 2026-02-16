import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuditLogs = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action_type: '',
    user_id: '',
    from_date: '',
    to_date: '',
    limit: 100
  });
  const [expandedLog, setExpandedLog] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.action_type) params.action_type = filters.action_type;
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      params.limit = filters.limit;

      const response = await axios.get(`${API}/governance/audit`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (filters.action_type) params.action_type = filters.action_type;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;

      const response = await axios.get(
        `${API}/governance/audit/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const ACTION_TYPES = [
    'CLIENT_CREATE', 'JOB_CREATE', 'JOB_UPDATE', 'JOB_DELETE',
    'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE',
    'CV_REPLACED', 'CV_SOFT_DELETE', 'CV_HARD_DELETE',
    'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE',
    'ROLE_ASSIGN', 'ROLE_REVOKE',
    'ACCESS_DENIED'
  ];

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE') || action.includes('ASSIGN')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE') || action.includes('REVOKE')) return 'bg-red-100 text-red-800';
    if (action.includes('DENIED')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading && logs.length === 0) {
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
            Audit Logs
          </h2>
          <p className="text-gray-600 mt-2" style={{ fontFamily: 'Helvetica, sans-serif' }}>
            Complete audit trail of all system actions and access attempts
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || logs.length === 0}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Action Type</label>
            <select
              value={filters.action_type}
              onChange={(e) => setFilters({...filters, action_type: e.target.value})}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">From Date</label>
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters({...filters, from_date: e.target.value})}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">To Date</label>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters({...filters, to_date: e.target.value})}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={fetchLogs}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden" style={{ borderColor: '#D4AF37' }}>
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-amber-700 text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Entity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {logs.map((log, idx) => (
                <React.Fragment key={log.log_id}>
                  <tr 
                    className="hover:bg-amber-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === idx ? null : idx)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.user_email}</p>
                        <p className="text-xs text-gray-500">{log.user_role}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getActionBadgeColor(log.action_type)}>
                        {log.action_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="text-gray-900">{log.entity_type}</p>
                        {log.entity_id && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{log.entity_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-amber-600 hover:text-amber-800">
                        {expandedLog === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                  {expandedLog === idx && (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 bg-amber-50/50">
                        <div className="space-y-2">
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">Metadata:</p>
                              <pre className="text-xs bg-white p-3 rounded border border-amber-200 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.previous_value && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">Previous Value:</p>
                              <pre className="text-xs bg-white p-3 rounded border border-amber-200 overflow-x-auto">
                                {JSON.stringify(log.previous_value, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_value && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">New Value:</p>
                              <pre className="text-xs bg-white p-3 rounded border border-amber-200 overflow-x-auto">
                                {JSON.stringify(log.new_value, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No audit logs found</p>
            </div>
          )}
        </div>

        {logs.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-amber-200 text-sm text-gray-600">
            Showing {logs.length} log entries
          </div>
        )}
      </div>
    </div>
  );
};
