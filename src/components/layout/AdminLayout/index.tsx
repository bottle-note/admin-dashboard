/**
 * 어드민 레이아웃 컴포넌트
 * Header + Sidebar + Content 구조
 */

import { Outlet } from 'react-router';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { MobileSidebar } from '../Sidebar/MobileSidebar';

export function AdminLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex" />

        {/* Mobile Sidebar */}
        <MobileSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
