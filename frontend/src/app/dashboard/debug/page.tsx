'use client';

import { useAuthStore } from '@/domains/accounts/store/auth.store';
import { ApiTestComponent } from '@/components/debug/ApiTestComponent';
import { Separator } from '@/components/ui/separator';

export default function DebugPage() {
  const { user, isAuthenticated, isLoading, error } = useAuthStore();

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>
      
      <div className="space-y-2">
        <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
      </div>
      
      <div className="space-y-2">
        <p><strong>localStorage tokens:</strong></p>
        <p>Access Token: {typeof window !== 'undefined' ? localStorage.getItem('access_token') : 'SSR'}</p>
        <p>Refresh Token: {typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : 'SSR'}</p>
      </div>
      
      <Separator />
      
      <ApiTestComponent />
    </div>
  );
}