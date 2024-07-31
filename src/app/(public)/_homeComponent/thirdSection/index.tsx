"use client";
import React, { useRef, useState, useEffect } from "react";

const tabData = [
  {
    title: "Reporting",
    description:
      "Stay on top of things with always up-to-date reporting features.",
    detail:
      "We talked about reporting in the section above but we needed three items here, so mentioning it one more time for posterity.",
    imgSrc: "/screen4.png",
  },
  {
    title: "Reporting",
    description:
      "Stay on top of things with always up-to-date reporting features.",
    detail:
      "We talked about reporting in the section above but we needed three items here, so mentioning it one more time for posterity.",
    imgSrc: "/screen5.png",
  },
  {
    title: "Reporting",
    description:
      "Stay on top of things with always up-to-date reporting features.",
    detail:
      "We talked about reporting in the section above but we needed three items here, so mentioning it one more time for posterity.",
    imgSrc: "/screen4.png",
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
      const offsetLeft = screenRefs[activeTab].current.offsetLeft;
      const childWidth = screenRefs[activeTab].current.offsetWidth;
      containerRef.current.scrollTo({
        left: offsetLeft - childWidth / 2,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToTab();
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-center mb-4 gap-4">
        {tabData.map((tab, index) => (
          <div
            key={index}
            onClick={() => handleTabClick(index)}
            className="cursor-pointer p-4 flex flex-col justify-center items-start gap-4 tracking-wide"
          >
            {/* <Image src='/avkashLogo.jpeg' alt='logo' height={50} width={50} className='w-6 h-6'/> */}
            <p className="text-blue-500">{tab.title}</p>
            <h1 className="text-lg text-black">{tab.description}</h1>
            <p className="text-sm text-gray-800">{tab.detail}</p>
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        className="w-full flex overflow-x-auto scroll-smooth snap-x no-scrollbar p-12 bg-gray-300 gap-10 rounded-xl"
      >
        {tabData.map((tab, index) => (
          <div
            key={index}
            ref={screenRefs[index]}
            className="min-w-[70%] snap-center"
          >
            <img
              src={tab.imgSrc}
              alt={`screen ${index}`}
              className="w-full rounded-xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
