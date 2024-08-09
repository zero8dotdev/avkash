type IFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY';
type IAccuredOn = 'BEGINNING' | 'END';
type IUnlimited = 'unlimited';

interface ILeavePolicy {
  name: string,
  isActive: boolean,
  accruals: boolean;
  maxLeaves: number;
  autoApprove: boolean;
  rollOver: boolean;
  unlimited: boolean;
  accrualFrequency: IFrequency;
  accrueOn: IAccuredOn;
  rollOverLimit: number;
  rollOverExpiry: null | string;
}
