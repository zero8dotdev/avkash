"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

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

    // Step 1: Check if that org with same name is alreay created?
    // Then creation step as it is
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

      localStorage.setItem("orgId", orgData[0].orgId);

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
        localStorage.setItem("teamId", teamData[0].teamId);
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
        if (userData) {
          localStorage.setItem("userId", userData[0].userId);
          const { data, error } = await supabase
            .from("Team")
            .update({ manager: userData[0].userId })
            .eq("teamId", userData[0].teamId);
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
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
    </div>
  );
}
