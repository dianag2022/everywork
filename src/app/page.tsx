import { ServicesList } from '@/components/services/ServicesList'
import SearchBar from '@/components/search/SearchBar';

export default function Home() {
  return (
    <main className="min-h-screen bg-main-black">
      {/* Hero Section */}
      <section className="bg-main-black text-white py-16">
        <div className="container text-center">
          <h2 className="heading mb-4">
            <span className="font-bold">Encuentra</span>{' '}
            <span className="text-main-green font-bold">Talentos</span>{' '}
            <span className="font-bold">para trabajar</span>
          </h2>
          <div className="flex justify-center items-center gap-2 mb-8">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Servicios recientes */}
      <section className="bg-white py-12">
        <div className="container">
          <h3 className="text-3xl font-bold mb-8 text-main-black">Servicios recientes</h3>
          <ServicesList />
        </div>
      </section>

      {/* Mostrar todos */}
      <section className="bg-main-purple py-12">
        <div className="container flex flex-col items-center justify-center">
          <span className="text-white text-2xl font-bold mb-2">Mostrar todos</span>
          <span className="text-white mb-4">3 servicios</span>
          <button className="show-all-btn">
            <svg width="48" height="48" fill="none"><circle cx="24" cy="24" r="22" stroke="white" strokeWidth="4"/><path d="M16 24h16m0 0l-6-6m6 6l-6 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-main-black py-8">
        <div className="container text-center">
          <p>&copy; 2025 EveryWork Marketplace. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  )
}
