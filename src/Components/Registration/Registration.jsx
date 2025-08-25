import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  getAuth,
  updateProfile
} from "firebase/auth";
import { app } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

//image import 
import LogoImage from "../../images/LogoImage.jpg"; // Add this import

const Registration = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  const toggleForm = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setLoginError('');
      setIsTransitioning(false);
    }, 300);
  };

  const HandleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    
    if (isSignUp) {
      // Sign up logic    
      if (password !== confirmPassword) {
        setLoginError("Passwords don't match");
        setLoading(false);
        return;
      }
      
      if (password.length < 6) {
        setLoginError("Password should be at least 6 characters");
        setLoading(false);
        return;
      }

      try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile with display name
        await updateProfile(user, {
          nickname: name
        });
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          nickname: name,
          email: user.email,
          createdAt: new Date(),
          lastLogin: new Date()
        });
        
        console.log("Sign up successful");
        navigate("/Home"); // navigate to homepage
      } catch (error) {
        console.error("Sign up error:", error);
        setLoginError(error.message);
      }
    } else {
      // Login logic
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update last login time in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date()
        }, { merge: true });
        
        console.log("Login successful");
        navigate("/Home"); // navigate to homepage
      } catch (error) {
        console.error("Login error:", error);
        setLoginError(error.message);
      }
    }
    
    setLoading(false);
  };

  const HandleGoogleAuth = async () => {
    setLoading(true);
    setLoginError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save/update user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        // nickname: user.nickname,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLogin: new Date(),
        provider: 'google'
      }, { merge: true });
      
      console.log("Google authentication successful");
      navigate("/Home"); // navigate to homepage
    } catch (error) {
      console.error("Google auth error:", error);
      setLoginError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image (hidden on mobile) */}
      <div className="hidden md:block md:w-3/5 lg:w-3/5 bg-gradient-to-br from-blue-600 to-indigo-900 relative">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white text-center max-w-md">
            <h1 className="text-4xl font-bold mb-6">
              {isSignUp ? 'Join Our Community' : 'Welcome Back'}
            </h1>
            <p className="text-xl mb-8">
              {isSignUp 
                ? 'Access premium content, connect with other professionals, and grow your career.'
                : 'Continue your journey with us and access your personalized dashboard.'}
            </p>
            <div className="flex justify-center">
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-6xl mb-4">{isSignUp ? '⭐' : '🚀'}</div>
                <p className="text-sm">
                  {isSignUp 
                    ? '"This platform transformed my career path in just 3 months!"'
                    : '"I\'ve never experienced such a seamless learning platform!"'}
                </p>
                <p className="text-xs mt-2">- Sarah Johnson, Senior Developer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-2/5 lg:w-2/5 bg-white dark:bg-gray-900 flex items-center justify-center py-12 px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center md:hidden mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {isSignUp ? 'Join thousands of users today' : 'Sign in to continue your journey'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 relative overflow-hidden">
            {/* Toggle indicator */}
            {/* color: rom-blue-500 to-indigo-600 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r "></div>
            
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
              <img
                // src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                src={LogoImage}
                alt="Your Company"
                className="mx-auto h-10 w-auto"
              />
              <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </h2>
            </div>

            <div className={`mt-10 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              <form className="space-y-6" onSubmit={HandleSubmit}>
                {isSignUp && (
                  <div className="animate-fadeIn">
                    <label htmlFor="name" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                      Nickname
                    </label>
                    <div className="mt-2">
                      <input
                        id="name"
                        type="text"
                        name="name"
                        required={isSignUp}
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full rounded-md bg-white dark:bg-gray-700 px-3 py-2.5 text-base text-gray-900 dark:text-white outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                        placeholder="CoolStudent123"
                      />
                    </div>
                  </div>
                )}

                <div className={isSignUp ? 'animate-fadeIn' : ''}>
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
                      className="block w-full rounded-md bg-white dark:bg-gray-700 px-3 py-2.5 text-base text-gray-900 dark:text-white outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className={isSignUp ? 'animate-fadeIn' : ''}>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                      Password
                    </label>
                    {!isSignUp && (
                      <div className="text-sm">
                        <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                          Forgot password?
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <input
                      id="password"
                      type="password"
                      name="password"
                      required
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-md bg-white dark:bg-gray-700 px-3 py-2.5 text-base text-gray-900 dark:text-white outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                      placeholder={isSignUp ? "Create a password" : "Enter your password"}
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="animate-fadeIn">
                    <label htmlFor="confirmPassword" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                      Confirm Password
                    </label>
                    <div className="mt-2">
                      <input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        required={isSignUp}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-md bg-white dark:bg-gray-700 px-3 py-2.5 text-base text-gray-900 dark:text-white outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                )}

                {isSignUp && (
                  <div className="flex items-center animate-fadeIn">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <label htmlFor="terms" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                      I agree to the{' '}
                      <a href="#" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        Terms and Conditions
                      </a>
                    </label>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                  >
                    {isSignUp ? 'Create Account' : 'Sign in'}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={HandleGoogleAuth}
                    className="flex w-full justify-center items-center gap-3 rounded-md bg-white px-3 py-2.5 text-sm/6 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                  >
                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                      <path
                        d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                        fill="#EA4335"
                      />
                      <path
                        d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.9351 19.9454 21.0951L16.0804 18.0951C15.0054 18.8201 13.6204 19.2451 12.0004 19.2451C8.8704 19.2451 6.21537 17.1351 5.2654 14.2901L1.2804 17.3901C3.2554 21.3101 7.3104 24.0001 12.0004 24.0001Z"
                        fill="#34A853"
                      />
                    </svg>
                    {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md animate-fadeIn">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{loginError}</p>
                </div>
              )}

              <p className="mt-8 text-center text-sm/6 text-gray-500 dark:text-gray-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={toggleForm}
                  className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 focus:outline-none focus:underline transition-colors"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Registration;