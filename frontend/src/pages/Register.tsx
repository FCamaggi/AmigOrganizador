import AuthShell from '../components/auth/AuthShell';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => (
  <AuthShell subtitle="Sumate a la energia. Empieza a organizar en grupo." tone="soft">
    <RegisterForm />
  </AuthShell>
);

export default Register;
