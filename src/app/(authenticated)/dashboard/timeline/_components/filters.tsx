import { Dropdown, Button, Checkbox, MenuProps, Space, DatePicker } from 'antd';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
import { useApplicationContext } from '@/app/_context/appContext';
import { useState } from 'react';

interface FiltersProps {
  vertical?: boolean;
}

export default function Filters({
  vertical = true,
  activeTab = 'today',
}: {
  vertical?: boolean;
  activeTab?: string;
}) {
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [LeaveMenuOpen, setLeaveMenuOpen] = useState(false);
  const { RangePicker } = DatePicker;

  const {
    state: { role },
  } = useApplicationContext();

  const items: MenuProps['items'] = [
    {
      label: (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedItems.includes('1')}
            onChange={(e) => {
              const newSelectedItems = e.target.checked
                ? [...selectedItems, '1']
                : selectedItems.filter((item) => item !== '1');
              setSelectedItems(newSelectedItems);
            }}
          >
            Item 1
          </Checkbox>
        </div>
      ),
      key: '1',
    },
    {
      label: (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedItems.includes('2')}
            onChange={(e) => {
              const newSelectedItems = e.target.checked
                ? [...selectedItems, '2']
                : selectedItems.filter((item) => item !== '2');
              setSelectedItems(newSelectedItems);
            }}
          >
            Item 2
          </Checkbox>
        </div>
      ),
      key: '2',
    },
  ];

  return (
    <div className="flex flex-row items-center gap-2">
      <div className="flex-1">
        {(activeTab !== 'today' || vertical) && (
          <RangePicker showTime className="w-full" />
        )}
      </div>

      {role !== 'USER' && !vertical && (
        <div className="flex-1">
          <Dropdown
            menu={{ items }}
            open={userMenuOpen}
            onOpenChange={setUserMenuOpen}
          >
            <Button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full"
            >
              <Space>
                Users
                <UserOutlined />
              </Space>
            </Button>
          </Dropdown>
        </div>
      )}

      <div className="flex-1">
        <Dropdown
          menu={{ items }}
          open={LeaveMenuOpen}
          onOpenChange={setLeaveMenuOpen}
        >
          <Button
            onClick={() => setLeaveMenuOpen(!LeaveMenuOpen)}
            className="w-full"
          >
            <Space>
              Leave Types
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      </div>
    </div>
  );
}
