import React from 'react'
import Link from 'next/link'
import { capture } from '@/app/lib/analytics/posthog';

const JobCard = ({ data, applicationStatus, saved = false, onToggleSave, onOpen }) => {

  const getPostedDateText = (dateString) => {
    const postDate = new Date(dateString);
    const currentDate = new Date();

    const postDateStartOfDay = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate());
    const currentDateStartOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    const timeDifference = currentDateStartOfDay - postDateStartOfDay;
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    if (daysDifference > 30) {
      return "Posted over a month ago";
    } else if (daysDifference === 0) {
      const hoursDifference = Math.floor((currentDate - postDate) / (1000 * 60 * 60));
      if (hoursDifference < 1) {
        return "Posted just now";
      } else if (hoursDifference === 1) {
        return "Posted 1 hour ago";
      } else {
        return `Posted ${hoursDifference} hours ago`;
      }
    } else if (daysDifference === 1) {
      return "Posted yesterday";
    } else {
      return `Posted ${daysDifference} days ago`;
    }
  };

  const isJobWithinWeek = (dateString) => {
    const postDate = new Date(dateString);
    const currentDate = new Date();
    const timeDifference = currentDate - postDate;
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return daysDifference < 7;
  };

  return (
    <div key={data._id} className="job-card-p">
      <Link
        key={data._id}
        href={`/explore-jobs/${data._id}`}
        onClick={() => {
          capture('job_opened', { job_id: data._id, source: 'job_card' });
          onOpen && onOpen(data._id);
        }}
      >
        <div className="top">
          {/* Save/Bookmark button */}
          <button
            type="button"
            className={`save-btn ${saved ? 'active' : ''}`}
            aria-label={saved ? 'Unsave job' : 'Save job'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave && onToggleSave();
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {/* Outline (inactive) */}
            <svg className="bk-outline" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M6 3h12a1 1 0 0 1 1 1v16.5a.5.5 0 0 1-.79.407L12 16.5l-6.21 4.407A.5.5 0 0 1 5 20.5V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" fill="none" />
            </svg>
            {/* Filled (active) */}
            <svg className="bk-fill" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M6 5c0-1.105.895-2 2-2h8c1.105 0 2 .895 2 2v13l-6-2.7L6 18V5Z" fill="currentColor" />
            </svg>
          </button>
          <h2>{data.name}</h2>
          <div className="bar-1">
            {data.location} | {data.workType}
          </div>
          <div className="bar-2">
            <p>{data.jobType}</p>
          </div>
          {(() => {
            const hasCtc = typeof data.minAnnualCtc === 'number' && typeof data.maxAnnualCtc === 'number';
            const hasExpRange = typeof data.minExperienceLevel === 'number' && typeof data.maxExperienceLevel === 'number';
            const expLabel = hasExpRange ? `${data.minExperienceLevel}–${data.maxExperienceLevel} yrs` : (data.experience || null);
            const hasExp = hasExpRange || (typeof expLabel === 'string' && expLabel.trim());
            if (!hasCtc && !hasExp) return null;
            const parts = [];
            if (hasCtc) parts.push(`₹ ${data.minAnnualCtc}L – ${data.maxAnnualCtc}L`);
            if (hasExp) parts.push(expLabel);
            return (
              <div className="bar-ctc-exp">
                {parts.join(' | ')}
              </div>
            );
          })()}
          <div className="bar-3" dangerouslySetInnerHTML={{ __html: data.jobDescription.shortDescription }}>
          </div>
        </div>
        <div className="bottom">
          {applicationStatus ? (
            <div className="tag-z applied">
              APPLIED
            </div>
          ) : isJobWithinWeek(data.updatedAt) ? (
            <div className="tag-z">
              NEW
            </div>
          ) : null}
          <div className="date-z">
            {getPostedDateText(data.updatedAt)}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default JobCard
