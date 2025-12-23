import LoginForm from '../components/auth/LoginForm';
import { APP_NAME } from '../utils/constants';

const Login = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-4 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 sm:mb-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mb-2 sm:mb-3">
            {APP_NAME}
          </h1>
          <p className="text-neutral-600 text-base sm:text-lg font-medium px-4">
            Organiza tus encuentros sin complicaciones
          </p>
        </div>
      </div>
      <LoginForm />
    </div>
  );
};

export default Login;
