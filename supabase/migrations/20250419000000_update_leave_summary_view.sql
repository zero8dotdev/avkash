-- Drop existing view
DROP VIEW IF EXISTS public.leave_summary;

-- Create updated view with separate columns for taken and planned leaves
CREATE OR REPLACE VIEW leave_summary AS
SELECT
  "userId",
  "leaveTypeId",
  SUM(CASE WHEN "isApproved" = 'APPROVED' THEN "workingDays" ELSE 0 END) as taken,
  SUM(CASE WHEN "isApproved" = 'PENDING' THEN "workingDays" ELSE 0 END) as planned,
  SUM("workingDays") as total_days
FROM
  "Leave"
GROUP BY
  "userId", "leaveTypeId"; 