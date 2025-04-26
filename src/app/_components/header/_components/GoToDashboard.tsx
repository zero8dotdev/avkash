'use client';

import { useApplicationContext } from '@/app/_context/appContext';
import { usePathname, useRouter } from 'next/navigation';
import router from 'next/router';

export default function GoToDashboard() {
  const { state } = useApplicationContext();
  const { user } = state;
  const pathname = usePathname();

  if (pathname !== '/' || !user) return null;

  return (
    <button
      onClick={() => router.push('/dashboard/timeline')}
      className="ml-auto mr-4 inline-flex align-items-end rounded-full py-2 px-4 text-sm  focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900"
    >
      Go to Dashboard
    </button>
  );
}
