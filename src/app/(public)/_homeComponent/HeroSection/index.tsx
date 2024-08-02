import Link from "next/link";
import React from "react";

const HeroSection = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16  text-center  h-screen flex flex-col justify-center items-center">
      <h1 className="mx-auto max-w-4xl text-3xl font-semibold tracking-tighter md:tracking-tight text-slate-900 md:text-5xl lg:text-7xl font-sans">
        Specify.&nbsp;
        <span className="text-blue-600">
          <span>Automate.&nbsp;</span>
        </span>
        Elevate&nbsp;
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
        <span className="text-blue-600">Avkash,&nbsp;</span>a leave management
        HR automation tool, integrates seamlessly with Slack and Google
        Workspace to streamline your leave management process.
      </p>
      <div className="mt-10 flex justify-center gap-x-6">
        <Link
          href="#"
          className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900">
          Add to Slack
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
