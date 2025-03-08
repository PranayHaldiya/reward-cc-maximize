import CreditCardDetail from './CreditCardDetail';

interface Props {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function Page({ params, searchParams }: Props) {
  return <CreditCardDetail id={params.id} />;
}
