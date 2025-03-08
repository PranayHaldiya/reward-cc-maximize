import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ 
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Credit Card Details - ${params.id}`,
  };
}

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <CreditCardDetail id={params.id} />;
} 
