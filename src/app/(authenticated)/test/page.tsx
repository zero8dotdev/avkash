import { fetchOrg, fetchUser } from '@/app/_actions';

export default async function Page() {
  const user = await fetchUser();
  const org = await fetchOrg(user?.orgId || '');

  console.log(user, org);

  return <div />;
}
