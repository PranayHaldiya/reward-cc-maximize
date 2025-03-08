import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ 
  params,
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  return {
    title: `Credit Card Details - ${params.id}`,
  };
}

async function getData(id: string) {
  // This ensures we have a Promise-based data fetch
  return Promise.resolve({ id });
}

export default async function Page({ 
  params,
}: { 
  params: { id: string } 
}) {
  // Ensure we await the data
  const data = await getData(params.id);
  return <CreditCardDetail id={data.id} />;
} 
