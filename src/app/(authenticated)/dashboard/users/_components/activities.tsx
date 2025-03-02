import React from 'react';
import { Avatar, Timeline } from 'antd';
import { format, formatDistanceToNow } from 'date-fns';

const Activities = ({ activity, user }: any) => {
  return (
    <Timeline
      items={activity?.map((each: any) => {
        let description;

        // Format the changedOn date (only the date)
        const formattedDate = format(new Date(each.changedOn), 'dd.MM.yyyy');
        const relativeTime = formatDistanceToNow(new Date(each.changedOn), {
          addSuffix: true,
        });

        // Generate the description based on the keyword
        switch (each.keyword) {
          case 'invitation':
            description = <p>You are invited to a team.</p>;
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
                You applied for leave from {each.changedColumns?.startDate?.new}{' '}
                to {each.changedColumns?.endDate?.new}.
              </p>
            );
            break;

          case 'accrual':
            description = <p>Accrual Table updated.</p>;
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
              <strong>
                {formattedDate} ({relativeTime})
              </strong>
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
