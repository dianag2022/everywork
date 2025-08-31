import { getServiceById } from '@/lib/services'
import Image from 'next/image'
// Ajusta la ruta según donde esté definido el tipo Service
import type { ServiceWithProvider } from '@/types/database'

export default async function ServiceDetail({ params }: { params: { id: string } }) {
    const service: ServiceWithProvider = await getServiceById(params.id);
    console.log(service);
    

  return (
    <main className="max-w-5xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-2xl shadow-lg">
      {/* Imagen principal */}
      <div className="relative h-96 rounded-xl overflow-hidden shadow">
        <Image
          src={service.main_image || '/placeholder-service.jpg'}
          alt={service.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Información del servicio */}
      <div className="flex flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{service.title}</h1>
          <span className="text-2xl text-green-600 font-semibold mb-4 block">
            Desde ${service.min_price}
          </span>
          <p className="text-gray-700 mb-6">{service.description}</p>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Acerca del perfil</h2>
            <p className="text-gray-600">{service.provider?.raw_user_meta_data?.bio || 'Sin descripción.'}</p>
          </div>
          <div className="flex items-center gap-2 mb-6">
            {/* Estrellas */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(service.rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </div>
            <span className="text-gray-700 font-medium">{service.rating || '0.0'}</span>
            <span className="text-gray-500 text-sm">{service.reviews || 0} valoraciones</span>
          </div>
          <button className="bg-green-400 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-green-500 transition">
            Enviar mensaje
            <svg width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.757-.867-2.028-.967-.271-.099-.469-.148-.667.15-.198.297-.767.967-.94 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.075-.149-.667-1.611-.915-2.206-.242-.579-.487-.5-.667-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.879 1.213 3.079.149.198 2.099 3.205 5.077 4.367.71.244 1.263.389 1.694.497.712.181 1.36.156 1.872.095.571-.067 1.757-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          </button>
        </div>
        {/* Perfil del proveedor */}
        <div className="flex flex-col items-center mt-8">
          <Image
            src={service.provider?.raw_user_meta_data?.avatar_url || '/default-avatar.png'}
            alt={service.provider?.email}
            width={80}
            height={80}
            className="rounded-full mb-2 object-cover"
          />
          <span className="text-sm text-gray-600">Miembro desde</span>
          <span className="font-bold text-lg">
            {service.provider?.created_at
              ? new Date(service.provider.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Fecha desconocida'}
          </span>
        </div>
      </div>
    </main>
  )
}