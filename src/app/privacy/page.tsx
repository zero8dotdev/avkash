import { title } from 'process';
import React from 'react'

const Privacy = () => {

    const privacyPolicy = [
        {
            title: "Introduction",
            items: [
                "This privacy policy describes how Zero8.Dev collects, uses, and discloses your information in connection with your use of our Google Sheet add-on, Invoices and its integrated web app Invoices Web App"
            ]
        },
        {
            title: "Blog Comments",
            items: [
                "When visitors leave comments on the site, we collect the data shown in the comments form, as well as the visitor’s IP address and browser user agent string to help with spam detection.",
                "An anonymized string created from your email address (also called a hash) may be provided to the Gravatar service to see if you are using it. The Gravatar service privacy policy is available here. After approval of your comment, your profile picture is visible to the public in the context of your comment.",
            ]
        },
        {
            title: "Media",
            items: [
                "If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract any location data from images on the website"
            ]
        },
        {
            title: "Embedded content from other websites",
            items: [
                "Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website",
                "These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged in to that website.",
            ]
        },
        {
            title: "Data Security",
            items: [
                "We take reasonable measures to protect the information we collect from unauthorized access, disclosure, alteration, or destruction. However, no internet transmission or electronic storage is completely secure. We cannot guarantee the security of your information."
            ]
        },
        {
            title: "Data from Slack API",
            items: [
                "If you sign up for our web app (https://avkash.io) using Slack, and authorize us to access your Slack account, we read the following information and store it on our servers:",
                "Slack User IDs (User IDs of every user in your workspace)",
                "Slack Workspace ID",
                "User and Bot Tokens",
                "Channel IDs (Slack IDs of every channel in your workspace)",
                "User name, email, icon, and timezone of all users in your Slack Workspace, regardless if you invite them to Avkash or not",
            ]
        },
        {
            title: "Web Application Data",
            items: [
                "To facilitate the functionality of our software, we store any information users enter in our app, such as leave requests."
            ]
        },
        {
            title: "Where we store your data",
            items: [
                "We store web app data on Supabase. You can learn more about Supabase & Privacy here.",
                "Further, we may send some of your data, such as your email address, to the following services:",
                "RazorPay",
                "Supabase",
                "These services help facilitate billing, customer support, and product analytics."
            ]
        },
        {
            title: "How long we retain your data",
            items: [
                "If you sign up for an account in our app (https://avkash.io), we retain your data indefinitely. You can request account deletion at any time (see section below).",
                "If you leave a blog comment, the comment and its metadata are retained indefinitely. This is so we can recognize and approve any follow-up comments automatically instead of holding them in a moderation queue.",

            ]
        },
        {
            title: "What rights you have over your data",
            items: [
                "If you have an account on this site or have left comments, you can request that we erase any personal data we hold about you. This does not include any data we are obliged to keep for administrative, legal, or security purposes."
            ]
        }, {
            title: "How to request deletion of your data",
            items: [
                "To request to have your personal data deleted, send an email with your request to support[at]support@avkash.io. For the quickest response, please include in the subject line “Data Deletion Request”."
            ]
        }
    ];
    return (
        <div className='bg-white '>
            <main className="flex min-h-screen flex-col items-start justify-between py-24 text-gray-800w-full  lg:max-w-[50%] mx-auto px-6 ">
                <h1 className='font-semibold text-2xl md:text-4xl self-center mb-6'>Privacy Policy Of Avkash</h1>
                <div className='space-y-3 mb-4'>
                    <h2 className='text-2xl font-bold my-2'>Who we are</h2>
                    <p className='text-xl'>
                        <span className='font-bold my-2'>Our website address is:</span><span className='cursor-pointer hover:underline hover:text-blue-500'> https://avkash.io</span><br />
                        <span className='font-bold my-2'>This website is operated by:</span> <span className='hover:underline hover:text-blue-500'>Zero8 Dot Dev Pvt. Ltd.</span><br />
                        <span className='my-2 text-[1rem]'>For any questions, please contact support at support@avkash.io</span>

                    </p>
                </div>
                <h2 className='font-semibold text-2xl mb-6 mt-2'>What personal data we collect and why we collect it </h2>
                {privacyPolicy.map((section, index) => (
                    <div key={index} className="mb-6">
                        <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
                        <ul className=" p-0">
                            {section.items.map((item, idx) => (
                                <li key={idx} className="mb-1 text-lg">{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </main>
        </div>

    )
}

export default Privacy