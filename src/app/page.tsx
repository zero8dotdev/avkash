import { Fira_Sans_Extra_Condensed } from "next/font/google";
import HeroSection from "./(public)/_homeComponent/HeroSection";
import SecondSection from "./(public)/_homeComponent/secondSection";
import Faq from "./(public)/_homeComponent/faq";
import FooterSection from "./(public)/_homeComponent/footer";
import { ThirdSection } from "./(public)/_homeComponent/thirdSection";
import Pricing from "./(public)/pricing/page";

import "./input.css";
import FourthSection from "./(public)/_homeComponent/fourth-section";
import Team from "./(public)/_homeComponent/team";

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
      <div className="w-full flex bg-[#2563ea]">
        <SecondSection />
      </div>
      <div className="h-[500px] border-[1px]">Features</div>
      <div className="w-full flex justify-center my-12">
        <ThirdSection />
      </div>
      <div id="priceSection">
        <Pricing />
      </div>
      <div className="w-full bg-[#2563ea] flex text-white h-[500px] border-[1px]">
        <FourthSection />
      </div>
      <div className="h-full">
        <Faq />
      </div>
      <div className="h-[500px] border-[1px]">
        <Team />
      </div>
      <FooterSection />
    </div>
  );
}
