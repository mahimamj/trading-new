'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Users, DollarSign, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming a utility for conditional classes

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Account', href: '/account', icon: User },
  { name: 'My Referral', href: '/referral', icon: Users },
  { name: 'Withdrawal', href: '/withdrawal', icon: DollarSign },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 bg-gray-900 bg-opacity-30 z-30 lg:hidden transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900/80 backdrop-blur-sm">
          <span className="font-bold text-xl text-white">Share Money</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                pathname === item.href
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 flex-shrink-0 h-6 w-6',
                  pathname === item.href ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                )}
              />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-2">
            <button className="group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
                <LogOut className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" />
                Logout
            </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
