import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Credit Card Details - ${params.id}`,
  };
}

export default function Page({ params }: PageProps) {
  return <CreditCardDetail id={params.id} />;
} 
