'use client';

import { useApplicationContext } from '@/app/_context/appContext';
import { Menu, Tabs } from 'antd';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useTransition } from 'react';

const SideMenu = ({ position }: { position: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { state } = useApplicationContext();

  // Define the items outside the component to avoid re-creating them
  const allItems = [
    { label: 'General', key: 'general', children: '' },
    { label: 'Billing', key: 'billing', children: '' },
    { label: 'Leave Types', key: 'leave-types', children: '' },
    { label: 'Teams', key: 'team', children: '' },
    { label: 'Locations', key: 'location', children: '' },
  ];

  // Initialize state with filtered items based on role
  const initialItems =
    state.role === 'MANAGER'
      ? allItems.filter(
          (item) => item.key === 'team' || item.key === 'location'
        )
      : allItems;

  const [tabitems, setTabitems] = useState(initialItems);

  useEffect(() => {
    const filteredItems =
      state.role === 'MANAGER'
        ? allItems.filter(
            (item) => item.key === 'team' || item.key === 'location'
          )
        : allItems;

    setTabitems(filteredItems);

    const prefetchRoutes = allItems.map((item) => `/${item.key}`);
    prefetchRoutes.forEach((route) => {
      router.prefetch(route);
    });
  }, [router, state.role]);

  return (
    <Tabs
      activeKey={position}
      onChange={(key) => startTransition(() => router.push(`${key}`))}
      type="card"
      items={tabitems}
      tabPosition="left"
    />
  );
};

export default SideMenu;
