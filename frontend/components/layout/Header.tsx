'use client';

import { Bell, Menu, User, Phone } from 'lucide-react';
import { useState } from 'react';

const Header = ({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10 sticky top-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 font-bold text-xl text-indigo-600 dark:text-indigo-400">
              Logo
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Phone className="h-5 w-5 text-green-500" />
            <span>Cashback WhatsApp Support: +1 234 567 890</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">John Doe</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">+1234567890</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
