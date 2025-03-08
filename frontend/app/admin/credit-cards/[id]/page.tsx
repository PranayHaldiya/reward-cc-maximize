import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Credit Card Details',
};

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <CreditCardDetail id={params.id} />;
}
