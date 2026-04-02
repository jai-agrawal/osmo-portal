import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Terms & Conditions | JobsOsmo',
  description: 'Terms and Conditions for JobsOsmo.in – rules and guidelines for using our job portal and services.',
}

export default function TermsAndConditionsPage() {
  return (
    <div className="terms-page">
      <div className="spotlight-bar container-pad">
        <div className="content">
          <h1>Terms &amp; Conditions</h1>
          <p className="last-updated">Last updated: 16 February 2026</p>
        </div>
      </div>

      <div className="terms-content container-pad">
        <p className="intro">
          Welcome to JobsOsmo (&quot;JobsOsmo&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;).
        </p>
        <p className="intro">
          These Terms and Conditions govern your access to and use of our website and services available at{' '}
          <Link href="https://www.jobsosmo.in" target="_blank" rel="noopener noreferrer">https://www.jobsosmo.in</Link>.
        </p>
        <p className="intro">
          By accessing or using JobsOsmo, you agree to be bound by these Terms. If you do not agree, please do not use the platform.
        </p>

        <section>
          <h2>1. About the Platform</h2>
          <p>JobsOsmo is an online job discovery and recruitment platform that connects job seekers with employers and recruiters for career and hiring opportunities.</p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>To use JobsOsmo, you must:</p>
          <ul>
            <li>be at least 18 years of age; and</li>
            <li>be legally capable of entering into a binding contract under applicable laws.</li>
          </ul>
          <p>By using this platform, you confirm that you meet the above requirements.</p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>To access certain features, you may be required to create an account.</p>
          <p>You agree that:</p>
          <ul>
            <li>the information you provide is accurate and complete;</li>
            <li>you will keep your login credentials confidential; and</li>
            <li>you are responsible for all activity under your account.</li>
          </ul>
          <p>JobsOsmo reserves the right to suspend or terminate accounts that contain false, misleading or incomplete information.</p>
        </section>

        <section>
          <h2>4. Use of the Platform</h2>
          <p>You agree to use JobsOsmo only for lawful and legitimate job-related purposes.</p>
          <p>You must not:</p>
          <ul>
            <li>post false, misleading or fraudulent information;</li>
            <li>impersonate any person or organisation;</li>
            <li>upload viruses, malicious code or harmful material;</li>
            <li>misuse candidate data or employer data in any manner;</li>
            <li>scrape, copy or extract data from the platform without authorisation.</li>
          </ul>
        </section>

        <section>
          <h2>5. Job Listings and Applications</h2>
          <p>JobsOsmo does not guarantee:</p>
          <ul>
            <li>that you will receive job offers;</li>
            <li>that any employer will respond to your application; or</li>
            <li>that job listings will remain active for any specific period.</li>
          </ul>
          <p>Employers are solely responsible for the accuracy and authenticity of their job postings.</p>
        </section>

        <section>
          <h2>6. Employer and Recruiter Responsibilities</h2>
          <p>If you are an employer or recruiter, you agree that:</p>
          <ul>
            <li>you will use candidate information only for genuine hiring purposes;</li>
            <li>you will not misuse, sell or distribute candidate data;</li>
            <li>you will comply with all applicable employment and data protection laws.</li>
          </ul>
          <p>JobsOsmo may suspend or permanently block employers who misuse candidate information.</p>
        </section>

        <section>
          <h2>7. Content and User Submissions</h2>
          <p>You retain ownership of the information and content you submit on the platform.</p>
          <p>However, by uploading content (including resumes, profiles, and job postings), you grant JobsOsmo a non-exclusive, royalty-free right to store, display, and process such content solely for providing and improving our services.</p>
        </section>

        <section>
          <h2>8. Data and Privacy</h2>
          <p>Your use of the platform is also governed by our <Link href="/privacy-policy">Privacy Policy</Link>.</p>
          <p>By using JobsOsmo, you consent to the collection and use of your information in accordance with our Privacy Policy.</p>
        </section>

        <section>
          <h2>9. Platform Availability</h2>
          <p>We strive to keep JobsOsmo available at all times.</p>
          <p>However, we do not guarantee uninterrupted or error-free access and may suspend or restrict access for maintenance, security or operational reasons.</p>
        </section>

        <section>
          <h2>10. Intellectual Property</h2>
          <p>All website content including design, logos, software, text and graphics on JobsOsmo are owned by or licensed to us.</p>
          <p>You may not copy, reproduce, distribute or commercially exploit any part of the platform without our prior written consent.</p>
        </section>

        <section>
          <h2>11. Third-Party Links</h2>
          <p>JobsOsmo may contain links to third-party websites or services.</p>
          <p>We are not responsible for the content, policies or practices of any third-party platforms.</p>
        </section>

        <section>
          <h2>12. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, JobsOsmo shall not be liable for:</p>
          <ul>
            <li>any hiring decisions made by employers;</li>
            <li>any losses arising from reliance on job listings or candidate profiles;</li>
            <li>any indirect, incidental or consequential damages.</li>
          </ul>
          <p>All hiring interactions and employment relationships are strictly between job seekers and employers.</p>
        </section>

        <section>
          <h2>13. Termination</h2>
          <p>We reserve the right to suspend or terminate your access to the platform at any time, without notice, if you violate these Terms or misuse the platform.</p>
        </section>

        <section>
          <h2>14. Changes to These Terms</h2>
          <p>We may update these Terms from time to time.</p>
          <p>Any changes will be posted on this page, and continued use of the platform after such updates constitutes your acceptance of the revised Terms.</p>
        </section>

        <section>
          <h2>15. Governing Law and Jurisdiction</h2>
          <p>These Terms shall be governed by and interpreted in accordance with the laws of India.</p>
          <p>All disputes shall be subject to the exclusive jurisdiction of the courts of India.</p>
        </section>

        <section>
          <h2>16. Contact Us</h2>
          <p>If you have any questions regarding these Terms and Conditions, you may contact us at:</p>
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
