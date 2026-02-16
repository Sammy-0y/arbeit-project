import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
      <Card className="w-full max-w-md shadow-xl" data-testid="unauthorized-card">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600" data-testid="unauthorized-title">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600" data-testid="unauthorized-message">
            You don't have permission to access this page.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-900 hover:bg-blue-800"
            data-testid="back-to-dashboard-button"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};