'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Dashboard from './Dashboard';
import Account from './Account';
import Referral from './Referral';
import Withdrawal from './Withdrawal';

type ActivePage = 'dashboard' | 'account' | 'referral' | 'withdrawal';

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        
        // Verify token with backend
        await authAPI.getCurrentUser();
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'account':
        return <Account />;
      case 'referral':
        return <Referral />;
      case 'withdrawal':
        return <Withdrawal />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <TopBar
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <div className="animate-fade-in">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
