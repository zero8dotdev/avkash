"use client";

import Link from "next/link";
import React from "react";

const faqItems = [
  {
    question: "Why should I use an automated leave management tool?",
    answer:
      "An automated leave management tool ensures accurate record-keeping, and enhances team coordination without extra hassle of manual tracking. It promotes transparency, boosts productivity, and empowers employees with self-service options.",
  },
  {
    question: "Who is Avkash for?",
    answer:
      "An automated leave management tool ensures accurate record-keeping, and enhances team coordination without extra hassle of manual tracking. It promotes transparency, boosts productivity, and empowers employees with self-service options.",
  },
  {
    question: "How does Avkash handle leave approvals?",
    answer:
      "Leave requests submitted through Avkash are routed to the designated approvers based on the configured approval workflow. Approvers can review, approve, or deny leave requests directly within Slack or Google Workspace, and real-time notifications keep everyone updated.",
  },
  {
    question: "How secure is my data with Avkash?",
    answer:
      "**Data security is a top priority for Avkash. We implement advanced security measures to protect your data. Please refer to our data and privacy policy for more details.**",
  },
  {
    question: "Can I try Avkash before committing to a subscription?",
    answer:
      "Yes, we offer a free trial so you can experience Avkash and see how it benefits your team. Sign up for 14 days free trial and start exploring Avkash’s features without any commitment.",
  },
];

const Faq: React.FC = () => {
  return (
    <div id="faq" className="w-full flex flex-col items-center my-20">
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl tracking-tight text-slate-900 sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <ul className=" mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {faqItems.map((item, index) => (
              <li key={index}>
                <ul className="flex flex-col gap-y-8">
                  <li>
                    <h3 className=" text-lg leading-7 text-slate-900">
                      {item.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-700">{item.answer}</p>
                  </li>
                </ul>
              </li>
            ))}
          </ul>
          {/* <p className="mt-12 text-lg tracking-tight text-slate-700">
            If you can&apos;t find what you&apos;re looking for, Read more{" "}
            <Link href="/faq">here</Link>
          </p> */}
        </div>
      </section>
    </div>
  );
};

export default Faq;
