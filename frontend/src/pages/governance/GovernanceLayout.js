import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Shield, Users, Grid, FileText } from 'lucide-react';

export const GovernanceLayout = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/governance/roles', label: 'Roles & Permissions', icon: Shield },
    { path: '/governance/assignments', label: 'Assign Roles to Users', icon: Users },
    { path: '/governance/matrix', label: 'Access Matrix', icon: Grid },
    { path: '/governance/audit', label: 'Audit Logs', icon: FileText }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5F1' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 shadow-lg">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-amber-400" />
              <h1 
                className="text-3xl font-bold"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
              >
                Governance Console
              </h1>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <span>← Back to Dashboard</span>
            </Link>
          </div>
          <p className="text-gray-300" style={{ fontFamily: 'Helvetica, sans-serif' }}>
            Role-Based Access Control, Audit Logs & Compliance Management
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-amber-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-6">
          <nav className="flex gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                    isActive(item.path)
                      ? 'border-b-2 text-amber-700'
                      : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50/50'
                  }`}
                  style={{ 
                    fontFamily: 'Helvetica, sans-serif',
                    borderColor: isActive(item.path) ? '#D4AF37' : 'transparent'
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl p-6">
        <Outlet />
      </div>
    </div>
  );
};
