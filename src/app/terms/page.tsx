import React from "react";

const Terms = () => {
  const terms = [
    {
      title: "DISCLAIMER",
      items: [
        "To the maximum extent permitted by applicable law, nothing in this document will:",
        "Limit or exclude your liability for misrepresentation of the information presented on the website;",
        "Limit any of your liabilities in any way that is not permitted under applicable law.",
        "The limitations and exclusions of liability set out in this section and elsewhere in this disclaimer:",
        "1. Are subject to the preceding paragraph;",
        "2. Will govern all liabilities arising under the disclaimer or in relation to the subject matter of this disclaimer.",
      ],
    },
    {
      title: "OVERVIEW",
      items: [
        "This website is owned and operated by Avkash. Throughout the site, the terms “we”, “us”, and “our” refer to Avkash. Avkash offers this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.",
        "By visiting our site and/or purchasing something from us, you engage in our “Service” and agree to be bound by the following terms and conditions (“Terms and Conditions”, “Terms”), including those additional terms and conditions and policies referenced herein and/or available by hyperlink. These Terms and Conditions apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.",
        "The present Terms and Conditions are to be viewed as a whole, together with our Privacy Policy document.",
        "Please read these Terms and Conditions carefully before accessing or using our website. By accessing or using any part of the site, you agree to be bound by these Terms and Conditions. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services. If these Terms and Conditions are considered an offer, acceptance is expressly limited to these Terms and Conditions.",
        "Any new features or tools which are added to the current store shall also be subject to the Terms and Conditions. You can review the most current version of the Terms and Conditions at any time on this page. We reserve the right to update, change or replace any part of these Terms and Conditions by posting updates and/or changes to our website. It is your responsibility to check this page periodically for changes. Your continued use of or access to the website following the posting of any changes constitutes acceptance of those changes.",
      ],
    },
    {
      title: "SECTION 1 – ONLINE STORE TERMS",
      items: [
        "By agreeing to these Terms and Conditions, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site.",
        "You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).",
        "You must not transmit any worms or viruses or any code of a destructive nature.",
        "A breach or violation of any of the Terms will result in an immediate termination of your Services.",
      ],
    },
    {
      title: "SECTION 2 – GENERAL CONDITIONS",
      items: [
        "We reserve the right to refuse service to anyone for any reason at any time.",
        "You understand that your content (not including credit card / PayPal information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices. Credit card information is always encrypted during transfer over networks.",
        "We reserve the right to stop offering customer support & product updates to anyone for any reason at any time. In this case, the customer is eligible for a full refund if they are still eligible for product updates & customer support (this is usually, but not always, within one year of purchasing).",
        "The headings used in this agreement are included for convenience only and will not limit or otherwise affect these Terms.",
      ],
    },
    {
      title: "SECTION 3 – ACCURACY, COMPLETENESS AND TIMELINESS OF INFORMATION",
      items: [
        "We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, more complete or more timely sources of information. Any reliance on the material on this site is at your own risk.",
        "This site may contain certain historical information. Historical information, necessarily, is not current and is provided for your reference only. We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information on our site. You agree that it is your responsibility to monitor changes to our site.",
      ],
    },
    {
      title: "SECTION 4 – MODIFICATIONS TO THE SERVICE AND PRICES",
      items: [
        "Prices for our products are subject to change without notice.",
        "We reserve the right at any time to modify or discontinue the Services (or any part or content thereof) without notice at any time.",
        "We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.",
      ],
    },
    {
      title: "SECTION 5 – PRODUCTS OR SERVICES (if applicable)",
      items: [
        "Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy.",
        "We have made every effort to display as accurately as possible the products that appear on this site. We cannot guarantee that your computer monitor’s display of any color will be accurate.",
        "We reserve the right, but are not obligated, to limit the sales of our products or Services to any person, geographic region or jurisdiction. We may exercise this right on a case-by-case basis. We reserve the right to limit the quantities of any products or services that we offer. All descriptions of products or product pricing are subject to change at any time without notice, at the sole discretion of us. We reserve the right to discontinue any product at any time. Any offer for any product or service made on this site is void where prohibited. We reserve the right not to do business with anyone for any reason.",
        "We do not warrant that the quality of any products, services, information, or other material purchased or obtained by you will meet your expectations, or that any errors in the Service will be corrected.",
      ],
    },
    {
      title: "SECTION 6 – ACCURACY OF BILLING AND ACCOUNT INFORMATION",
      items: [
        "We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. These restrictions may include orders placed by or under the same customer account, the same credit card, and/or orders that use the same billing and/or shipping address. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made. We reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers or distributors.",
        "You agree to provide current, complete and accurate purchase and account information for all purchases made at our store. You agree to promptly update your account and other information, including your email address and credit card numbers and expiration dates, so that we can complete your transactions and contact you as needed.",
      ],
    },
    {
      title: "SECTION 7 – REFUND & CANCELLATION POLICY",
      items: [
        "We have a 60-day full refund policy for any of our products. Please let us know about any eventual issues you might have, within the aforementioned timeframe. Once 60 days have passed since a charge, the charge is final.",
      ],
    },
    {
      title: "SECTION 8 – OPTIONAL TOOLS",
      items: [
        "We may provide you with access to third-party tools over which we neither monitor nor have any control nor input.",
        "You acknowledge and agree that we provide access to such tools ”as is” and “as available” without any warranties, representations or conditions of any kind and without any endorsement. We shall have no liability whatsoever arising from or relating to your use of optional third-party tools.",
        "Any use by you of optional tools offered through the site is entirely at your own risk and discretion and you should ensure that you are familiar with and approve of the terms on which tools are provided by the relevant third-party provider(s).",
        "We may also, in the future, offer new services and/or features through the website (including, the release of new tools and resources). Such new features and/or services shall also be subject to these Terms and Conditions.",
      ],
    },
    {
      title: "SECTION 9 – THIRD-PARTY LINKS",
      items: [
        "Certain content, products, and services available via our Service may include materials from third-parties.",
        "Third-party links on this site may direct you to third-party websites that are not affiliated with us. We are not responsible for examining or evaluating the content or accuracy and we do not warrant and will not have any liability or responsibility for any third-party materials or websites, or for any other materials, products, or services of third-parties.",
        "We are not liable for any harm or damages related to the purchase or use of goods, services, resources, content, or any other transactions made in connection with any third-party websites. Please review carefully the third-party’s policies and practices and make sure you understand them before you engage in any transaction. Complaints, claims, concerns, or questions regarding third-party products should be directed to the third-party.",
      ],
    },
  ];

  return (
    <div className="bg-white">
      <main className="flex min-h-screen flex-col items-start justify-between py-24 text-gray-800w-full  lg:max-w-[50%] mx-auto px-6 ">
        <h1 className="font-semibold text-2xl md:text-4xl self-center mb-6">
          Terms & Conditions
        </h1>
        <p className="mb-6 font-mono text-gray-700">
          <b>
            PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY. BY ACCESSING, USING
            ANY PART OF OUR WEBSITE OR USING OUR SERVICES, YOU AGREE TO BE BOUND
            BY THIS DOCUMENT. IF YOU DO NOT AGREE TO ALL OF THESE TERMS AND
            CONDITIONS, DO NOT USE OUR WEBSITE OR OTHER PRODUCTS OR SERVICES
            RELATED TO IT.
          </b>
        </p>
        {terms.map((section, index) => (
          <div key={index} className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
            <ul className="p-0">
              {section.items.map((item, idx) => (
                <li key={idx} className="mb-1 text-lg">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <h2>
          <b>Contact Us:</b> If you have any questions about these Terms, please
          contact us at <b>support@zero8.dev</b>
        </h2>
      </main>
    </div>
  );
};

export default Terms;
