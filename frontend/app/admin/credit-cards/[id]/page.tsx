import { Metadata } from 'next';
import CreditCardDetail from './CreditCardDetail';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Credit Card Details - ${params.id}`,
  };
}

async function getData(id: string) {
  return { id };
}

export default async function Page(props: PageProps) {
  const data = await getData(props.params.id);
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <CreditCardDetail id={data.id} />
    </div>
  );
} 
