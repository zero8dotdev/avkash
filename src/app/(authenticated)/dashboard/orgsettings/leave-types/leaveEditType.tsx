'use client';

import {
  Avatar,
  Button,
  Checkbox,
  ColorPicker,
  Form,
  Input,
  Modal,
} from 'antd';
import { useEffect, useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { init } from 'emoji-mart';
import predefinedColors, { Emoji } from '../_utils';
import { updateLeaveType } from '../_actions';

init({ data });

interface LeaveType {
  name: string;
  isActive: boolean;
  color: string;
  leaveTypeId: string;
  emoji?: any;
}

interface Props {
  item: LeaveType | undefined;
  onCancel: Function;
  update: () => void;
  orgId: string;
}

const LeaveTypeEdit: React.FC<Props> = ({ item, onCancel, update, orgId }) => {
  const visible = !!item;

  const [loader, setLoader] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [color, setColor] = useState<string>('');

  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const onFinish = async (values: any) => {
    setLoader(true);
    try {
      const data = await updateLeaveType(values, item?.leaveTypeId);

      if (data) {
        onCancel();
        setLoader(false);
      } else {
        console.log('something went wrong');
      }
    } catch (error) {
      console.error(error);
    } finally {
      update();
    }
  };

  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && item) {
      form.setFieldsValue({
        name: item.name,
        color: `#${item.color}`,
        emoji: item.emoji,
      });
      setColor(`#${item.color}` || '');
      setSelectedEmoji(item.emoji || '');
    }
  }, [visible, item, form]);

  const handleCancel = () => {
    onCancel();
  };

  const handleEmojiClick = (data: Emoji) => {
    setSelectedEmoji(data.native); // Update emoji state
    form.setFieldValue('emoji', data.native); // Update form value
    setEmojiPickerVisible(false); // Hide picker
  };

  return visible ? (
    <Modal
      open
      title={`Edit ${item?.name || ''} Leave Type`}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loader}
          onClick={() => form.submit()}
        >
          Save
        </Button>,
      ]}
      closable={false}
    >
      <Form onFinish={onFinish} form={form} initialValues={item}>
        <Form.Item label="Leave Type name" name="name">
          <Input />
        </Form.Item>
        <Form.Item
          label="Leave Color"
          name="color"
          rules={[
            { required: true, message: 'Please select leave type color' },
          ]}
        >
          <div
            onClick={() => setColorPickerVisible(!colorPickerVisible)}
            style={{
              backgroundColor: form.getFieldValue('color') || '#d9d9d9',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              border: '2px solid #d9d9d9',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {!form.getFieldValue('color') && <span>Select</span>}
          </div>
        </Form.Item>
        <div>
          {colorPickerVisible && (
            <div
              style={{
                marginTop: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
              }}
            >
              {predefinedColors.map((color) => (
                <div
                  key={color}
                  style={{
                    backgroundColor: color,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                  }}
                  onClick={() => {
                    form.setFieldValue('color', color);
                    setColor(color); // Update the form value
                    setColorPickerVisible(false); // Hide picker
                  }}
                >
                  {form.getFieldValue('color') === color && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        boxShadow: `0 0 5px 2px ${color}`,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <Form.Item label="Leave Type Emoji" name="emoji">
          <Avatar
            size={40}
            style={{ fontSize: '30px', backgroundColor: 'transparent' }}
            icon={selectedEmoji || '😊'}
            onClick={() => setEmojiPickerVisible(!emojiPickerVisible)}
          />
        </Form.Item>
        {emojiPickerVisible && (
          <div style={{ position: 'absolute', zIndex: 10 }}>
            <Picker data={data} onEmojiSelect={handleEmojiClick} />
          </div>
        )}
      </Form>
    </Modal>
  ) : (
    false
  );
};

export default LeaveTypeEdit;
