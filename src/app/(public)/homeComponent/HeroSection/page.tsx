import Link from 'next/link'
import React from 'react'

 const HeroSection = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-20 text-center lg:pt-32 h-screen">
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-7xl font-firaSans ">
          Leave <span className="relative whitespace-nowrap text-blue-600">
            <span className="relative">made simple</span>
          </span> for small businesses.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
          Most HRMS software is accurate, but hard to use. We make the opposite trade-off, and hope you don’t get audited.
        </p>
        <div className="mt-10 flex justify-center gap-x-6">
          <Link href="#" className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900">
            Let's Get Started
          </Link>
          <Link href="#" className="group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-none ring-slate-200 text-slate-700 hover:text-slate-900 hover:ring-slate-300 active:bg-slate-100 active:text-slate-600 focus-visible:outline-blue-600 focus-visible:ring-slate-300">
            <svg aria-hidden="true" className="h-3 w-3 flex-none fill-blue-600 group-active:fill-current">
              <path d="m9.997 6.91-7.583 3.447A1 1 0 0 1 1 9.447V2.553a1 1 0 0 1 1.414-.91L9.997 5.09c.782.355.782 1.465 0 1.82Z"></path>
            </svg>
            <span className="ml-3">Watch video</span>
          </Link>
        </div>

      </div>
  )
}
export default HeroSection