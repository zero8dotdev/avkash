import React, { useEffect, useState } from 'react';
import { Button, Modal, notification, Typography, Col, Row, Flex, Input } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const ShowCalendarURL: React.FC<{ userId: string; teamId: string; orgId: string }> = ({ userId, teamId, orgId }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [calendarUrl, setCalendarUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCalendarUrl(`${window.location.origin}/api/${orgId}/${teamId}/calendarfeed?userId=${userId}`);
    }
  }, [userId, teamId, orgId]);

  const showLoading = () => {
    setOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(calendarUrl).then(() => {
      notification.success({
        message: 'Copied to Clipboard',
        description: 'The calendar URL has been copied to your clipboard.',
      });
    }).catch((err) => {
      notification.error({
        message: 'Copy Failed',
        description: 'Failed to copy the URL. Please try again.',
      });
    });
  };

  return (
      <Row gutter={12}>
        <Col span={12}>
          <Button type="primary" onClick={showLoading} >
          Calendar Feed
          </Button>
        </Col>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        width={1000}
        centered
        footer={null}
      >
        <Flex>
          <Typography.Title  style={{fontSize:"15px"}}>Calendar Feed</Typography.Title>
        </Flex>
        <Flex style={{ display:'flex', flexDirection:"row", height:"32px",backgroundColor:'#b0afab', border:"1px gray solid", borderRadius:"5px" ,justifyContent:'flex-end', alignItems:"center"}}>
          <Input
            type="text"
            value={calendarUrl}
            readOnly
            style={{ width: 'calc(100% - 40px)', border:"none", outline:"none",backgroundColor:'#b0afab', paddingLeft:"5px"}}
          />
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopy}
              style={{border:"1px solid gray"}}
            />
        </Flex>
        <Typography.Paragraph style={{color:'gray',marginTop:"5px"}}>This calendar feed shows all approved leaves inside your organisation. Copy it and add it to your Google Calendar, Apple Calendar, or Outlook Calendar.</Typography.Paragraph>
      </Modal>
      </Row>
  );
};

export default ShowCalendarURL;
