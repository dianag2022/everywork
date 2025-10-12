import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Servicio no encontrado</h1>
        <p className="text-gray-600 mb-8">
          Lo sentimos, el servicio que buscas no está disponible.
        </p>
        <Link 
          href="/search" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Ver todos los servicios
        </Link>
      </div>
    </div>
  );
}