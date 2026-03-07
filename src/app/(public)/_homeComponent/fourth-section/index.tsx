export default function FourthSection() {
  const table = [
    {
      aspect: 'Efficiency',
      withAvkash: 'High efficiency with automated processes',
      withoutAvkash: 'Low efficiency due to manual tracking and processing',
    },
    {
      aspect: 'Leave Requests',
      withAvkash: 'Quick and seamless via Slack/Google Workspace',
      withoutAvkash:
        'Time-consuming and error-prone with emails or spreadsheets',
    },
    {
      aspect: 'Approval Process',
      withAvkash: 'Streamlined with instant notifications and approvals',
      withoutAvkash: 'Delayed due to back-and-forth communication',
    },
    {
      aspect: 'Transparency',
      withAvkash:
        'High transparency with real-time updates accessible to all team members',
      withoutAvkash:
        "Low transparency; team members often unaware of others' leaves",
    },
    {
      aspect: 'Record-Keeping',
      withAvkash: 'Accurate and up-to-date records automatically maintained',
      withoutAvkash: 'Prone to errors and inconsistencies',
    },
    {
      aspect: 'Work-Life Balance',
      withAvkash: 'Promotes better work-life balance by encouraging time off',
      withoutAvkash:
        'Employees may hesitate to take leave due to complex processes',
    },
    {
      aspect: 'Resource Planning',
      withAvkash: 'Improved with comprehensive reporting and insights',
      withoutAvkash: 'Challenging due to lack of real-time data and insights',
    },
  ];

  return (
    <div className="w-full md:max-w-6xl py-[100px] mx-auto p-3">
      <p className="px-3 text-3xl font-semibold md:text-4xl mb-10 tracking-tighter">
        In my organisation, we are only 5 members, do I still need an automatic
        leave tracker?
      </p>
      <p className="px-3 text-lg md:text-xl mb-10 tracking-tight">
        Small teams, even as small as three members, can thrive together only if
        all the members of the team are on the same page. Avkash ushers in a
        culture that stands tall on the shoulders of transparency and automation
      </p>
      <div className="relative overflow-x-auto shadow-xl rounded-lg border mx-2 border-blue-300">
        <table className="w-full text-sm text-left text-blue-100">
          <thead className="text-xs text-white uppercase bg-blue-800">
            <tr>
              <th
                scope="col"
                className="px-3 py-3 sticky left-0"
                style={{ backgroundColor: '#1E40AF', width: '100px' }}
              >
                Aspect
              </th>
              <th scope="col" className="px-6 py-3">
                Team Using Avkash (Automated)
              </th>
              <th scope="col" className="px-6 py-3">
                Team Managing Leaves Manually
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => {
              const rowStyle = index % 2 === 0 ? '#3B82F6' : '#2563EB';
              return (
                <tr
                  key={index}
                  className="border-b border-blue-500"
                  style={{ backgroundColor: rowStyle }}
                >
                  <th
                    scope="row"
                    className="px-3 py-4 font-medium text-blue-50 whitespace-nowrap sticky left-0"
                    style={{
                      width: '100px',
                      backgroundColor: rowStyle,
                    }}
                  >
                    {row.aspect}
                  </th>
                  <td className="px-6 py-4">{row.withAvkash}</td>
                  <td className="px-6 py-4">{row.withoutAvkash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
