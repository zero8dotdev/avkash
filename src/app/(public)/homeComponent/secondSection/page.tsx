"use client";
import React, { useState } from "react";
import Image from "next/image";

interface TabItem {
  label: string;
  description: string;
  imageUrl: string;
  //   imageUrl: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: number;
  onTabClick: (index: number) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => (
  <div className="w-full min-h-[500px] flex flex-col gap-0">
    <div className="w-full md:w-1/2 flex md:flex-col flex-row justify-center items-end gap-4 text-gray-100 tracking-wider">
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`w-full md:w-[60%] md:py-4 md:px-6 p-3 font-semibold cursor-pointer flex md:flex-col flex-row md:gap-4
                        hover:bg-gray-300 hover:border-gray-200 hover:border-opacity-10 hover:bg-opacity-5 hover:rounded-l-lg hover:border-x hover:border-y hover:border-r-0
          ${
            index === activeTab
              ? "bg-gray-200 border-gray-200 border-opacity-10 bg-opacity-10 rounded-l-lg border-x border-y border-r-0"
              : ""
          }}`}
          onClick={() => onTabClick(index)}
        >
          <h1 className="text-gray-100 text-[0.8rem]">{tab.label}</h1>
          <p className="text-md font-light md:block hidden">
            {tab.description}
          </p>
        </div>
      ))}
    </div>
    <p className="text-md font-light md:hidden text-gray-100 text-center p-4">
      {tabs[activeTab].description}
    </p>
    <div className="w-full md:w-[50%] md:w-full">
      {tabs[activeTab] && (
        <div className="w-full h-full">
          <Image
            src={tabs[activeTab].imageUrl}
            alt="screen shot"
            className="h-full w-full object-cover"
            width={768}
            height={500}
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
      label: "Zero8.dev 1",
      description:
        "First: All of your receipts organized into one place, as long as you dont mind typing in the data by hand.",
      imageUrl: "/screen1.png",
    },
    {
      label: "Zero8.dev 2",
      description:
        "Second: All of your receipts organized into one place, as long as you dont mind typing in the data by hand.",
      imageUrl: "/screen2.png",
    },
    {
      label: "Zero8.dev 3",
      description:
        "Third: All of your receipts organized into one place, as long as you dont mind typing in the data by hand.",
      imageUrl: "/screen1.png",
    },
  ];

  return (
    <div className="w-full flex flex-col justify-center items-center my-24">
      <h1 className="mx-auto text-[2rem] text-white my-4 font-semibold text-center">
        Everything you need to run your books.
      </h1>
      <p className="mx-auto text-lg text-gray-300 my-4 text-center">
        Well everything you need if you aren’t that picky about minor details
        like tax compliance.
      </p>
      <div className="w-ful flex justify-end mt-12">
        <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
      </div>
    </div>
  );
};

export default SecondSection;
