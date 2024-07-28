import { Row, Col, Flex, Button, Typography } from "antd";
import { Fira_Sans_Extra_Condensed } from "next/font/google";
import styles from "./styles.module.css";
import Link from "next/link";
import { PlayCircleOutlined } from "@ant-design/icons";
import HeroSection from "./(public)/homeComponent/HeroSection/page";
import SecondSection from "./(public)/homeComponent/secondSection/page";
const { Title, Paragraph } = Typography;
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
      <div className="w-ful flex justify-center bg-[#2563ea]">
        <SecondSection />
      </div>

    </div>
  )
}




// return (
//   <Flex
//     style={{
//       height: "600px",
//       backgroundColor: "#F27405",
//     }}
//     classNameName={firaSans.variable}
//   >
//     <Col
//       span={8}
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "center",
//         textAlign: "right",
//         paddingRight: "12px",
//       }}
//     >
//       <div
//         classNameName={styles.text}
//         style={{
//           fontSize: "128px",
//           lineHeight: "100px",
//         }}
//       >
//         avkash
//       </div>
//       <div classNameName={styles.text} style={{ fontSize: "44px" }}>
//         Time Off, Simplified!
//       </div>
//     </Col>
//     <Col
//       span={12}
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "center",
//       }}
//     >
//       <div
//         classNameName={styles.text}
//         style={{
//           borderLeft: "6px solid red",
//           paddingLeft: "12px",
//           fontSize: "16px",
//         }}
//       >
//         <p style={{ fontSize: "32px", fontWeight: "200" }}>
//           Tired of juggling spreadsheets and endless email chains to manage
//           time off? Avkash is here to change that.
//         </p>
//         <p style={{ fontSize: "24px", fontWeight: "200" }}>
//           We&apos;re building a seamless leave management platform that
//           integrates with your favorite tools like Slack, Google Workspace,
//           and Microsoft Teams. Say goodbye to manual processes.
//         </p>
//       </div>
//     </Col>
//   </Flex>
// );

