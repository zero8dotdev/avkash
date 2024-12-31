import { ConfigProvider } from "antd";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConfigProvider theme={{ components: { Tabs: { titleFontSize: 20 } } }}>
      <div style={{ padding: "90px" }}>{children}</div>
    </ConfigProvider>
  );
};

export default layout;
