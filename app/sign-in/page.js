'use client'

import React, { useState, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '../context/AuthContext';

function page() {
  const { handleLogin } = useContext(AuthContext);
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isResetLoading, setIsResetLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const result = await handleLogin(email, password);
      if (result.success) {
        window.location.reload();
        router.push('/explore-jobs');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'email' ? value.toLowerCase() : value;

    setFormData({
      ...formData,
      [name]: newValue
    });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsResetLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/candidate/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password reset link has been sent to your email' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Something went wrong' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to process request' });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className='onboard-page'>
      <div className='inner'>
        <div className="main-cont">
          <div className="progress-steps-w">
            <span>Let's find you a job!</span>
          </div>
          {!showForgotPassword ? (
          <div className="forms-a">
            <div className="headers">
              <h1>Sign In</h1>
            </div>
            <div className="social-login-section">
              <button
                type="button"
                className="google-login-btn"
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/candidate/google`}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>
              <div className="social-divider">
                <span>or</span>
              </div>
            </div>
            <fieldset>
              <form onSubmit={onSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="glb-a-nav lefts">
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password
                  </button>
                </div>
                <div className="cta-wrap">
                  <button
                    className='comm-cta fill-blue sign-in-cta'
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="button-content">
                        <span className="loader"></span>
                        Signing In...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>
              </form>
            </fieldset>
            <div className="glb-a-nav">
              <Link href='/sign-up'>Create Account</Link>
            </div>
            {error && (
              <div className='gbl-msg'>
                <div className={`form-message error`}>
                  {error}
                </div>
              </div>
            )}
          </div>
          ):(
          <div className="forms-a">
            <div className="headers">
              <h1>Reset Password</h1>
            </div>
            <fieldset>
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    required
                  />
                </div>
                <div className="cta-wrap">
                  <button
                    type="submit"
                    className='comm-cta fill-blue sign-in-cta'
                    disabled={isResetLoading}
                  >
                    {isResetLoading ? (
                      <span className="button-content">
                        <span className="loader"></span>
                        Sending...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              </form>
            </fieldset>
            <div className="glb-a-nav">
              <button
                type="button"
                className="back-to-login"
                onClick={() => {
                  setShowForgotPassword(false);
                  setMessage({ type: '', text: '' });
                }}
              >
                Back to Login
              </button>
            </div>
            {message.text && (
              <div className='gbl-msg'>
                <div className={`form-message ${message.type}`}>
                  {message.text}
                </div>
              </div>
            )}
           </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default page
