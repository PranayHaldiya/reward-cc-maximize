import CreditCardDetail from '@/app/admin/credit-cards/[id]/CreditCardDetail';

type PageProps = {
  params: {
    id: string;
  };
};

export default async function Page({ params }: PageProps) {
  return <CreditCardDetail id={params.id} />;
}
