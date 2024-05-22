import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/app/_utils/supabase/server";

export default async function Header() {
  const supabase = createClient();
  const session = await supabase.auth.getSession();

  const rightMenu = !session ? (
    <div className="w-[300px] flex flex-row-reverse gap-1">
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
    <div className="w-[300px] flex flex-row-reverse gap-1">
      <Image
        src="https://lh3.google.com/u/0/ogw/AF2bZyh0K8u-8ihV-8IYLKSnRPhHx6FwrEjtXEtd4XTM=s32-c-mo"
        height={36}
        width={36}
        alt="Ashutosh Tripathi"
      />
      {/* <Link href="/logout">
        <button className="p-2 bg-white transition-colors hover:bg-sky-100 border-2 border-sky-500">
          Logout
        </button>
      </Link> */}
      <Link href="/signup">
        <button className="p-2 bg-white transition-colors hover:bg-sky-100 border-2 border-sky-500">
          Signup
        </button>
      </Link>
      <Link href="/login">
        <button className="p-2 bg-white transition-colors hover:bg-sky-100 border-2 border-sky-500">
          Login
        </button>
      </Link>
    </div>
  );

  return (
    <header className="h-16 flex justify-between items-center bg-white border-r-emerald-500 p-4 border-y">
      <Link href="/">
        <h1 className="text-red-500 text-lg">Avkash</h1>
      </Link>
      {rightMenu}
    </header>
  );
}
