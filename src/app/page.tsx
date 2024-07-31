import { Fira_Sans_Extra_Condensed } from "next/font/google";
import HeroSection from "./(public)/homeComponent/HeroSection/page";
import SecondSection from "./(public)/homeComponent/secondSection/page";
import "./input.css";
import Faq from "./(public)/homeComponent/faq/page";
import FooterSection from "./(public)/homeComponent/footer/page";
import { ThirdSection } from "./(public)/homeComponent/thirdSection/page";
import Pricing from "./(public)/pricing/page";

const firaSans = Fira_Sans_Extra_Condensed({
  weight: ["200", "500"],
  style: "normal",
  subsets: ["latin"],
  variable: "--font-fira-sans",
});

export default function HomePage() {
  return (
    <div className="w-full bg-white min-h-screen">
      <HeroSection />
      <div className="w-ful flex bg-[#2563ea]">
        <SecondSection />
      </div>
      <div className="w-full flex justify-center my-8">
        <ThirdSection />
      </div>
      <div id='priceSection'>
        <Pricing />
      </div>
      <div className="h-full">
        <Faq />
      </div>
      <FooterSection />
    </div>
  );
}

