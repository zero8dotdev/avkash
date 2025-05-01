'use client';

import { useApplicationContext } from '@/app/_context/appContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GoToDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useApplicationContext();
  const { user } = state;
  const pathname = usePathname();
  const router = useRouter();

  const shouldShowButton =
    (pathname === '/' && user) || pathname?.startsWith('/initialsetup'); // 'Go to Dashboard' button should be visible only on the initial setup pages or front page if user is already logged in

  if (!shouldShowButton) return null;

  const navigationHandler = () => {
    setIsLoading(true);
    router.push('/dashboard/timeline');
  };

  return (
    <button
      onClick={navigationHandler}
      className="ml-auto mr-4 inline-flex align-items-end rounded-full py-2 px-4 text-sm  focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900"
    >
      {isLoading ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
      ) : (
        'Go to Dashboard'
      )}
    </button>
  );
}
