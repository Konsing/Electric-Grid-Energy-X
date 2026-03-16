'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      setAuth(res.data.token, res.data.user);
      const isStaff = res.data.user.role === 'ADMIN' || res.data.user.role === 'TECHNICIAN';
      router.push(isStaff ? '/outages' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);

    try {
      const res = await login(demoEmail, 'password-123');
      setAuth(res.data.token, res.data.user);
      const isStaff = res.data.user.role === 'ADMIN' || res.data.user.role === 'TECHNICIAN';
      router.push(isStaff ? '/outages' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left half — background image */}
      <div className="hidden md:flex md:w-1/2 relative">
        <Image
          src="/background.png"
          alt="Electric Grid"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <div className="absolute bottom-10 left-10 z-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">EGX</h1>
          <p className="text-sm text-zinc-400 mt-1">Electric Grid Energy X</p>
        </div>
      </div>

      {/* Right half — login form */}
      <div className="w-full md:w-1/2 bg-zinc-950 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-sm w-full mx-auto">
          <div className="md:hidden mb-8">
            <h1 className="text-3xl font-extrabold text-blue-500 tracking-tight">EGX</h1>
            <p className="text-sm text-zinc-500 mt-1">Electric Grid Energy X</p>
          </div>

          <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">Sign in</h2>
          <p className="text-sm text-zinc-500 mt-1">Enter your credentials</p>

          {error && (
            <div className="mt-4 bg-red-950 text-red-400 border border-red-900 p-3 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-zinc-50 text-zinc-950 rounded-md hover:bg-zinc-200 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-600">
              Register
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-6 border border-zinc-800 rounded-lg p-4">
            <p className="text-sm font-medium text-zinc-400 mb-3">Demo Accounts</p>
            <div className="flex gap-2">
              {[
                { email: 'admin@egx.dev', label: 'Admin' },
                { email: 'tech@egx.dev', label: 'Tech' },
                { email: 'customer@egx.dev', label: 'Customer' },
              ].map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleDemoLogin(u.email)}
                  disabled={loading}
                  className="flex-1 py-1.5 px-3 text-xs font-medium rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
