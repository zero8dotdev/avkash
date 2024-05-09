"use client"
import { useRouter } from "next/navigation";


export default function Welcome(){
    const router = useRouter();
    return (
        <div className="flex justify-center flex-col h-screen items-center">
           <h1 className="font-bold text-xl">Well come to Avkash</h1>
           <p>Thank you for choosing avkash for leave tracker lets click on start button to continue</p>
           <button className="bg-blue-500 p-2 w-48 text-white m-3 rounded-lg" onClick={()=>router.push("initialSetup")}>Start</button>
        </div>
    )


}