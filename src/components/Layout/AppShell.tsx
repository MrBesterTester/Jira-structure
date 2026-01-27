/**
 * AppShell - Main application layout component
 * 
 * Provides the overall structure with sidebar and main content area.
 * Handles responsive sidebar collapse behavior.
 * Includes the issue detail panel overlay.
 */

import { ReactNode } from 'react';
import { useUIStore } from '../../store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MainContent } from './MainContent';
import { IssueDetailPanel, CreateIssueModal } from '../Issue';
import { BulkActionBar } from '../BulkActions';

interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Header */}
        <Header />

        {/* Main Content */}
        <MainContent>
          {children}
        </MainContent>
      </div>

      {/* Issue Detail Panel (slides in from right) */}
      <IssueDetailPanel />

      {/* Create Issue Modal */}
      <CreateIssueModal />

      {/* Bulk Action Bar (floating, appears when issues selected) */}
      <BulkActionBar />
    </div>
  );
}
