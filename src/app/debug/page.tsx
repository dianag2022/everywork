import { getCurrentUser } from '@/auth';

export default async function DebugPage() {
  const user = await getCurrentUser();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Authentication</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">User Status:</h2>
        <pre className="text-sm">
          {user ? JSON.stringify(user, null, 2) : 'No user found'}
        </pre>
      </div>
      
      <div className="mt-4 bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <div className="text-sm">
          <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
          <p>SUPABASE_SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}
