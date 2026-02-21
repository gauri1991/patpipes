'use client';

import { useState } from 'react';
import { analyticsApi } from '@/services/analyticsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ApiTestComponent() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const runTest = async (testName: string, apiCall: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await apiCall();
      setTestResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: 'Dashboard',
      call: () => analyticsApi.getDashboard()
    },
    {
      name: 'Projects',
      call: () => analyticsApi.getProjects()
    },
    {
      name: 'Chart Templates',
      call: () => analyticsApi.getChartTemplates()
    },
    {
      name: 'Report Templates', 
      call: () => analyticsApi.getReportTemplates()
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.map((test) => (
            <div key={test.name} className="flex items-center gap-4">
              <Button 
                onClick={() => runTest(test.name, test.call)}
                disabled={loading[test.name]}
                size="sm"
              >
                {loading[test.name] ? 'Testing...' : `Test ${test.name}`}
              </Button>
              
              {testResults[test.name] && (
                <div className={`text-sm ${testResults[test.name].success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults[test.name].success ? '✅ Success' : `❌ ${testResults[test.name].error}`}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {Object.entries(testResults).map(([testName, result]) => (
        result.success && result.data && (
          <Card key={testName}>
            <CardHeader>
              <CardTitle className="text-sm">{testName} Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
}