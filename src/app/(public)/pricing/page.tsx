import React from 'react';
import PriceModel from './priceModel';
// import check from  "/checkmark.svg"

const Pricing = () => {
  const plansList = [
    {
      price: 0,
      duration: 'Per user / month',
      businessType:
        'Good for anyone who is self-employed and just getting started.',
      benefits: [
        '1 Month Free',
        'Track leaves',
        'Unlimited leave policies',
        'Slack Integration',
        'Google Integration',
        'Upto 5 team members',
        'Calendar Integration',
        'Multiple team location',
        'Prorate user policy',
      ],
    },
    {
      price: 99,
      duration: 'Per user / month',
      businessType: 'As you team grows.',
      benefits: [
        'Pay-As-You-Go',
        'Track leaves',
        'Unlimited leave policies',
        'Slack Integration',
        'Google Integration',
        'Unlimited team members',
        'Calendar Integration',
        'Unlimited Team Location',
        'Prorate user policy',
        'Dedicated Support',
      ],
    },
    {
      price: 999,
      duration: 'Per user / year',
      businessType: 'Large Teams ready for yearly commitment.',
      benefits: [
        'Pay-As-You-Go',
        'Track leaves',
        'Unlimited leave policies',
        'Slack Integration',
        'Google Integration',
        'Unlimited team members',
        'Calendar Integration',
        'Unlimited Team Location',
        'Prorate user policy',
        'Dedicated Support',
      ],
    },
  ];

  return (
    <div className="bg-slate-900">
      <div className="lg:max-w-7xl mx-auto  min-h-screen flex flex-col items-center pt-12">
        <h1 className="text-3xl md:text-4xl text-white font-semibold mb-8 tracking-tight">
          Pricing
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
