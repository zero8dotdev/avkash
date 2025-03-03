import { createClient } from '../_utils/supabase/server';
import SignUpForm from './_components/signup-form';

export default async function SignUpPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return <SignUpForm user={user} />;
}
