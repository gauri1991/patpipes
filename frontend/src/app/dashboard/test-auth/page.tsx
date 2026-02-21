'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>({});

  useEffect(() => {
    // Check localStorage
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const authSession = localStorage.getItem('auth_session');
    
    setAuthInfo({
      hasAccessToken: !!accessToken,
      accessTokenPreview: accessToken ? `${accessToken.substring(0, 50)}...` : 'None',
      hasRefreshToken: !!refreshToken,
      hasAuthSession: !!authSession,
      authSession: authSession ? JSON.parse(authSession) : null,
      currentUrl: window.location.href,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'Not set'
    });
  }, []);

  const testNavigation = () => {
    // This should navigate in the same tab
    window.location.href = '/dashboard/workflows/templates/2b8f026c-fb23-47e6-b284-81b56b21e112';
  };

  const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_session');
    localStorage.removeItem('auth-storage');
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Auth Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Access Token:</strong> {authInfo.hasAccessToken ? '✓ Present' : '✗ Missing'}
          </div>
          <div>
            <strong>Refresh Token:</strong> {authInfo.hasRefreshToken ? '✓ Present' : '✗ Missing'}
          </div>
          <div>
            <strong>Auth Session:</strong> {authInfo.hasAuthSession ? '✓ Present' : '✗ Missing'}
          </div>
          {authInfo.authSession && (
            <div>
              <strong>User:</strong> {authInfo.authSession.user?.email || 'Unknown'}
            </div>
          )}
          <div>
            <strong>API URL:</strong> {authInfo.apiUrl}
          </div>
          <div>
            <strong>Current URL:</strong> {authInfo.currentUrl}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={testNavigation}>
              Test Navigation to Template Detail (Same Tab)
            </Button>
          </div>
          <div>
            <Button 
              onClick={() => window.open('/dashboard/workflows/templates/2b8f026c-fb23-47e6-b284-81b56b21e112', '_self')}
            >
              Force Same Tab Navigation
            </Button>
          </div>
          <div>
            <Button variant="destructive" onClick={clearAuth}>
              Clear All Auth Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>localStorage Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
            {JSON.stringify(authInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}