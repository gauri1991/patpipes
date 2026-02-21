'use client';

export default function DashboardTestPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard Route Test</h1>
      <p>This page is outside the dashboard layout group.</p>
      <p>If you can see this, Next.js routing is working correctly.</p>
      
      <div className="mt-8 space-y-2">
        <p>Try these URLs:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><code>http://localhost:3000/dashboard-test</code> (current page)</li>
          <li><code>http://localhost:3000/dashboard/simple-test</code> (no auth check)</li>
          <li><code>http://localhost:3000/dashboard/debug</code> (auth debug)</li>
          <li><code>http://localhost:3000/dashboard</code> (full auth check)</li>
        </ul>
      </div>
    </div>
  );
}