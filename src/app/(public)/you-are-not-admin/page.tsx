import Image from 'next/image';

export default function AskForInvitation() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen p-6 md:p-12">
      <div className="ml-4 md:ml-16">
        <Image
          src="/ask-admin.svg"
          alt="ask invite"
          width={1000}
          height={1000}
          className="w-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
        />
      </div>

      {/* Text Section */}
      <div className="text-center md:ml-2 flex flex-col items-center md:items-start">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 tracking-wide">
          Oops! You are not the <span className="text-[#E85A4F]">Admin</span>
        </h1>
        <p className="mt-3 text-lg md:text-xl text-gray-600">
          Why not ask the admin to create an org here?
        </p>
        {/* Button to send email */}
        <a
          href="mailto:admin@example.com?subject=Request%20for%20Invitation"
          className="mt-3 inline-block bg-[#E85A4F] text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
        >
          Ping Boss !!
        </a>
      </div>
    </div>
  );
}
