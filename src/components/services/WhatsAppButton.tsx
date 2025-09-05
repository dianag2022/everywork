'use client'

interface WhatsAppButtonProps {
  phoneNumber: string | null
  serviceName: string
}

export default function WhatsAppButton({ phoneNumber, serviceName }: WhatsAppButtonProps) {
  if (!phoneNumber) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
        <p className="text-gray-500 text-sm">No hay número de contacto disponible</p>
      </div>
    )
  }

  const handleWhatsAppClick = () => {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
    
    // Create WhatsApp message
    const message = encodeURIComponent(
      `Hola! Estoy interesado/a en tu servicio "${serviceName}" que vi en EveryWork. ¿Podrías darme más información?`
    )
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank')
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M17.472 14.382c-.297-.149-1.757-.867-2.028-.967-.271-.099-.469-.148-.667.15-.198.297-.767.967-.94 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.075-.149-.667-1.611-.915-2.206-.242-.579-.487-.5-.667-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.879 1.213 3.079.149.198 2.099 3.205 5.077 4.367.71.244 1.263.389 1.694.497.712.181 1.36.156 1.872.095.571-.067 1.757-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" />
      </svg>
      Enviar mensaje por WhatsApp
    </button>
  )
}