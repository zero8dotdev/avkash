import { createAdminClient } from '@/app/_utils/supabase/adminClient';

type IFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY';
type IAccuredOn = 'BEGINNING' | 'END';

const getAccuralCount = (frequency: IFrequency, maximumLeaves: number) => {
  switch (frequency) {
    case 'MONTHLY':
      return maximumLeaves / 12;
    case 'QUARTERLY':
      return maximumLeaves / 4;
    case 'HALF_YEARLY':
      return maximumLeaves / 2;
    default:
      return 0;
  }
};

export const calculateAccural = async (
  frequency: IFrequency,
  accrueOn: IAccuredOn
) => {
  try {
    const supabaseAdmin = createAdminClient();
    const { data: policies, error } = await supabaseAdmin
      .from('LeavePolicy')
      .select('*')
      .eq('accruals', true)
      .eq('accrualFrequency', frequency)
      .eq('accrueOn', accrueOn);

    if (error) {
      throw error;
    }

    await Promise.all(
      policies.map(async (policy) => {
        const { orgId, maxLeaves, name, policyId } = policy;
        const accuralCount = getAccuralCount(frequency, maxLeaves);

        const { data: orgUsers, error } = await supabaseAdmin
          .from('User')
          .select('*')
          .eq('orgId', orgId);

        if (error) {
          throw error;
        }

        if (!orgUsers) {
          return;
        }

        await Promise.all(
          orgUsers.map(async (user) => {
            let { userId, accruedLeave } = user;
            if (accruedLeave && accruedLeave !== null) {
              accruedLeave = Object.keys(accruedLeave).reduce(
                (accumulator: { [key: string]: any }, _policyId: string) => {
                  const policy = accruedLeave[_policyId];
                  accumulator[_policyId] = {
                    ...policy,
                    balance: policy.balance + accuralCount,
                  };
                  return accumulator;
                },
                {}
              );

              const { data, error } = await supabaseAdmin
                .from('User')
                .update({ accruedLeave: JSON.stringify(accruedLeave) })
                .eq('userId', userId);

              if (error) {
                throw error;
              }
            }
          })
        );
      })
    );

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
