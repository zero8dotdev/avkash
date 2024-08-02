import React from "react";
import PriceModel from "./priceModel";
// import check from  "/checkmark.svg"

const Pricing = () => {
  const plansList = [
    {
      price: 0,
      duration: "Free",
      businessType:
        "Good for anyone who is self-employed and just getting started.",
      benefits: ["Track leaves", "Track history", "Add custom leave policies"],
    },
    {
      price: 99,
      duration: "Per user / month",
      businessType:
        "Good for anyone who is self-employed and just getting started.",
      benefits: [
        "Track leaves",
        "Track history",
        "Add custom leave policies",
        "Track leaves",
        "Track history",
        "Add custom leave policies",
      ],
    },
    {
      price: 999,
      duration: "Yearly",
      businessType:
        "Good for anyone who is self-employed and just getting started.",
      benefits: ["Track leaves", "Track history", "Add custom leave policies"],
    },
  ];

  return (
    <div className="bg-slate-900">
      <div className="lg:max-w-7xl mx-auto  min-h-screen flex flex-col items-center pt-12">
        <h1 className="text-3xl md:text-4xl text-white font-semibold mb-8 tracking-tight">
          Ditch Starbucks for a day.
        </h1>
        <div className="flex flex-col lg:flex-row justify-between w-full ">
          {plansList.map((plan, index) => (
            <PriceModel key={index} index={index} {...plan} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
