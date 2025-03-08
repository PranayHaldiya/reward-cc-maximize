import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Credit Card Details',
};

async function getData(id: string) {
  return { id };
}

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  await getData(params.id);
  return <CreditCardDetail id={params.id} />;
}
