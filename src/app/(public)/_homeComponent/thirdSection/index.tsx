'use client';

import Image from 'next/image';
import React, { useRef, useState, useEffect } from 'react';

const tabData = [
  {
    title: '',
    description: 'Customizable Settings',
    detail:
      'Avkash allows you to fit your company’s unique leave policies be it casual leaves, location status, half day - anything and everything, ensuring a seamless fit with your organisational needs.',
    imgSrc: '/feature-2.jpg',
  },
  {
    title: '',
    description: 'User-Friendly Interface',
    detail:
      'Say goodbye to separate apps for applying leave, Avkash integrates easily with your company’s choice of channel be it Google Workspace or Slack, allowing for a smooth and efficient leave management experience for team members and the founder',
    imgSrc: '/feature-1.jpg',
  },
  {
    title: '',
    description: 'Automated Tracking and Reporting',
    detail:
      'Avkash tracks leave balances and keeps your records accurate and up-to-date. This feature helps founders with or without HR support, to maintain compliance and avoid manual errors. You get to focus on what matters.',
    imgSrc: '/feature-3.jpg',
  },
];

export const ThirdSection = () => {
  const containerRef: any = useRef(null);
  // eslint-disable-next-line
  const screenRefs: any = tabData.map(() => useRef(null));
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  const scrollToTab = () => {
    if (containerRef.current && screenRefs[activeTab].current) {
      const { offsetLeft } = screenRefs[activeTab].current;
      const childWidth = screenRefs[activeTab].current.offsetWidth;
      containerRef.current.scrollTo({
        left: offsetLeft - childWidth / 2,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToTab();
  }, [activeTab]);

  return (
    <div className="md:max-w-6xl mx-auto px-3">
      <p className="text-2xl text-left">
        Avkash is designed for founders who run new-age remote teams to embody
        the spirit of work-life flow in their culture.
      </p>
      <div className="flex md:flex-row flex-col justify-center lg:mt-4 mb-6 gap-4">
        {tabData.map((tab, index) => (
          <div key={index}>
            <div
              onClick={() => handleTabClick(index)}
              className={`cursor-pointer flex flex-col justify-center items-start gap-4 tracking-wide ${
                index === activeTab
                  ? 'sm:border sm:border-slate-100 sm:p-2 sm:shadow-lg sm:ring-1 sm:ring-slate-100 sm:rounded-xl'
                  : 'sm:p-2 sm:border sm:border-transparent'
              }`}
            >
              <p className="text-blue-500">{tab.title}</p>
              <h1 className="text-lg text-black">{tab.description}</h1>
              <p className="text-sm text-gray-800">{tab.detail}</p>
            </div>
            <div
              key={index}
              ref={screenRefs[index]}
              className="md:hidden min-w-[70%] snap-center p-6"
            >
              <Image
                src={tab.imgSrc}
                alt={`screen ${index}`}
                height={1024}
                width={768}
                className="w-full rounded-md"
              />
            </div>
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        className="w-full hidden md:flex overflow-x-auto scroll-smooth snap-x no-scrollbar p-6 bg-gray-300 gap-6 rounded-xl"
      >
        {tabData.map((tab, index) => (
          <div
            key={index}
            ref={screenRefs[index]}
            className="min-w-[70%] snap-center"
          >
            <Image
              src={tab.imgSrc}
              alt={`screen ${index}`}
              height={1024}
              width={768}
              className="w-full rounded-md"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
