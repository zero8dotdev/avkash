import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./_components/header";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Avkash | Make leave management easy for your teams",
  description: "Avkash allows team to manage holidays and leaves smooth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLoggedIn = false;
  const rightMenu = !isLoggedIn ? (
    <div>
      <Link href="/login">
        <button className="p-2 bg-sky-500 transition-colors hover:bg-sky-700 mr-2  text-white">
          Login
        </button>
      </Link>
      <Link
        href="/signup"
        className="p-2 bg-white transition-colors hover:bg-sky-100 border-2 border-sky-500"
      >
        Signup for free
      </Link>
    </div>
  ) : (
    <div>
      <Image
        src="https://lh3.google.com/u/0/ogw/AF2bZyh0K8u-8ihV-8IYLKSnRPhHx6FwrEjtXEtd4XTM=s32-c-mo"
        height={48}
        width={48}
        alt="Ashutosh Tripathi"
      />
    </div>
  );
  return (
    <html lang="en">
      <body className={`${inter.className} text-black`}>
        <Header rightMenu={rightMenu} />
        <main className="min-h-dvh bg-gray-100">{children}</main>
      </body>
    </html>
  );
}
