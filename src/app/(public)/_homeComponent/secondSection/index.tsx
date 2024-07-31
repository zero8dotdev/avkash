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
    <div className="flex flex-col md:flex-row w-full gap-0 max-w-[80%]">
        <div className=" w-full md:w-1/2 flex md:flex-col justify-center gap-1 md:gap-4 text-gray-100  tracking-wider">
            {tabs.map((tab, index) => (
                <div
                    key={index}
                    className={`py-4 px-2 md:px-6 font-semibold cursor-pointer flex flex-col gap-4 
                        hover:bg-gray-300 hover:border-gray-200 hover:border-opacity-10 hover:bg-opacity-5 hover:rounded-l-lg hover:border-x hover:border-y hover:border-r-0
          ${index === activeTab ? 'bg-gray-200 border-gray-200 border-opacity-10 bg-opacity-10 rounded-l-lg rounded-r-lg md:rounded-r-none border-x border-y md:border-r-0' : ''}}`}
                    onClick={() => onTabClick(index)}
                >
                    <h1 className='text-gray-100 md:font-semibold text-lg'>{tab.label}</h1>
                    <p className='hidden md:block text-md font-light'>{tab.description}</p>
                </div>
            ))}
        </div>
        <p className='md:hidden text-lg text-gray-100 text-center my-4'>{tabs[activeTab].description}</p>
        <div className="flex-1 p-1 md:p-0 ">
            {tabs[activeTab] && (
                <div className='w-full'>
                    <Image src={tabs[activeTab].imageUrl} alt="screen shot" className='w-full rounded-lg' width={768} height={1000}/>
                </div>
            )}
        </div>
    </div>
);

const SecondSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<number>(0);

    const tabs: TabItem[] = [
        {
            label: 'Zero8.dev 1',
            description: 'first:All of your receipts organized into one place, as long as you dont mind typing in the data by hand.',
            imageUrl: "/screen1.png"
        },
        {
            label: 'Zero8.dev 2',
            description: 'All of your receipts organized into one place, as long as you dont mind typing in the data by hand.',
            imageUrl: "/screen2.png"
        },
        {
            label: 'Zero8.dev 3',
            description: 'All of your receipts organized into one place, as long as you dont mind typing in the data by hand.',
            imageUrl: "/screen1.png"
        },
    ];

    return (
        <div className='w-full flex flex-col my-24 p-1 '>
            <h1 className=' mx-auto text-lg md:text-5xl text-white my-4 font-semibold text-center'>Everything you need to run your books.</h1>
            <p className=' mx-auto text-md md:text-lg text-gray-300 my-2 md:my-4 text-center'>Well everything you need if you aren’t that picky about minor details like tax compliance.</p>
            <div className='w-ful flex justify-end mt-12'>
                <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
            </div>
        </div>
    );
};

export default SecondSection;
