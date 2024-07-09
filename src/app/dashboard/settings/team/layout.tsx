import { Tabs } from "antd";

import React from "react";
    

const items = [
    {
        key: '1',
        label: 'settings',
     },
      {
        key: '2',
        label: 'leave policy',
        
      },
      {
        key: '3',
        label: 'notifications',
      },
      {
        key: '4',
        label: 'users',
        
      },
      {
        key: '5',
        label: 'managers',
        
      },
];

const Layout = ({ children }: any) => {
  return (
    <div>
        <Tabs items={items} />
      {children}
     
    </div>
  );
};

export default Layout;
