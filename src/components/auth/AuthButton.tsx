'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, User, LayoutDashboard } from 'lucide-react';

export function AuthButton() {
  const { user, signIn, signOut, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    signOut();
    setIsDropdownOpen(false);
  };

  if (loading) {
    return (
      <button className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">
        Cargando...
      </button>
    );
  }

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-white/50 rounded-full transition-all duration-200"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
            {user.user_metadata?.full_name 
              ? user.user_metadata.full_name.charAt(0).toUpperCase() 
              : user.email?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
            }
          </div>
          <span className="hidden sm:block">
            {user.user_metadata?.full_name || user.email}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setIsDropdownOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4 mr-3 text-gray-500" />
              Panel
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="w-4 h-4 mr-3 text-gray-500">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4.5a.5.5 0 0 0 0-1H2z"/>
                  <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                </svg>
              </div>
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
    >
      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Iniciar Sesión con Google
    </button>
  );
}