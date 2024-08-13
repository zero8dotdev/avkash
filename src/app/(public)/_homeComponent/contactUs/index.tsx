"use client";

import { contactUs } from "@/app/_components/header/_components/actions";
import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface ContactProps {
  isOpen: boolean;
  closeModal: any;
}

const ContactModal: React.FC<ContactProps> = ({ isOpen, closeModal }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const [responseMessage, setResponseMessage] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setResponseMessage("");

    if (!recaptchaToken) {
      alert("Please complete the reCAPTCHA");
      return;
    }
    const result = await contactUs({ ...formData, recaptchaToken });
    if (result) {
      alert(`Your message has been submitted successfully!!!!
             we will get back to you soon`);
    }
    closeModal();
  };
  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className=" rounded-lg shadow-lg bg-gray-800 w-96">
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <h5 className="text-xl font-medium text-white">Contact Avkash</h5>
              <button
                onClick={closeModal}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 6l8 8M6 14L14 6"
                  />
                </svg>
              </button>
            </div>
            <form className="p-5" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="firstName"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="first name"
                  required
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="lastName"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="last name"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="abc@gmail.com"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="message"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Your message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Your message..."
                  required
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="mb-4">
                <ReCAPTCHA
                  sitekey="6Ld-hB0qAAAAANWw-YcI_ELoS7Dz8X5PUfIXGbj5"
                  onChange={handleRecaptchaChange}
                />
              </div>
              <button
                type="submit"
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              >
                Send message
              </button>
            </form>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Zero8 Dot Dev Pvt Ltd
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                CIN: U62011UT2024PTC016718
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                GST: 05AACCZ3291K1Z1
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Block 5 Floor 4, Mangluwala, Aradhana Greens Apartment
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dehradun City, PIN: 248001, Uttarakhand
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex">
                <a href="mailto:info@company.com" className="hover:underline">
                  support@avkash.io
                </a>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <a href="tel:+91-9621728267" className="hover:underline">
                  +91 9621728267
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactModal;
