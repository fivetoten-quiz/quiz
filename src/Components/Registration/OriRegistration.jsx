import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { useState } from "react";
import { app } from "../../firebase";
import { useNavigate } from "react-router-dom";
import BackgroundImage from '../../images/LoginBackground.jpg'


function Registration() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  const HandleLogIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged In");
      navigate("/Home"); // navigate to homepage
    } catch (error) {
      console.log(error.message);
      setLoginError(error.message);
    }
  };

  const HandleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("SignUP Done");
      navigate("/Home"); // navigate to homepage
    } catch (error) {
      console.log(error.message);
    }
  };

  const HandleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("Google Sign In Done");
      navigate("/Home"); // navigate to homepage
    } catch (error) {
      console.log(error.message);
    }
  };


  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
          alt="Your Company"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={HandleLogIn}>
          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-gray-900 dark:text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-400 dark:placeholder-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                Password
              </label>
              <div className="text-sm">
                <a href="#" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-gray-900 dark:text-white  outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-400 dark:placeholder-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Log in
            </button>
          </div>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={HandleSignUp}
            className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Sign up
          </button>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={HandleGoogleLogin}
            className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Continue with Google
          </button>
        </div>

        {loginError && (
          <p className="text-red-400 mt-4 text-sm text-center">{loginError}</p>
        )}

        <p className="mt-10 text-center text-sm/6 text-gray-400">
          Not a member?{' '}
          <a href="#" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Start a 14 day free trial
          </a>
        </p>
      </div>
    </div>
  );
}

export default Registration;