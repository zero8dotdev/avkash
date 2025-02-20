import Link from "next/link";
import React from "react";
import "../HeroSection/style.css";
const HeroSection = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16 text-center h-screen flex flex-col justify-center items-center">
      <div className="fade-in mx-auto max-w-4xl text-3xl font-semibold tracking-tighter md:tracking-tight text-slate-900 md:text-5xl lg:text-7xl font-sans">
        <span className="color-shift">Specify.&nbsp;</span>
        <span className="color-shift">Automate.&nbsp;</span>
        <span className="color-shift">Elevate&nbsp;</span>
      </div>
      {/* <h1 className="fade-in mx-auto max-w-4xl text-3xl font-semibold tracking-tighter md:tracking-tight text-slate-900 md:text-5xl lg:text-7xl font-sans">
        Specify.&nbsp;
        <span className="text-blue-600">
          <span>Automate.&nbsp;</span>
        </span>
        Elevate&nbsp;
      </h1> */}
      <p className="slide-up mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
        <span style={{ color: "#E85A4F" }}>Avkash,&nbsp;</span>a leave
        management HR automation tool, integrates seamlessly with Slack and
        Google Workspace to streamline your leave management process.
      </p>
      <div className="slide-up mt-10 flex flex-col gap-y-4 lg:flex-row lg:gap-y-0 justify-center gap-x-6">
        <Link
          href="/login"
          className=" group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900"
        >
          Add to Slack
        </Link>
        <a
          href="https://www.producthunt.com/posts/avkash-io?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-avkash&#0045;io"
          target="_blank"
        >
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=476219&theme=light"
            alt="avkash&#0046;io - Streamlines&#0032;Leave&#0032;Management&#0032;for&#0032;Modern&#0032;Remote&#0032;Teams | Product Hunt"
            className="lg:w-60 h-12 "
          />
        </a>
      </div>
    </div>
  );
};

export default HeroSection;
