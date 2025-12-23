import RegisterForm from '../components/auth/RegisterForm';
import { APP_NAME } from '../utils/constants';

const Register = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-neutral-900 mb-3">
            {APP_NAME}
          </h1>
          <p className="text-neutral-600 text-lg font-medium">
            Únete y comienza a organizar
          </p>
        </div>
      </div>
      <RegisterForm />
    </div>
  );
};

export default Register;
