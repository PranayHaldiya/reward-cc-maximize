import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

type PageParams = {
  id: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  return {
    title: `Credit Card Details - ${params.id}`,
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <CreditCardDetail id={resolvedParams.id} />
    </div>
  );
} 
