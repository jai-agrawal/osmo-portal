import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="inners">
        <div className="lefts">
          <div className="texts">
            A boutique placement agency, specializing in end-to-end recruitment.
          </div>
          <div className="sub-texts">
            For queries and support, please email <Link href='mailto:hi@theosmo.in'>hi@theosmo.in</Link>
          </div>
        </div>
        <div className="rights">
          <div className="footer-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <span className="sep"> · </span>
            <Link href="/terms-and-conditions">Terms & Conditions</Link>
          </div>
          <ul className="socials">
            <li className="soci">
              <Link href='https://www.linkedin.com/company/osmo-in' target='_blank'>
                <Image src="/img/linkedin.svg" width="20" height="20" alt='linkedin'/>
              </Link>
            </li>
            <li className="soci">
            <Link href='https://www.instagram.com/osmo.in' target='_blank'>
                <Image src="/img/instagram.svg" width="20" height="20" alt='instagram'/>
              </Link>
            </li>
          </ul>
          <div className="copyright-w">
            @<span className='currentYear'>{currentYear}</span> by Osmo
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
