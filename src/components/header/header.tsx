'use client'

import { AuthButton } from '@/components/auth/AuthButton'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import Link from 'next/link'
import { Search, MapPin, LayoutDashboard, Plus } from 'lucide-react'

export default function Header() {
  const { isAuthenticated, signOut } = useAuth()

  return (
    <header className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border-b border-blue-100 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="EveryWork logo"
                  width={52}
                  height={52}
                  className="rounded-full object-cover shadow-md group-hover:shadow-lg transition-shadow duration-200"
                  priority
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-400/20 group-hover:from-blue-400/30 group-hover:to-purple-400/30 transition-all duration-200"></div>
              </div>
              <div className="ml-3 hidden sm:block">
                <h1 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors duration-200">
                  EveryWork
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Tu trabajo, nuestra pasión</p>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden lg:flex space-x-1 ml-12">
              <Link 
                href="/search" 
                className="flex items-center text-gray-600 hover:text-blue-700 hover:bg-white/50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 group"
              >
                <Search className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Buscar servicios
              </Link>
              <Link 
                href="/map" 
                className="flex items-center text-gray-600 hover:text-blue-700 hover:bg-white/50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 group"
              >
                <MapPin className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Mapa
              </Link>
            </nav>
          </div>

          {/* Actions Section */} 
            {isAuthenticated && (
              <Link
                href="/services/new"
                className="hidden md:flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full shadow-md hover:shadow-lg transition-all duration-200 group transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                Publicar Servicio
              </Link>
            )}
            
            <div className="pl-2 border-l border-gray-200">
              <AuthButton />
            </div>
          </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-t border-blue-100 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center space-x-8 py-3">
            <Link 
              href="/search" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-700 transition-colors duration-200 group"
            >
              <Search className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-xs font-medium">Buscar</span>
            </Link>
            <Link 
              href="/map" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-700 transition-colors duration-200 group"
            >
              <MapPin className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-xs font-medium">Mapa</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
} 