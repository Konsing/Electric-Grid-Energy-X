'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        const isStaff = user.role === 'ADMIN' || user.role === 'TECHNICIAN';
        router.replace(isStaff ? '/outages' : '/dashboard');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-blue-500 tracking-tight">EGX</h1>
        <p className="mt-2 text-zinc-500">Loading...</p>
      </div>
    </div>
  );
}
