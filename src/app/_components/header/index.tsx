'use client';

import Link from 'next/link';
import { Space } from 'antd';
import Image from 'next/image';
import Title from 'antd/es/typography/Title';
import { Header } from 'antd/es/layout/layout';
import { usePathname, useRouter } from 'next/navigation';
import LogoutButton from './_components/logout';
import MainMenu from './_components/main-menu';
import logo from '../../(public)/avkash-logo-new.png';

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#EAE7DC',
        borderBottom: '1px solid rgba(0, 0, 100, 0.17)',
        padding: '0px 24px',
      }}
    >
      <Link href="/" className="flex justify-center align-center">
        <Image
          src={logo}
          alt="avkash"
          height={45}
          width={45}
          style={{ objectFit: 'contain' }}
        />
        <Title
          className="hidden sm:block m-0 mt-2 leading-none"
          style={{
            marginBottom: '0px',
            fontWeight: 300,
            lineHeight: '30px',
            fontSize: 30,
          }}
        >
          avkash
        </Title>
      </Link>
      <MainMenu />
      {pathname === '/' && (
        <button
          onClick={() => router.push('/dashboard/timeline')}
          className="ml-auto mr-4 inline-flex align-items-end rounded-full py-2 px-4 text-sm  focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900"
        >
          Go to Dashboard
        </button>
      )}
      <Space>
        <LogoutButton />
      </Space>
    </Header>
  );
}
