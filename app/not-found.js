import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="onboard-page">
      <div className="inner">
        <div className="main-cont">
          <div className="not-found-content">
            <h1>Page not found</h1>
            <p>The page you're looking for doesn't exist or has been moved.</p>
            <Link href="/explore-jobs" className="comm-cta fill-blue">
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
