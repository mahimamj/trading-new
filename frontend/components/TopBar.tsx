'use client';

import { useState } from 'react';
import { Menu, User, Phone, ChevronDown, LogOut } from 'lucide-react';

interface TopBarProps {
  user: any;
  onLogout: () => void;
  onMenuClick: () => void;
}

export default function TopBar({ user, onLogout, onMenuClick }: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="bg-dark-800 border-b border-slate-700 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        {/* Left Side - Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
        >
          <Menu size={24} />
        </button>

        {/* Center - WhatsApp Support */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <Phone size={16} />
            <span className="text-sm">Support:</span>
          </div>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 font-medium text-sm"
          >
            +91 98765 43210
          </a>
        </div>

        {/* Right Side - User Profile */}
        <div className="flex items-center space-x-4">
          {/* Mobile WhatsApp Support */}
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden p-2 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg"
          >
            <Phone size={20} />
          </a>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-dark-800 border border-slate-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
                  <p className="text-xs text-slate-400 mt-1">{user?.phone || 'No phone'}</p>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={() => {
                      onLogout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile WhatsApp Support Banner */}
      <div className="md:hidden mt-3 p-3 bg-primary-600/20 border border-primary-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-300 text-sm font-medium">Need Help?</p>
            <p className="text-primary-100 text-xs">Contact us on WhatsApp</p>
          </div>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-xs py-2 px-3"
          >
            Chat Now
          </a>
        </div>
      </div>
    </div>
  );
}
