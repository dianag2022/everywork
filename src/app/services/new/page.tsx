import ServiceForm from '@/components/services/ServiceForm';
export const metadata = {
  title: 'Crear Nuevo Servicio - EveryWork',
  description: 'Crea un nuevo servicio para ofrecer en la plataforma',
};

export default async function NewServicePage() {
  console.log('=== SERVICES/NEW PAGE COMPONENT RENDERING ===');


  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Publicar un Nuevo Servicio</h1>
        <ServiceForm />
      </div>
    </main>
  );
}
