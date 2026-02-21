'use client';

import { Button } from '@/components/ui/button';
import { useAsyncLoading } from '@/hooks/useAsyncLoading';

export function AsyncLoadingExample() {
  const { withLoading, showLoading, hideLoading } = useAsyncLoading();

  // Example: Using withLoading wrapper
  const handleApiCall = async () => {
    await withLoading(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('API call completed');
    }, 'Fetching data from server...');
  };

  // Example: Manual loading control
  const handleManualLoading = async () => {
    showLoading('Processing your request...');
    
    try {
      // Simulate some async work
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Manual operation completed');
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Async Loading Examples</h3>
      
      <div className="space-x-4">
        <Button onClick={handleApiCall}>
          Trigger API Call Loading
        </Button>
        
        <Button onClick={handleManualLoading} variant="outline">
          Manual Loading Control
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Click these buttons to see the global loading overlay in action for async operations.
      </p>
    </div>
  );
}

// Example of how to use in any component:
/*
import { useAsyncLoading } from '@/hooks/useAsyncLoading';

export function MyComponent() {
  const { withLoading } = useAsyncLoading();

  const fetchUserData = async () => {
    await withLoading(async () => {
      const response = await fetch('/api/users');
      const data = await response.json();
      // Process data...
    }, 'Loading user data...');
  };

  return (
    <button onClick={fetchUserData}>
      Load User Data
    </button>
  );
}
*/