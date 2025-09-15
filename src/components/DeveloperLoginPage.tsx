import AuthLoginForm from './AuthLoginForm';

const DeveloperLoginPage = () => {
  const fakeSignIn = async (id: string, password: string) => {
    if (id === 'dev123' && password === 'password') {
      return { success: true };
    }
    return { success: false, error: 'Invalid Developer credentials' };
  };

  return (
    <AuthLoginForm
      title="Secure Developer Access"
      userLabel="Developer ID"
      logo="/lovable-uploads/5fdd50c2-539c-443b-8f6c-b90cc2365a1e.png"
      onSubmit={fakeSignIn}
    />
  );
};

export default DeveloperLoginPage;
