'use client'

import React, { useContext, useState } from 'react'
import Link from 'next/link';
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation';
import { AuthContext } from '@/app/context/AuthContext';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { authState, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    window.location.reload();
    router.push('/sign-in');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className='header-w dark' suppressHydrationWarning>
      <div className="inner-header">
        <div className="logo">
          <Link href='/explore-jobs'>
            <Image
              src='/img/logo-light.png'
              alt="Osmo"
              width={133}
              height={41}
            />
          </Link>
        </div>
        <div className="nav-w">
          {authState.user ? (
            <>
              <div className={`hamburger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <ul className={`nav-ul ${isMenuOpen ? 'show' : ''}`}>
                <li className={`nav-li ${pathname === '/explore-jobs' ? 'active' : ''}`}>
                  <Link href="/explore-jobs" onClick={() => setIsMenuOpen(false)}>
                    Jobs
                  </Link>
                </li>
                <li className={`nav-li ${pathname === '/status' ? 'active' : ''}`}>
                  <Link href="/status" onClick={() => setIsMenuOpen(false)}>
                    Status
                  </Link>
                </li>
                <li className={`nav-li ${pathname === '/profile' ? 'active' : ''}`}>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                    Profile
                  </Link>
                </li>
                <li className={`nav-li ${pathname === '/account' ? 'active' : ''}`}>
                  <Link href="/account" onClick={() => setIsMenuOpen(false)}>
                    Account
                  </Link>
                </li>
                <li className="nav-li">
                  <Link href="/sign-in" onClick={(e) => { handleLogout(e); setIsMenuOpen(false); }}>
                    Logout
                  </Link>
                </li>
              </ul>
            </>
          ) : (
            <>
              <div className={`hamburger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <ul className={`nav-ul ${isMenuOpen ? 'show' : ''}`}>
                <li className={`nav-li ${pathname?.startsWith('/explore-jobs') ? 'active' : ''}`}>
                  <Link href="/explore-jobs" onClick={() => setIsMenuOpen(false)}>
                    Jobs
                  </Link>
                </li>
                <li className={`nav-li ${pathname === '/sign-in' ? 'active' : ''}`}>
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Link>
                </li>
                <li className={`nav-li ${pathname === '/sign-up' ? 'active' : ''}`}>
                  <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    Create Account
                  </Link>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
    </header>
  )
};

export default Header
