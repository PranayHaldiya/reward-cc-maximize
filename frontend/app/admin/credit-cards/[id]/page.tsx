import CreditCardDetail from './CreditCardDetail';

interface PageProps {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: PageProps) {
  return <CreditCardDetail id={params.id} />;
}
