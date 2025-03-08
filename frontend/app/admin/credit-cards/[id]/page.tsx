import CreditCardDetail from './CreditCardDetail';

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <CreditCardDetail id={params.id} />;
}
