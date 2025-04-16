import React, { useEffect, useState } from 'react';
import { Avatar, Timeline, Table } from 'antd';
import { format, formatDistanceToNowStrict } from 'date-fns';
// import { getLeaveType } from '@/app/_actions'; // Implement this later , Make the object return this as well.

const Activities = ({ activity, user }: any) => {
  return (
    <Timeline
      items={activity?.map((each: any) => {
        let description;

        // Format the changedOn date (only the date)
        const absoluteDateAndTime = format(
          new Date(each.changedOn),
          'MMMM d. yyyy h:mm a'
        );
        const relativeTime = formatDistanceToNowStrict(
          new Date(each.changedOn),
          {
            addSuffix: true,
          }
        );

        // Format startDate and endDate if available
        const startDate = each.changedColumns?.startDate?.new
          ? format(
              new Date(each.changedColumns?.startDate?.new),
              'MMMM d. yyyy'
            )
          : 'N/A';

        const endDate = each.changedColumns?.endDate?.new
          ? format(new Date(each.changedColumns?.endDate?.new), 'MMMM d. yyyy')
          : 'N/A';

        // Generate the description based on the keyword
        switch (each.keyword) {
          case 'invitation':
            description = <p>You were invited to a team.</p>;
            break;

          case 'leave_status':
            description = (
              <p>
                {each.changedBy} has{' '}
                {each.changedColumns?.isApproved?.new ? 'approved' : 'rejected'}
                your leave request.
              </p>
            );
            break;

          case 'leave_request':
            description = (
              <p>
                You applied for leave from <strong>{startDate}</strong> -{' '}
                <strong>{endDate}</strong>.
              </p>
            );
            break;

          case 'accrual':
            const accrualData = [
              {
                key: '1',
                detail: 'Accrual per month',
                days: 2,
              },
              {
                key: '2',
                detail: 'New balance',
                days: 6,
              },
            ];

            const columns = [
              {
                title: 'Details',
                dataIndex: 'detail',
                key: 'detail',
              },
              {
                title: 'Days',
                dataIndex: 'days',
                key: 'days',
              },
            ];

            description = (
              <div className="text-sm">
                <p>
                  You accrued <strong>2 days</strong> of{' '}
                  <strong>Paid time off</strong> leave.
                </p>
                <div className="mt-2 max-w-xs rounded-md border">
                  <Table
                    columns={columns}
                    dataSource={accrualData}
                    pagination={false}
                    size="small"
                    bordered
                  />
                </div>
              </div>
            );
            break;

          case 'change':
            const changes = Object.entries(each.changedColumns || {}).map(
              ([key, value]: [string, any]) => (
                <div key={key}>
                  {key} changed from {JSON.stringify(value?.old ?? 'N/A')} to{' '}
                  {JSON.stringify(value?.new ?? 'N/A')}.
                </div>
              )
            );
            description = <div>{changes}</div>;
            break;

          default:
            description = <p>Unknown activity.</p>;
        }

        return {
          color: each.color || 'blue', // Default color
          children: (
            <div>
              <p className="text-xs flex">
                {absoluteDateAndTime}{' '}
                <p className="text-xs text-gray-500 ps-1"> {relativeTime}</p>
              </p>
              {description}
            </div>
          ),
          dot: <Avatar src={user.picture} />, // Display user picture as the icon
        };
      })}
    />
  );
};

export default Activities;
