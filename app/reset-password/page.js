'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Loader from '@/app/components/UI/Loader';

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const resetToken = searchParams.get('resetToken');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!resetToken) {
      router.push('/sign-in');
    }
  }, [resetToken, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.password !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/candidate/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetPasswordToken: resetToken,
          newPassword: passwords.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password reset successful. Redirecting to Login page' });
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reset password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='onboard-page'>
      <div className='inner'>
        <div className="main-cont">
          <div className="forms-a">
            <div className="headers">
              <h1>Create New Password</h1>
            </div>
            <fieldset>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Enter new password</label>
                <input
                  type="password"
                  value={passwords.password}
                  onChange={(e) => setPasswords(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Confirm new password</label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  required
                />
              </div>
              <div className="cta-wrap">
                <button
                  type="submit"
                  className='comm-cta fill-blue sign-in-cta'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="button-content">
                      <span className="loader"></span>
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </fieldset>
        </div>
        {message.text && (
          <div className='gbl-msg'>
            <div className={`form-message ${message.type}`}>
              {message.text}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;
