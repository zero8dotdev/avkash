import Link from 'next/link';
import { Space } from 'antd';
import Image from 'next/image';
import Title from 'antd/es/typography/Title';
import { Header } from 'antd/es/layout/layout';
import LogoutButton from './_components/logout';
import MainMenu from './_components/main-menu';
import logo from '../../(public)/avkash-logo-new.png';

export default function AppHeader() {
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
      <Space>
        <LogoutButton />
      </Space>
    </Header>
  );
}
