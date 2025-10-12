'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getServicesByProvider, deleteService } from '@/lib/services'
import { Service } from '@/types/database'
import { Edit, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { generateServiceSlug } from '@/lib/slugify'

export default function DashboardPage() {
  const [activeServices, setActiveServices] = useState<Service[]>([])
  const [inactiveServices, setInactiveServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<{
    show: boolean
    service: Service | null
  }>({ show: false, service: null })
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const fetchServices = async () => {
      if (!user?.id) return

      try {
        const services = await getServicesByProvider(user.id)
        setActiveServices(services.filter(service => service.status))
        setInactiveServices(services.filter(service => !service.status))
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [user?.id])

  const handleDeleteService = async (service: Service) => {
    setShowDeleteModal({ show: true, service })
  }

  const confirmDelete = async () => {
    if (!showDeleteModal.service) return

    setDeleteLoading(showDeleteModal.service.id)
    try {
      await deleteService(showDeleteModal.service.id)

      // Actualizar el estado local - mover el servicio de activos a inactivos
      setActiveServices(prev => prev.filter(s => s.id !== showDeleteModal.service!.id))
      setInactiveServices(prev => [
        ...prev,
        { ...showDeleteModal.service!, status: false }
      ])

      setShowDeleteModal({ show: false, service: null })
    } catch (error) {
      console.error('Error deleting service:', error)
      // Aquí podrías mostrar un toast de error
    } finally {
      setDeleteLoading(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal({ show: false, service: null })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso requerido</h1>
          <p className="text-gray-600">Debes iniciar sesión para acceder a tu dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tus servicios</h1>
          <Link
            href="/services/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir servicio
          </Link>
        </div>

        {/* Active Services */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activos</h2>
          <div className="space-y-3">
            {activeServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay servicios activos.</p>
                <Link href="/services/new" className="text-blue-600 hover:underline">
                  Crea tu primer servicio
                </Link>
              </div>
            ) : (
              activeServices.map((service) => (
                <ServiceListItem
                  key={service.id}
                  service={service}
                  onDelete={handleDeleteService}
                  deleteLoading={deleteLoading === service.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Inactive Services */}
        {inactiveServices.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Inactivos</h2>
            <div className="space-y-3">
              {inactiveServices.map((service) => (
                <ServiceListItem
                  key={service.id}
                  service={service}
                  onDelete={handleDeleteService}
                  deleteLoading={deleteLoading === service.id}
                  isInactive={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar el servicio &quot;{showDeleteModal.service?.title}&quot;?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={deleteLoading !== null}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceListItem({
  service,
  onDelete,
  deleteLoading,
  isInactive = false
}: {
  service: Service
  onDelete: (service: Service) => void
  deleteLoading: boolean
  isInactive?: boolean
}) {
  return (
    <div className={`bg-white rounded-lg p-4 flex items-center space-x-4 shadow-sm border border-gray-100 ${isInactive ? 'opacity-60' : ''
      }`}>
      {/* Service Image */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
          {service.main_image ? (
            <Link
              href={!isInactive ? `/services/${service.id}` : "#"}
              className={isInactive ? "pointer-events-none opacity-50" : ""}
            >
              <img
                src={service.main_image}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            </Link>

          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Service Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {service.title}
          {isInactive && <span className="ml-2 text-sm text-red-500">(Eliminado)</span>}
        </h3>
        <p className="text-sm text-gray-500">
          {service.category || 'Sin categoría'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        {/* Edit Button */}
        <p>{service.id}</p>
        {!isInactive && (
          <Link
            href={`/services/${generateServiceSlug(service)}/edit`}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Edit className="w-5 h-5" />
          </Link>
        )}

        {/* Delete Button */}
        {!isInactive && (
          <button
            onClick={() => onDelete(service)}
            disabled={deleteLoading}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteLoading ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}