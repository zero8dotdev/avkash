import thunder from "../../../../public/thunder.svg";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import Select from "react-select";
import countryList from "react-select-country-list";

const LocationSettings = () => {
  const [selectedCountry, setSelectedCountry] = useState(null); 
  const options = useMemo(() => countryList().getData(), []);
  const changeHandler = (value: any) => {
    setSelectedCountry(value); 
  };

  return (
    <div className="text-gray-700 flex flex-col justify-start items-start border-x border-y border-gray-400 p-4 rounded-md">
      <div className="flex flex-col items-start gap-4">
        <h1 className="font-bold text-black text-2xl">Locations</h1>
        <div className="inline-flex">
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l">
            Acitve
          </button>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r">
            InActive
          </button>
        </div>

        <Select options={options} value={selectedCountry} onChange={changeHandler} />

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-md">
          Add new location
        </button>
      </div>
      <button className="text-white bg-red-500 self-end p-1 rounded-lg">
        Save
      </button>
    </div>
  );
};

export default LocationSettings;
