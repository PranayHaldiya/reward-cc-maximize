import CreditCardDetail from './CreditCardDetail';

type PageProps = {
  params: { id: string };
};

function Page({ params }: PageProps) {
  return <CreditCardDetail id={params.id} />;
}

export default Page; 
