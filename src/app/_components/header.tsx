import Link from "next/link";

export default function Header({
  rightMenu,
}: Readonly<{
  rightMenu: React.ReactNode;
}>) {
  return (
    <header className="h-16 flex justify-between items-center bg-white border-r-emerald-500 p-4 border-y">
      <Link href="/">
        <h1 className="text-red-500 text-lg">Avkash</h1>
      </Link>
      {rightMenu}
    </header>
  );
}
