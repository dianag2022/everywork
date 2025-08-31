'use client'

import { AuthButton } from '@/components/auth/AuthButton'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="bg-dark shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="EveryWork logo"
                width={48}
                height={48}
                className="rounded-full object-cover mr-3"
                priority
              />
            </Link>
            <nav className="hidden md:flex space-x-8 ml-10">
              <Link href="/search" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Buscar servicios
              </Link>
              <Link href="/map" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Mapa
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                Panel de control
              </Link>
            )}
            {isAuthenticated && (
              <Link
                href="/services/new"
                className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Publicar Servicio
              </Link>
            )}
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}