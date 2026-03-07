import Link from 'next/link';
import React from 'react';

interface PriceModelProps {
  index: number;
  price: number;
  duration: string;
  businessType: string;
  benefits: string[];
  className?: string; // Optional className prop
}

const PriceModel: React.FC<PriceModelProps> = ({
  index,
  price,
  duration,
  businessType,
  benefits,
  className,
}) => {
  return (
    <div
      className={`m-5 leading-7 text-gray-300 flex flex-col gap-6 rounded-lg px-8 py-10 tracking-wider ${
        index === 1 ? 'bg-blue-600 text-gray-200' : ''
      } lg:w-1/3`}
    >
      <h1 className="text-3xl">{!price ? 'Free' : `₹${price}`}</h1>
      <p className="text-md font-semibold">{duration}</p>
      <p className="text-md leading-7">{businessType}</p>
      <Link
        href=""
        className={`${
          index === 1 ? 'bg-white text-black' : ''
        } my-4 w-full rounded-full border-x border-y p-2 border-gray-500 font-semibold text-center`}
      >
        Add to Slack
      </Link>
      <ul className="flex flex-col gap-4">
        {benefits.map((list, index) => (
          <li key={index} className="flex items-center gap-4 text-md">
            <img src="/checkmark.svg" alt="Your Name" className="h-6 w-6" />
            <p>{list}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PriceModel;
