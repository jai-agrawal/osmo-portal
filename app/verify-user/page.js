'use client'

import React, { Suspense, useEffect } from 'react'
import Loader from '@/app/components/UI/Loader';
import { useSearchParams, useRouter } from 'next/navigation';

const VerifyUserContent = () => {
  const searchParams = useSearchParams();
  const verifyToken = searchParams.get('verifyToken');
  const router = useRouter();

  useEffect(() => {
    if (!verifyToken) {
      return;
    }
    verifyUser();
  }, [verifyToken, router]);

  const verifyUser = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/candidate/verify?verifyToken=${verifyToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verifyToken
      }),
    });

    if (response.ok) {
      // window.location.href = '/sign-in';
    } else {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      // window.location.href = '/sign-in';
    }
  };

  return (
    <div>
      Verify User
    </div>
  )

}

const VerifyUserPage = () => {
    return (
      <Suspense fallback={<Loader />}>
        <VerifyUserContent />
      </Suspense>
    )
}

export default VerifyUserPage
