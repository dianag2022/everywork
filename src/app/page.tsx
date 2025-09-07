'use client';
import { ServicesList } from '@/components/services/ServicesList'
import SearchBar from '@/components/search/SearchBar';
import { useRouter } from 'next/navigation';
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Star, Users, CheckCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 overflow-hidden pt-10 pb-10">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main heading */}
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gray-800">Encuentra</span>{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talentos
              </span>{' '}
              <span className="text-gray-800">para trabajar</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Conecta con profesionales especializados y encuentra el servicio perfecto para tus necesidades
            </p>

            {/* Search Bar */}
            <div className="mb-12">
              <SearchBar />
            </div>

            {/* Stats section */}
            {/* <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 mb-16">
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-md">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 font-semibold">+1000 Profesionales</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-md">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-gray-700 font-semibold">4.9 Calificación</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-md">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700 font-semibold">Verificados</span>
              </div>
            </div> */}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => router.push('/search')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Explorar Servicios</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => router.push('/services/new')}
                className="px-8 py-4 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 border-2 border-gray-200 hover:border-blue-300 rounded-full font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Publicar Servicio
              </button>
            </div>
          </div>
        </div>

        {/* Floating cards animation */}
        <div className="absolute top-20 left-20 hidden lg:block animate-float">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              <div>
                <div className="h-3 bg-gray-300 rounded w-20 mb-1"></div>
                <div className="h-2 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 right-20 hidden lg:block animate-float" style={{animationDelay: '1s'}}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full"></div>
              <div>
                <div className="h-3 bg-gray-300 rounded w-24 mb-1"></div>
                <div className="h-2 bg-gray-200 rounded w-18"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios recientes */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Servicios recientes</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre los últimos servicios publicados por nuestros profesionales
            </p>
          </div>
          <ServicesList />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para encontrar tu próximo proyecto?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Explora todos nuestros servicios y conecta con los mejores profesionales
          </p>
          <button 
            onClick={() => router.push('/search')}
            className="group px-12 py-5 bg-white hover:bg-gray-50 text-blue-700 font-bold text-lg rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
          >
            <span>Ver Todos los Servicios</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 text-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Link href="/" className="flex items-center group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="everywork logo"
                  width={52}
                  height={52}
                  className="rounded-full object-cover shadow-md group-hover:shadow-lg transition-shadow duration-200"
                  priority
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-400/20 group-hover:from-blue-400/30 group-hover:to-purple-400/30 transition-all duration-200"></div>
              </div>
              
            </Link>
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-800">everywork</span>
            </div>
            <p className="text-gray-600 mb-6">
              Tu plataforma de confianza para encontrar y ofrecer servicios profesionales
            </p>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-500">
                &copy; 2025 everywork Marketplace. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}