import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

type Props = {
  params: { id: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: `Credit Card Details - ${params.id}`,
  };
}

export default function Page({ params }: Props) {
  return <CreditCardDetail id={params.id} />;
} 
