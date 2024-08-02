import Image from "next/image";

export default function Team() {
  return (
    <div className="p-12 m-auto">
      <h2 className="text-3xl tracking-tight text-slate-900 sm:text-4xl mb-3">
        Team
      </h2>
      <div className="flex flex-col sm:flex-row item-center justify-between min-h-[100px]">
        <p className="text-xl text-gray-500">
          We are a remote team building products from India. We inspire to build
          elegant web experiences.
        </p>
        <div className="pr-10">
          <Image
            alt="Team Picture"
            src="/screen6.png"
            height="400"
            width="400"
          />
        </div>
      </div>
    </div>
  );
}
