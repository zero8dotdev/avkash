'use client'
import React, { useState } from 'react';
import Image from 'next/image'

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
    <div className="flex max-w-[80%] gap-0">
        <div className="flex flex-col justify-center gap-4 text-gray-100  tracking-wider">
            {tabs.map((tab, index) => (
                <div
                    key={index}
                    className={`py-4 px-6 font-semibold cursor-pointer flex flex-col gap-4 
                        hover:bg-gray-300 hover:border-gray-200 hover:border-opacity-10 hover:bg-opacity-5 hover:rounded-l-lg hover:border-x hover:border-y hover:border-r-0
          ${index === activeTab ? 'bg-gray-200 border-gray-200 border-opacity-10 bg-opacity-10 rounded-l-lg border-x border-y border-r-0' : ''}}`}
                    onClick={() => onTabClick(index)}
                >
                    <h1 className='text-gray-100 font-semibold text-lg'>{tab.label}</h1>
                    <p className='text-md font-light'>{tab.description}</p>
                </div>
            ))}
        </div>
        <div className="w-full">
            {tabs[activeTab] && (
                <div className='w-full'>
                    <img src={tabs[activeTab].imageUrl} alt="screen shot" className='w-full'/>
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
            description: 'All of your receipts organized into one place, as long as you dont mind typing in the data by hand.',
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
        <div className='w-full flex flex-col my-24'>
            <h1 className=' mx-auto text-5xl text-white my-4 font-semibold'>Everything you need to run your books.</h1>
            <p className=' mx-auto text-lg text-gray-300 my-4'>Well everything you need if you aren’t that picky about minor details like tax compliance.</p>
            <div className='w-ful flex justify-end mt-12'>
                <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
            </div>
        </div>
    );
};

export default SecondSection;


// import React, { useState } from 'react';
// import type { RadioChangeEvent } from 'antd';
// import { Radio, Space, Tabs } from 'antd';

// type TabPosition = 'left' | 'right' | 'top' | 'bottom';

// const SecondSection: React.FC = () => {
//     const [tabPosition, setTabPosition] = useState<TabPosition>('left');

//     const changeTabPosition = (e: RadioChangeEvent) => {
//         setTabPosition(e.target.value);
//     };


//     return (
//         <>
//             <Tabs
//                 tabPosition='left'
//                 items={new Array(3).fill(null).map((_, i) => {
//                     const id = String(i + 1);
//                     return {
//                         label: `Tab ${id}`,
//                         key: id,
//                         children: <Test contentNumber ={id}/>,
//                     };
//                 })}
//             />
//         </>
//     );
// };

// function Test({contentNumber: any}){
//     return (
//         <div>
//             <h1>gnani {contentNumber}</h1>
//         </div>
//     )
// }

// export default SecondSection;
