import AuthLoginForm from "./AuthLoginForm";
import { useSecureAuth } from "@/hooks/useSecureAuth";

const LoginPage = () => {
  const { signIn } = useSecureAuth();

  return (
    <AuthLoginForm
      title="Secure Login"
      userLabel="Email"
      logo="/lovable-uploads/5fdd50c2-539c-443b-8f6c-b90cc2365a1e.png"
      onSubmit={signIn}
    />
  );
};

export default LoginPage;
