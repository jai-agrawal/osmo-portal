import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | JobsOsmo',
  description: 'Privacy Policy for JobsOsmo.in – how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="privacy-page">
      <div className="spotlight-bar container-pad">
        <div className="content">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: 16 February 2026</p>
        </div>
      </div>

      <div className="privacy-content container-pad">
        <p className="intro">
          At JobsOsmo.in (&quot;JobsOsmo&quot;, &quot;we&quot;, &quot;our&quot; or &quot;us&quot;), accessible at{' '}
          <Link href="https://www.jobsosmo.in" target="_blank" rel="noopener noreferrer">https://www.jobsosmo.in</Link>, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, store, and safeguard your information when you visit and interact with our job portal and services.
        </p>
        <p className="intro">
          By accessing or using JobsOsmo, you signify that you have read, understood, and agree to the practices described in this Privacy Policy.
        </p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect the following types of data:</p>
          <h3>a. Contact &amp; Identity Information</h3>
          <ul>
            <li>Full name</li>
            <li>Email address</li>
            <li>Mobile number</li>
            <li>Profile photo (if uploaded)</li>
          </ul>
          <h3>b. Career &amp; Professional Details</h3>
          <ul>
            <li>Resume / CV content</li>
            <li>Qualifications &amp; education history</li>
            <li>Work experience</li>
            <li>Skills &amp; portfolio links</li>
            <li>Job preferences (location, salary expectations, role types)</li>
          </ul>
          <h3>c. Employer / Recruiter Data</h3>
          <ul>
            <li>Company / organization name</li>
            <li>Employer contact email</li>
            <li>Hiring requirements and job listings</li>
          </ul>
          <h3>d. Technical &amp; Usage Information</h3>
          <p>We automatically collect information when you visit or use our portal, including:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type &amp; device information</li>
            <li>Pages visited</li>
            <li>Click patterns and navigation behavior</li>
            <li>Time spent on different sections of the site</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use your personal information for:</p>
          <ul>
            <li>Creating and managing your account</li>
            <li>Matching job seekers with relevant job opportunities</li>
            <li>Allowing employers to review candidate profiles</li>
            <li>Sending alerts, updates, and job notifications</li>
            <li>Optimising and improving our platform and job recommendations</li>
            <li>Complying with legal and regulatory obligations</li>
          </ul>
          <p>We do not use your information for purposes outside the scope described here without your consent.</p>
        </section>

        <section>
          <h2>3. Sharing &amp; Disclosure of Personal Data</h2>
          <p>We may share your information with:</p>
          <ul>
            <li>Employers or recruiters when you apply for jobs or make your profile visible</li>
            <li>Service providers who assist with website functionality, analytics, email delivery, customer support, or data storage</li>
            <li>Legal or regulatory authorities if required to comply with applicable laws</li>
          </ul>
          <p>We never sell or rent your personal information to third parties for marketing or commercial purposes.</p>
        </section>

        <section>
          <h2>4. Cookies &amp; Tracking Technologies</h2>
          <p>We use cookies, pixels, and similar technologies to:</p>
          <ul>
            <li>Provide essential website functionality</li>
            <li>Analyse usage and performance</li>
            <li>Personalise your experience</li>
          </ul>
          <p>You can choose to disable cookies in your browser settings, but please note that some features of our portal may not work properly without cookies.</p>
        </section>

        <section>
          <h2>5. Security of Your Information</h2>
          <p>We implement industry-standard security measures to protect your data, including encryption, secure servers, and access controls. However, no system is 100% secure, and we cannot guarantee absolute protection against unauthorized access.</p>
        </section>

        <section>
          <h2>6. Data Retention</h2>
          <p>We retain your data only as long as necessary to:</p>
          <ul>
            <li>Provide our services</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce agreements</li>
          </ul>
          <p>If you request deletion of your data, we will remove it unless required to retain data for legal or operational purposes.</p>
        </section>

        <section>
          <h2>7. Your Rights &amp; Choices</h2>
          <p>You may:</p>
          <ul>
            <li>Access and update your profile information</li>
            <li>Request corrections to inaccurate personal data</li>
            <li>Request deletion of your account and related data (subject to legal requirements)</li>
          </ul>
          <p>To exercise these rights, please contact us at <Link href="mailto:hi@jobsosmo.in">hi@jobsosmo.in</Link>.</p>
        </section>

        <section>
          <h2>8. Third-Party Links</h2>
          <p>Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of those external websites. Please review their privacy policies before sharing your data.</p>
        </section>

        <section>
          <h2>9. Children&apos;s Privacy</h2>
          <p>JobsOsmo is intended for individuals aged 18 years and above. We do not knowingly collect or process personal data from minors.</p>
        </section>

        <section>
          <h2>10. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy occasionally to reflect changes in regulations or how we serve you. The &quot;Last updated&quot; date will always reflect when changes were made.</p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
          <p>If you have questions, concerns, or requests related to your privacy, please contact:</p>
          <p className="contact-block">
            <strong>JobsOsmo</strong><br />
            Email: <Link href="mailto:hi@jobsosmo.in">hi@jobsosmo.in</Link><br />
            Website: <Link href="https://www.jobsosmo.in" target="_blank" rel="noopener noreferrer">https://www.jobsosmo.in</Link>
          </p>
        </section>
      </div>
    </div>
  )
}
