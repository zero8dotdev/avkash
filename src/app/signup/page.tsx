"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { useRouter } from "next/navigation";

const supabaseUrl = "https://cmdxjdjcazwuevappeku.supabase.co";
const supabaseKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZHhqZGpjYXp3dWV2YXBwZWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMxMTM1NzcsImV4cCI6MjAyODY4OTU3N30.8mRmHq3JPiyRoF58dFnf-M4QkaTj8T_5Vk23PUFeoeA";

const supabase = createClient(supabaseUrl, supabaseKey);

export default function SignUp() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    team: "",
    email: "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    

    try {
      const { data: orgData, error: orgError } = await supabase
        .from("Organisation")
        .insert([
          {
            name: formData.company,
            
          },
        ])
        .select();

      if (orgError) {
        throw orgError;
      }
      
      localStorage.setItem("orgId",orgData[0].orgId)

      


    
      const { data: teamData, error: teamError } = await supabase
        .from("Team")
        .insert([
          {
            name: formData.team,
            orgId: orgData[0].orgId,
          },
        ])
        .select();
       
      if (teamData) {
        
        localStorage.setItem("teamId",teamData[0].teamId)
        const { data: userData, error: userError } = await supabase
          .from("User")
          .insert([
            {
              name: formData.name,
              email: formData.email,
              teamId: teamData[0].teamId,
              isManager: true,
              accruedLeave: 0,
              usedLeave: 0,
            },
          ])
          .select();
          if (userData){
            localStorage.setItem("userId",userData[0].userId)
          const { data, error } = await supabase
          
          .from("Team")
          .update({ manager: userData[0].userId})
          .eq("teamId", userData[0].teamId)
          .select();
          }
      }
      

     
      setFormData({
        name: "",
        company: "",
        team: "",
        email: "",
      });
      router.push("/welcome");
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <div className="min-h-screen  flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-xl font-bold mb-4">Avkash</h1>

      <form className="flex flex-col" onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          required
          type="text"
          name="name"
          placeholder="Name"
          id="name"
          className="mt-2 mb-3 p-2"
          value={formData.name}
          onChange={handleChange}
        />

        <label htmlFor="company-name">Company Name</label>
        <input
          required
          className="mt-2 mb-3 p-2"
          placeholder="Company Name"
          id="company-name"
          name="company"
          value={formData.company}
          onChange={handleChange}
        />
        <label htmlFor="team">Team Name</label>
        <input
          required
          type="text"
          name="team"
          placeholder="Team name"
          id="team"
          className="mt-2 mb-3 p-2"
          value={formData.team}
          onChange={handleChange}
        />

        <label htmlFor="email">Working Email</label>
        <input
          required
          type="email"
          name="email"
          placeholder="Email"
          id="email"
          className="mt-2 mb-3 p-2"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="submit"
          value="Singup"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md w-full"
        />
      </form>

      {/* <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Sign-Up for Avkash</h2>
        <div className=" bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Caution:</p>
          <p>Is your organization using slack? Caution content goes here</p>
        </div>
        <form>
          <div className="mb-4">
            <label htmlFor="firstName" className="block mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="lastName" className="block mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="companyName" className="block mb-1">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1">
              Work Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md w-full"
          >
            Sign Up
          </button>
        </form>
        <p>
          Already an account <span className="text-blue-500">Sign-In</span>
        </p>
      </div> */}
    </div>
  );
}
