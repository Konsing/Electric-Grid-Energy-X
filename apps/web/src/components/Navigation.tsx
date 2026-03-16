'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

const customerItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/billing', label: 'Billing' },
  { href: '/notifications', label: 'Notifications' },
];

const commonItems = [
  { href: '/outages', label: 'Outages' },
  { href: '/account', label: 'Account' },
];

const adminItems = [
  { href: '/admin/outages', label: 'Manage Outages' },
  { href: '/admin/meters', label: 'Manage Meters' },
];

const adminOnlyItems = [
  { href: '/admin/accounts', label: 'Manage Accounts' },
];

export function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isTechnician = user.role === 'TECHNICIAN';
  const isCustomer = !isAdmin && !isTechnician;
  const showAdminItems = isAdmin || isTechnician;

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-extrabold text-blue-500">EGX</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
              {isCustomer &&
                customerItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.href
                        ? 'bg-zinc-800 text-zinc-50'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              {commonItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-zinc-800 text-zinc-50'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {showAdminItems &&
                adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.href
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'text-yellow-400 hover:text-yellow-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              {isAdmin &&
                adminOnlyItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.href
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'text-yellow-400 hover:text-yellow-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-zinc-400">
              {user.account?.firstName} {user.account?.lastName}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200">
              {user.role}
            </span>
            <button
              onClick={logout}
              className="text-sm text-zinc-500 hover:text-zinc-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
