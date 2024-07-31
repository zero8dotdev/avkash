'use client';
import React from 'react';

const faqItems = [
    {
        question: 'How to Request Leave with Avkash?',
        answer: 'Go the the Avkash bot click on the request leave button add the form details and hit submit your leave will be saved and sent it to the manager.',
    },
    {
        question: 'How to Contact Support?',
        answer: 'To contact support, send an email to support@avkash.io. Alternatively, fill out the contact form here.',
    },{
        question: 'Configuring Avkash - A Quick Start Guide?',
        answer: 'select a organization first and add your team member in it, add a necessary data In it.if you have any doubt contact us at support@zero8.dev ',
    },{
        question: 'What is Avkash ?',
        answer: 'Avkash is a slack app which manages the leaves and track leaves..',
    },{
        question: 'What Are The Different User Roles In Avkash?',
        answer: 'There are primary 3 roles in the avkash Owner, Manager and User',
    },{
        question: 'How to Send Notifications For Leave Changes Plus Daily and Weekly Summaries?',
        answer: 'After change in any leave in the Avkash the leave notification will get to users.',
    },
    {
        question: 'How To Add And Edit A Leave Policy Or Type.?',
        answer: 'Only owner and manager can edit the Leave Policy and Type. In the settings leave setting tab you can change the leave policy and leave type. ',
    },
];

const Faq: React.FC = () => {
    return (
        <div id='faq' className="w-full flex flex-col items-center my-24 ">
            <section className="bg-slate-50 py-20 sm:py-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h2 className="text-3xl tracking-tight text-slate-900 sm:text-4xl">
                            Frequently asked questions
                        </h2>
                        <p className="mt-4 text-lg tracking-tight text-slate-700">
                            If you can’t find what you’re looking for, email our support team and if you’re lucky someone will get back to you.
                        </p>
                    </div>
                    <ul className=" mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                        {faqItems.map((item, index) => (
                            <li key={index}>
                                <ul className="flex flex-col gap-y-8">
                                    <li>
                                        <h3 className=" text-lg leading-7 text-slate-900">{item.question}</h3>
                                        <p className="mt-4 text-sm text-slate-700">{item.answer}</p>
                                    </li>
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default Faq;
