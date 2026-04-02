import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

function page() {
  return (
    <div className='success-page'>
      <div className="inners">
        <div className="image-w">
          <Image src='/img/success-creative.png' width={500} height={500} alt="graphic" />
        </div>
        <div className='heads'>Application submitted!</div>
        <div className="subheads">You can check your status anytime on the status tab</div>
        <Link
          className="comm-cta fill-blue"
          href={`/explore-jobs`}
          >
          Explore More Jobs
        </Link>
      </div>
    </div>
  )
}

export default page
