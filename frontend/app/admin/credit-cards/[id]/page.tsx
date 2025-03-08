import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Credit Card Details - ${params.id}`,
  };
}

export default async function Page({ params }: PageProps) {
  return <CreditCardDetail id={params.id} />;
} 
