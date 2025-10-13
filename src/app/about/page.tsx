import { Mail, MapPin, Users, TrendingUp, Heart, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center pb-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Sobre Goeverywork
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
              Conectando talentos locales inicialmente con la comunidad de Cali, Colombia
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Target className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-6">
              Nuestra Misión
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed text-center mb-6">
              En <span className="font-semibold text-blue-600">Goeverywork</span>, creemos que cada negocio local y emprendedor merece ser visto y reconocido por su comunidad. Nuestra plataforma está diseñada para dar visibilidad a los talentos locales de Cali y conectarlos directamente con las personas que necesitan sus servicios.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed text-center">
              Utilizamos tecnología de geolocalización para que los usuarios encuentren fácilmente servicios cerca de ellos, mientras ayudamos a los emprendedores a destacar y hacer crecer sus negocios.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-3">
                Visibilidad Local
              </h3>
              <p className="text-gray-600 text-center">
                Conectamos negocios con su comunidad local usando mapas interactivos y búsqueda por ubicación.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-3">
                Comunidad Activa
              </h3>
              <p className="text-gray-600 text-center">
                Fomentamos la conexión entre emprendedores y clientes locales en Cali.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-3">
                Crecimiento
              </h3>
              <p className="text-gray-600 text-center">
                Ayudamos a negocios locales a crecer y alcanzar más clientes potenciales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-12">
              ¿Qué Ofrecemos?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">
                  Para Emprendedores
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Perfil de negocio visible en el mapa de Cali</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Galería de imágenes para mostrar tus productos/servicios</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Sistema de reseñas para construir reputación</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Información de contacto directo con clientes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Exposición en búsquedas locales</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-purple-600 mb-4">
                  Para Clientes
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>Búsqueda fácil de servicios por ubicación</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>Mapa interactivo con servicios cercanos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>Reseñas y calificaciones verificadas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>Comparación de precios y servicios</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>Contacto directo con proveedores locales</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-pink-100 p-4 rounded-full">
                <Heart className="w-12 h-12 text-pink-600" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-6">
              Nuestra Historia
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Goeverywork nació de la necesidad de crear un puente entre los talentosos emprendedores de Cali y la comunidad que necesita sus servicios. Observamos que muchos negocios locales y profesionales independientes tienen habilidades excepcionales, pero luchan por darse a conocer en un mercado cada vez más digital.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Decidimos crear una plataforma que no solo liste servicios, sino que utilice la geolocalización para hacer que los negocios locales sean verdaderamente accesibles. Cada emprendedor merece la oportunidad de mostrar su trabajo, y cada cliente merece encontrar fácilmente los mejores servicios cerca de ellos.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Hoy, Goeverywork es más que una plataforma: es una comunidad que apoya el crecimiento económico local y celebra el talento de Cali, Valle del Cauca.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Tienes Preguntas?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Estamos aquí para ayudarte a crecer tu negocio o encontrar el servicio que necesitas.
            </p>
            <a
              href="mailto:everywork.app@gmail.com"
              className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Mail className="w-6 h-6" />
              everywork.app@gmail.com
            </a>
            <p className="mt-6 text-blue-100">
              Ubicados en Cali, Valle del Cauca, Colombia 🇨🇴
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}