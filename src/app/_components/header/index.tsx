import Link from "next/link";
import { Button, Space } from "antd";
import Image from "next/image";
import Title from "antd/es/typography/Title";
import LogoutButton from "./_components/logout";
import { Header } from "antd/es/layout/layout";
import MainMenu from "./_components/main-menu";
import logo from '../../(public)/avkash-only.png'
export default function AppHeader() {
  return (
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
      <Link href="/" className="flex justify-center align-center"> 
        <Image src={logo} alt="avkash" height={50} width={50}/>
        <Title className="hidden sm:block m-0 mt-2 leading-none" style={{marginBottom:'0px',fontWeight:300, lineHeight:'30px', fontSize:30}} >avkash</Title>
      </Link>
        <MainMenu />
        <Space>
          <LogoutButton />
        </Space>
      </Header>
  );
}
