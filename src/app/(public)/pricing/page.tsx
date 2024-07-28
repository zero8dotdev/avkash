import React from 'react';
import PriceModel from './priceModel';
// import check from  "/checkmark.svg"

const Pricing = () => {
    const plansList = [
        {
            price: 0,
            duration: "Free",
            businessType: "Good for anyone who is self-employed and just getting started.",
            benefits: ["Track leaves", 'Track history', 'Add custom leave policies']
        },
        {
            price: 99,
            duration: "Monthly",
            businessType: "Good for anyone who is self-employed and just getting started.",
            benefits: ["Track leaves", 'Track history', 'Add custom leave policies',"Track leaves", 'Track history', 'Add custom leave policies']
        },
        {
            price: 999,
            duration: "Yearly",
            businessType: "Good for anyone who is self-employed and just getting started.",
            benefits: ["Track leaves", 'Track history', 'Add custom leave policies']
        }
    ];

    return (
        <div className='bg-slate-900'>
            <div className='max-w-screen-xl mx-auto  min-h-screen flex flex-col items-center pt-12'>
                <h1 className='text-4xl text-white font-semibold mb-8'>Avkash Pricing</h1>
                <div className="flex flex-col lg:flex-row justify-between w-full ">
                    {plansList.map((plan, index) => (
                        <PriceModel
                            key={index}
                            index={index}
                            {...plan}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pricing;
