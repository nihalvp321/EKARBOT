import AuthLoginForm from './AuthLoginForm';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';

const SalesAgentLoginPage = () => {
  const { signIn } = useSalesAgentAuth();

  return (
    <AuthLoginForm
      title="Secure Sales Agent Access"
      userLabel="Sales Agent ID"
      logo="/lovable-uploads/5fdd50c2-539c-443b-8f6c-b90cc2365a1e.png"
      onSubmit={signIn}
    />
  );
};

export default SalesAgentLoginPage;
