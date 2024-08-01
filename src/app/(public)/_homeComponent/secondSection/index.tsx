'use client'
import React, { useState } from 'react';
import Image from 'next/image'

interface TabItem {
  label: string;
  description: string;
  imageUrl: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: number;
  onTabClick: (index: number) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => (
  <div className="lg:grid lg:grid-cols-12 lg:justify-end w-full md:rounded-t-xl bg-white/10 ring-1 lg:ring-0 ring-white/10 ring-inset pb-6 lg:bg-transparent pt-4 md:pt-6 md:pb-0 md:rounded-b-lg">
    <div className="lg:col-span-5 xl:col-span-4 xl:col-start-2 mt-6 my-2 flex lg:flex-col  gap-x-6 md:gap-x-8 px-4 md:px-6 lg:px-0 py-4 justify-center md:justify-center items-center overflow-x-auto sm:overflow-visible text-[#2563ea] scrollbar-hide mx-auto lg:mx-0">
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`flex-shrink-0 lg:px-4 lg:py-2 lg:my-4
                      lg:hover:bg-gray-300 lg:hover:border-gray-200 lg:hover:border-opacity-10 lg:hover:bg-opacity-5 lg:hover:rounded-l-lg lg:hover:border-x lg:hover:border-y lg:hover:border-r-0
           ${index === activeTab ? ' lg:bg-white/10 lg:ring-1 lg:ring-white/10 lg:ring-inset lg:rounded-l-lg  lg:rounded-r-none lg:border-x lg:border-y lg:border-r-0' : ''}
           lg:hover:bg-white/10 lg:hover:ring-1 lg:hover:ring-white/10 lg:hover:ring-inset  lg:hover:rounded-l-lg  lg:hover:rounded-r-none lg:hover:border-x lg:hover:border-y lg:hover:border-r-0'`}
          onClick={() => onTabClick(index)}
        >
          <h1 className={` lg:hover:inline-block ${index === activeTab ? 'text-[#2563ea] bg-white lg:bg-transparent lg:text-white rounded-full px-4 ' : 'text-white px-4 rounded-full hover:bg-white/10'}  lg:font-semibold py-2 text-lg md:text-xl whitespace-nowrap`}>{tab.label}</h1>
          <p className='hidden lg:block text-md font-light text-white/90 lg:w-full xl:tracking-wide xl:leading-7'>{tab.description}</p>
        </div>
      ))}
    </div>
    <p className='block lg:hidden text-md md:text-lg lg:text-md font-light text-white/90 text-center tracking-normal px-2 md:px-4 mb-8'>{tabs[activeTab].description}</p>
    <div className="flex justify-center mt-4 w-full lg:col-span-7 overflow-hidden">
      {tabs[activeTab] && (
        <div className='w-[95%] h-[60vh] md:w-full md:h-[50vh] lg:w-[78rem] lg:h-[90vh]'>
          <img
            src={tabs[activeTab].imageUrl}
            alt="screen shot"
            className='rounded-lg h-full w-full'
          />
        </div>
      )}
    </div>
  </div>
);

const SecondSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabs: TabItem[] = [
    {
      label: "Specify",
      description:
        "Specify your policies. Create policies as per your requirements - location tags, different teams with managers, types of leave, public holiday, approval process, accrual policy, maximum time off, carry forward rules, labour law compliances -anything and everything. Avkash can be personalised to your organisational needs.",
      imageUrl: "/screen1.png",
    },
    {
      label: "Automate",
      description:
        "Set your policies in Avkash tool to set things in motion. Additionally, Avkash fetches public holidays for different location countries and calculate pro-rata settings for mid year joining of new team members.",
      imageUrl: "/screen2.png",
    },
    {
      label: "Elevate",
      description:
        "Experience improved productivity and output from your team without the load and stress of admin work and pain and frustration of manual tracking. Avkash embodies transparency in your team culture by making sure the team is on the same page with real-time updates.",
      imageUrl: "/screen1.png",
    },
  ];

  return (
    <div className='w-full flex flex-col my-24  '>
      <h1 className=' mx-auto text-3xl md:text-5xl lg:text-5xl text-white my-4 font-semibold text-left md:text-center px-2 tracking-tight'> Want to be a founder with bandwidth?</h1>
      <h2 className=' mx-auto text-lg md:text-xl text-gray-300 my-2 md:my-4 text-left md:text-center px-2 tracking-tight md:tracking-normal'>Say goodbye to the hassle and hello to efficiency!</h2>
      <div className='w-full pt-10 md:p-4 lg:pr-0'>
        <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
      </div>
    </div>
  );
};

export default SecondSection;
