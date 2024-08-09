export const calculateLeaveBalanceForPolicy = (
  leavePolicy: ILeavePolicy,
  isProrate: boolean,
  joiningDate?: string
): number | IUnlimited => {
  let currentDate = joiningDate ? new Date(joiningDate) : new Date();
  let balance: number | IUnlimited;

  if (!isProrate) {
    balance = leavePolicy.unlimited ? "unlimited" : leavePolicy.maxLeaves;
  } else {
    const perMonthLeaves = leavePolicy.maxLeaves / 12;
    const remainingMonths = 12 - currentDate.getMonth();

    balance = leavePolicy.unlimited
      ? "unlimited"
      : Math.ceil(perMonthLeaves * remainingMonths);
  }
  return balance;
};