import Link from "next/link";
import { Button, Space } from "antd";
import Title from "antd/es/typography/Title";
import LogoutButton from "./_components/logout";
import { Header } from "antd/es/layout/layout";
import MainMenu from "./_components/main-menu";
import Image from "next/image";

export default function AppHeader() {
  return (
      <Header
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
        className=""
      >
        <Link href="/">
          <Title level={3} style={{ marginTop: "0px", marginBottom: "0px" }}>
            avkash
          </Title>
        </Link>
        <MainMenu />
        <div className="flex flex-1 items-center mx-10 font-semibold" >
          <ul className="flex gap-x-10">
            <li>
              <Link href="/#faq" className="scroll-smooth">FAQ</Link></li>
            <li><Link href='/#priceSection' className="tracking-wider">Pricing</Link></li>
          </ul>
        </div>
        <Space>
          <Link href="/login">
            <Button type="primary">Sign up</Button>
          </Link>
          <LogoutButton />
        </Space>
      </Header>

  );
}
