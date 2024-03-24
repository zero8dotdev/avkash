"use client";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const GeneralSettings = () => {
  const smalldesc = `This affects what users can see in the timeline and calendar feed. Set this to "Users can only see their own leave" if you don't want to share leave information within your teams.`;
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [timeFormat, setTimeFormat] = useState("12");

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleTimeFormatChange = (event: any) => {
    setTimeFormat(event.target.value);
  };

  return (
    <div className="text-gray-700 flex flex-col justify-start items-start border-x border-y border-gray-400 p-4 rounded-md">
      <div className="flex flex-col gap-10">
        <h1 className="font-bold text-black text-2xl">General</h1>
        <div className="flex gap-4">
          <p className=" w-[20%] " >Date Format</p>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            className="bg-transparent border-2 border-gray-500 w-32 rounded-md text-center outline-none"
          />
        </div>
        <div className="flex gap-4">
          <p className=" w-[20%] ">Time Format</p>

          <select
            name="TimeFormat"
            id="timeformat"
            onChange={handleTimeFormatChange}
            className="bg-transparent border-2 border-gray-500 w-auto rounded-md text-center outline-none"
          >
            <option value="12">12-hour</option>
            <option value="24">24-hour</option>
          </select>
        </div>
        <div className="flex gap-4">
          <p className=" w-[20%] ">Who can see?</p>

          <select
            name="TimeFormat"
            id="timeformat"
            onChange={handleTimeFormatChange}
            className="bg-transparent border-2 border-gray-500 rounded-md text-center w-auto px-2"
          >
            <option value="12">Users can see the organization leave</option>
            <option value="24">Users can not the organization leave</option>
          </select>
        </div>
        <small className="text-blue-600">
          This affects what users can see in the timeline and calendar feed. Set
          this to <b>&quot;Users can only see their own leave&quot;</b> if you
          don&apos;t want to share leave information within your teams.{" "}
          <a className="text-red-500" href="#">Learn more.</a>
        </small>

        <div className="flex gap-4">
          <p className=" w-[20%] ">Half days</p>
          <div>
            <label className="inline-flex items-center mb-5 cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" />
              <div className="relative w-9 h-5 bg-gray-200  dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"></span>
            </label>
          </div>
        </div>
        <small className="text-blue-600">
          Turn this on if you want to allow half day leave requests
          <a className="text-red-500" href="#"> Learn more.</a>
        </small>

      </div>
        <button className="text-white bg-red-500 self-end p-1 rounded-lg">Save</button>
    </div>
  );
};

export default GeneralSettings;
