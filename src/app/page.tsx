import HeroSection from './(public)/_homeComponent/HeroSection';
import SecondSection from './(public)/_homeComponent/secondSection';
import Faq from './(public)/_homeComponent/faq';
import FooterSection from './(public)/_homeComponent/footer';
import { ThirdSection } from './(public)/_homeComponent/thirdSection';
import Pricing from './(public)/pricing/page';

import './input.css';
import FourthSection from './(public)/_homeComponent/fourth-section';

export default function HomePage() {
  return (
    <div className="w-full " style={{ backgroundColor: '##EAE7DC' }}>
      <HeroSection />
      <div className="w-full flex bg-[#2563ea]">
        <SecondSection />
      </div>

      <div className="w-full flex justify-center my-12">
        <ThirdSection />
      </div>
      <div id="priceSection">
        <Pricing />
      </div>
      <div className="w-full bg-[#2563ea] flex text-white justify-center">
        <FourthSection />
      </div>
      <div className="h-full">
        <Faq />
      </div>
      <FooterSection />
    </div>
  );
}
