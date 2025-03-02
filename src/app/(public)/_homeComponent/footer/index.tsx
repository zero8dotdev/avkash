'use client';

import React, { useState } from 'react';
import ContactUs from '../contactUs';

const FooterSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <footer className="bg-white rounded-lg shadow m-4 mx-auto max-w-7xl flex flex-row justify-center lg:justify-between text-center">
        <div className="w-full p-4 lg:flex lg:items-center lg:justify-between border-solid">
          <span className="text-sm text-gray-800 sm:text-center dark:text-gray-400">
            © 2024{' '}
            <a href="/" className="hover:underline">
              avkash
            </a>
            . All Rights Reserved.
          </span>
          <ul className="flex flex-wrap justify-center items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
            <li>
              <a href="#" className="hover:underline me-4">
                About
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:underline me-4">
                Privacy Policy
              </a>
            </li>
            <li>
              <a onClick={openModal} className="hover:underline me-4">
                Contact
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:underline me-4">
                T & C
              </a>
            </li>
          </ul>
        </div>
      </footer>

      {isModalOpen && (
        <ContactUs isOpen={isModalOpen} closeModal={closeModal} />
      )}
    </>
  );
};

export default FooterSection;
