'use client'

import { useRouter } from 'next/navigation';
import ServiceForm from '@/components/services/ServiceForm';
import { getMyServicesCount } from '@/lib/services';
import { useState, useEffect } from 'react';
import {  SERVICE_LIMITS } from '@/lib/constants'

export default function NewServicePage() {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [maxServices, setMaxServices] = useState<number>(SERVICE_LIMITS.MAX_SERVICES_PER_USER);
  const router = useRouter();

  useEffect(() => {
    const checkServicesLimit = async () => {
      try {
        const [servicesCount] = await Promise.all([
          getMyServicesCount()
        ]);
        
        
        if (servicesCount.count >=  maxServices) {
          setShowLimitModal(true);
        }
      } catch (error) {
        console.error('Error checking services limit:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkServicesLimit();
  }, []);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <main className="mx-auto">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </main>
    );
  }

  return (
    <>
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Límite de servicios alcanzado
              </h3>

              <p className="text-gray-600 mb-6">
                Has alcanzado el límite máximo de {maxServices} servicio{maxServices !== 1 ? 's' : ''}. Para crear un nuevo servicio, primero debes eliminar uno existente.
              </p>

              <button
                onClick={handleGoToDashboard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Entiendo, volver al dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto">
        <div className="mx-auto">
          <ServiceForm />
        </div>
      </main>
    </>
  );
}