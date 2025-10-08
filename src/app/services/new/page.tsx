import ServiceForm from '@/components/services/ServiceForm';
export const metadata = {
  title: 'Crear Nuevo Servicio - EveryWork',
  description: 'Crea un nuevo servicio para ofrecer en la plataforma',
};

export default async function NewServicePage() {
  // console.log('=== SERVICES/NEW PAGE COMPONENT RENDERING ===');


  return (
    <main className=" mx-auto ">
      <div className=" mx-auto">
        <ServiceForm />
      </div>
    </main>
  );
}
