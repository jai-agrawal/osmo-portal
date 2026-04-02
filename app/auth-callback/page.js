'use client'

import { Suspense, useEffect, useContext, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import Loader from '@/app/components/UI/Loader';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authState } = useContext(AuthContext);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token || !userId) {
      setError('Authentication failed. Missing credentials.');
      return;
    }

    // Set cookies (same as AuthContext.login)
    const TOKEN_NAME = process.env.NEXT_PUBLIC_AUTH_TOKEN_NAME || '_osmo_token';
    const USER_ID_NAME = process.env.NEXT_PUBLIC_USER_ID || '_osmo_user_id';
    const expires = new Date(Date.now() + 7 * 864e5).toUTCString();

    document.cookie = `${TOKEN_NAME}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = `${USER_ID_NAME}=${encodeURIComponent(userId)}; expires=${expires}; path=/; SameSite=Lax`;

    // Redirect to dashboard
    window.location.href = '/explore-jobs';
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="onboard-page">
        <div className="inner">
          <div className="main-cont">
            <div className="forms-a">
              <div className="headers">
                <h1>Authentication Error</h1>
                <h4>{error}</h4>
              </div>
              <div className="form-actions">
                <button
                  className="comm-cta fill-blue"
                  onClick={() => router.push('/sign-in')}
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Loader />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
