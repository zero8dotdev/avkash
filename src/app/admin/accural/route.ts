import { NextResponse } from 'next/server';
import { calculateAccural } from './_functions/calculateAccural';

type IFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY';
type IAccuredOn = 'BEGINNING' | 'END';

export async function POST(request: Request) {
  const {
    frequency,
    accuredOn,
  }: { frequency: IFrequency; accuredOn: IAccuredOn } = await request.json();

  if (!frequency) {
    return new NextResponse(
      JSON.stringify({ error: `frequency is required.` }),
      { status: 400 }
    );
  }

  const jobExecutionResult = await calculateAccural(frequency, accuredOn);
  return new NextResponse(JSON.stringify({ result: jobExecutionResult }), {
    status: jobExecutionResult ? 200 : 500,
  });
}
