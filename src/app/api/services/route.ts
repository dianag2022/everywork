import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Simulación de base de datos temporal
let services: any[] = [];

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const data = await request.json();
    
    // Validación básica
    if (!data.title || !data.description || data.price === undefined || !data.category) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Crear nuevo servicio
    const newService = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      userId: session.user?.id,
    };
    
    // En una aplicación real, aquí guardarías en la base de datos
    services.push(newService);
    
    return NextResponse.json(newService, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear el servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // En una aplicación real, esto vendría de la base de datos
  return NextResponse.json(services);
}
