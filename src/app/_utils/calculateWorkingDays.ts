import { createClient } from './supabase/client';

interface WorkingDaysParams {
  startDate: Date;
  endDate: Date;
  teamId: string;
  orgId: string;
}

export async function calculateWorkingDays({
  startDate,
  endDate,
  teamId,
  orgId,
}: WorkingDaysParams): Promise<number> {
  const supabase = await createClient();

  const { data: teamData, error: teamError } = await supabase
    .from('Team')
    .select('workweek')
    .eq('teamId', teamId)
    .maybeSingle();

  if (teamError) throw teamError;

  const workweek = new Set(
    teamData?.workweek || [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
    ]
  );

  const { data: holidays, error: holidayError } = await supabase
    .from('Holiday')
    .select('date, isRecurring')
    .eq('orgId', orgId);

  if (holidayError) throw holidayError;

  const holidaySet = new Set();

  holidays.forEach((holiday) => {
    const holidayDate = new Date(holiday.date);
    if (holiday.isRecurring) {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      for (let year = startYear; year <= endYear; year++) {
        const recurringDate = new Date(
          year,
          holidayDate.getMonth(),
          holidayDate.getDate()
        );
        holidaySet.add(recurringDate.toISOString().split('T')[0]);
      }
    } else {
      holidaySet.add(holiday.date.split('T')[0]);
    }
  });

  let workingDays = 0;
  const currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (currentDate <= endDateObj) {
    const dayName = currentDate
      .toLocaleString('en-US', { weekday: 'long' })
      .toUpperCase();
    const dateString = currentDate.toISOString().split('T')[0];

    if (workweek.has(dayName) && !holidaySet.has(dateString)) {
      workingDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}
