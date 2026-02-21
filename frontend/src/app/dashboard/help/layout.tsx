'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpCategorySidebar } from '@/components/help/HelpCategorySidebar';
import { HelpSearch } from '@/components/help/HelpSearch';
import { helpApi, type HelpCategory } from '@/services/helpApi';

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    helpApi.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  return (
    <div className="flex h-full min-h-0">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-[73px] left-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close help sidebar' : 'Open help sidebar'}
          className="h-8 w-8"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          fixed top-0 left-0 z-20 h-full w-64 bg-white border-r
          flex flex-col pt-4 pb-4 px-3 overflow-y-auto
          transition-transform duration-200 ease-in-out
        `}
      >
        <div className="mb-4">
          <HelpSearch variant="sidebar" />
        </div>
        <HelpCategorySidebar categories={categories} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
