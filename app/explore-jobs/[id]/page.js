'use client'

import { useState, useEffect, useContext, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link';

import JobCard from '@/app/components/UI/JobCard';
import Loader from '@/app/components/UI/Loader'
import LoaderSmall from '@/app/components/UI/LoaderSmall'
import { AuthContext } from '@/app/context/AuthContext';
import { useApplicationStatus } from '@/app/hooks/useApplicationStatus';
import { capture } from '@/app/lib/analytics/posthog';

const JobDetail = () => {
  const pathname = usePathname()
  const router = useRouter();
  const idHash = pathname.split('/').pop();
  const [job, setJob] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { authState, updateUser } = useContext(AuthContext);
  const isGuest = !(authState?.accessToken && authState?.user?._id);

  const { applicationStatus, loading: statusLoading } = useApplicationStatus(
    authState.user?._id,
    job?.id
  );

  const getStatusStyle = (status, jobStatus) => {
    let baseStyle = '';
    switch (status) {
      case 'PENDING_REVIEW':
        baseStyle = 'pending'
        break;
      case 'NOT_A_MATCH':
        baseStyle = 'not-a-match'
        break;
      case 'IN_REVIEW':
        baseStyle = 'in-review'
        break;
      case 'HIRED':
        baseStyle = 'hired'
        break;
      case 'NOT_SELECTED':
        baseStyle = 'not-selected'
        break;
      default:
        baseStyle = 'pending'
    }
    return jobStatus === 'CLOSED' ? `${baseStyle} job-closed` : baseStyle;
  };

  const toggleSaveJob = useCallback(async (jobId) => {
    if (isGuest) {
      router.push('/sign-in');
      return;
    }

    try {
      const current = Array.isArray(authState.user?.savedJobIds) ? authState.user.savedJobIds : [];
      const isSavedNow = current.includes(jobId);
      const nextSaved = isSavedNow ? current.filter(id => id !== jobId) : [...current, jobId];
      // optimistic update on auth context (source of truth)
      if (authState.user?._id) {
        updateUser({ ...authState.user, savedJobIds: nextSaved });
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/candidates/${authState.user._id}/save-job`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobIds: nextSaved })
      });

      if (!response.ok) {
        throw new Error('Failed to update saved jobs');
      }

      // Server is source of truth; try to read savedJobIds from response if provided
      try {
        const data = await response.json();
        const serverIds = data?.savedJobIds || data?.data?.savedJobIds;
        if (Array.isArray(serverIds) && authState.user?._id) {
          updateUser({ ...authState.user, savedJobIds: serverIds });
        }
      } catch (_) {
        // ignore JSON parse errors; keep optimistic state
      }
    } catch (error) {
      console.error('❌ Error toggling saved job:', error);
      // revert on failure
      const current = Array.isArray(authState.user?.savedJobIds) ? authState.user.savedJobIds : [];
      const wasSaved = current.includes(jobId);
      const reverted = wasSaved ? current.filter(id => id !== jobId) : [...current, jobId];
      if (authState.user?._id) {
        updateUser({ ...authState.user, savedJobIds: reverted });
      }
    }
  }, [isGuest, authState.user, authState.accessToken, updateUser, router]);

  useEffect(() => {
    const run = async () => {
      if (!idHash || authState.loading) return;

      // If guest, allow viewing only if job is in the guest list (latest 10 ACTIVE)
      if (isGuest) {
        try {
          const resp = await fetch(`${process.env.NEXT_PUBLIC_JOB_URL}?page=1&pageSize=10&status=ACTIVE`, {
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await resp.json();
          const allowed = (data?.data || []).some(j => j._id === idHash);
          if (!allowed) {
            router.push('/sign-in');
            return;
          }
        } catch (e) {
          console.warn('Guest allowlist check failed due to network error; allowing view by default.');
          // Do not redirect on network error; allow view
        }
      }

      const headers = isGuest ? { 'Content-Type': 'application/json' } : {
        'Authorization': `Bearer ${authState.accessToken}`,
        'Content-Type': 'application/json'
      };
      fetch(`${process.env.NEXT_PUBLIC_JOB_URL}/${idHash}`, { headers })
        .then(response => response.json())
        .then(data => {
          setJob(data);
          capture('job_detail_viewed', { job_id: idHash, is_guest: Boolean(isGuest) });
        })
        .catch(error => console.error('Error fetching job details:', error));
    }
    run();
  }, [idHash, authState.loading, authState.accessToken, isGuest, router]);

  useEffect(() => {
    if (job) {
      const headers = isGuest ? { 'Content-Type': 'application/json' } : {
        'Authorization': `Bearer ${authState.accessToken}`,
        'Content-Type': 'application/json'
      };
      fetch(`${process.env.NEXT_PUBLIC_JOB_URL}?clientId=${job.clientId}`, { headers })
        .then(response => response.ok ? response.json() : Promise.reject(new Error('Failed to fetch related jobs')))
        .then(data => {
          const filteredJobs = (data?.data || []).filter(j => j._id !== job._id && j.status === 'ACTIVE');
          setRelatedJobs(filteredJobs);
        })
        .catch(error => {
          console.error('Error fetching related jobs:', error);
          setRelatedJobs([]);
        });
    }
  }, [job, isGuest, authState.accessToken]);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!(job && job.location)) return;

      const rawLocation = (job.location || '').trim();
      const firstToken = rawLocation.split(/[\/,|-]/)[0]?.trim() || rawLocation;

      const headers = isGuest ? { 'Content-Type': 'application/json' } : {
        'Authorization': `Bearer ${authState.accessToken}`,
        'Content-Type': 'application/json'
      };

      try {
        // Try exact location
        let results = [];
        const exactUrl = `${process.env.NEXT_PUBLIC_JOB_URL}?page=1&pageSize=20&status=ACTIVE&location=${encodeURIComponent(rawLocation)}`;
        const exactResp = await fetch(exactUrl, { headers });
        if (exactResp.ok) {
          const exactData = await exactResp.json();
          results = (exactData?.data || []).filter(
            j => j._id !== job._id && j.clientId !== job.clientId && j.status === 'ACTIVE'
          );
        }

        // Fallback to first token if needed
        if (results.length === 0 && firstToken && firstToken !== rawLocation) {
          const tokenUrl = `${process.env.NEXT_PUBLIC_JOB_URL}?page=1&pageSize=20&status=ACTIVE&location=${encodeURIComponent(firstToken)}`;
          const tokenResp = await fetch(tokenUrl, { headers });
          if (tokenResp.ok) {
            const tokenData = await tokenResp.json();
            results = (tokenData?.data || []).filter(
              j => j._id !== job._id && j.clientId !== job.clientId && j.status === 'ACTIVE'
            );
          }
        }

        setSimilarJobs(results);
      } catch (e) {
        setSimilarJobs([]);
      }
    };

    fetchSimilar();
  }, [job, authState.accessToken, isGuest]);

  if (!job) return <Loader />;

  return (
    <div className="job-detail-p">
      {console.log(job)}
      <div className="spotlight-bar container-pad">
        <div className="left">
          <h4><span>#{job.client.code}</span></h4>
          <h1>{job.name}</h1>
        </div>
        <div className="right">
          <div className="image-w">
            {statusLoading ? (
              <LoaderSmall />
            ) : (!isGuest && applicationStatus) ? (
              <span className={`status-badge ${getStatusStyle(applicationStatus.status, applicationStatus.jobStatus)}`}>
                {applicationStatus.jobStatus === 'CLOSED' ? 'CLOSED' : applicationStatus.status.replace(/_/g, ' ')}
              </span>
            ) : (
              isGuest ? (
                <button className="comm-cta" onClick={() => { capture('apply_clicked_guest', { job_id: idHash, source: 'job_detail_header' }); setShowJoinModal(true); }}>Apply Now</button>
              ) : (
                <Link
                  className="comm-cta"
                  href={`/explore-jobs/${idHash}/apply`}
                >
                  Apply Now
                </Link>
              )
            )}
          </div>
        </div>
      </div>
      <div className="details-zs container-pad">
        <div className="job-header">
          <ul className="job-info">
            <li className='job-infor-li'>
              <div className='heads'>Job Type</div>
              <div className="datas">{job.jobType}</div>
            </li>
            <li className='job-infor-li'>
              <div className='heads'>Experience</div>
              <div className="datas">{
                typeof job.minExperienceLevel === 'number' && typeof job.maxExperienceLevel === 'number'
                  ? `${job.minExperienceLevel} - ${job.maxExperienceLevel} Years`
                  : job.experience
              }</div>
            </li>
            <li className='job-infor-li'>
              <div className='heads'>Location</div>
              <div className="datas">{job.location}</div>
            </li>
            <li className='job-infor-li'>
              <div className='heads'>Work Type</div>
              <div className="datas">{job.workType}</div>
            </li>
            <li className='job-infor-li'>
              <div className='heads'>Working Days</div>
              <div className="datas">{job.workingDays}</div>
            </li>
            <li className='job-infor-li'>
              <div className='heads'>CTC Range</div>
              <div className="datas">{job.minAnnualCtc}L - {job.maxAnnualCtc}L</div>
            </li>
          </ul>

          {(job.recruiterInfoVisibility?.isEmailVisible || job.recruiterInfoVisibility?.isPhoneVisible || job.recruiterInfoVisibility?.isLinkedInVisible) &&
            <div className="recruiter-info-w">
              <div className="heads">
                Recruiter Info
              </div>
              <ul className="infow-a">
                {job.recruiterInfoVisibility?.isLinkedInVisible && job.recruiter?.socialUrls?.linkedin &&
                  <li className="infoa">
                    <Link href={job.recruiter.socialUrls.linkedin} target='_blank'>LinkedIn</Link>
                  </li>
                }
                {job.recruiterInfoVisibility?.isEmailVisible && job.recruiter?.email &&
                  <li className="infoa">
                    <Link href={`mailto:${job.recruiter.email}`} target='_blank'>{job.recruiter.email}</Link>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <div className="job-text-deets">
          {job.jobDescription.companyOverview &&
            <div className="breaks">
              <h2>Company Overview</h2>
              <div className="text-aq" dangerouslySetInnerHTML={{ __html: job.jobDescription.companyOverview }}></div>
            </div>
          }
          {job.jobDescription.whoLookingFor &&
            <div className="breaks">
              <h2>Who We Are Looking For</h2>
              <div className="text-aq" dangerouslySetInnerHTML={{ __html: job.jobDescription.whoLookingFor }}></div>
            </div>
          }
          {job.jobDescription.responsibilities &&
            <div className="breaks">
              <h2>Responsibilities</h2>
              <div className="text-aq" dangerouslySetInnerHTML={{ __html: job.jobDescription.responsibilities }}></div>
            </div>
          }
          {job.jobDescription.qualifications &&
            <div className="breaks">
              <h2>Qualifications</h2>
              <div className="text-aq" dangerouslySetInnerHTML={{ __html: job.jobDescription.qualifications }}></div>
            </div>
          }
          {job.skills && Array.isArray(job.skills) && job.skills.length > 0 &&
            <div className="breaks">
              <h2>Required Skills</h2>
              <div className="text-aq">
                <ul>
                  {job.skills.map((skill, index) => (
                    <li key={index}>{skill.trim()}</li>
                  ))}
                </ul>
              </div>
            </div>
          }
          {job.jobDescription.additionalInfo &&
            <div className="breaks">
              <h2>Additional Info</h2>
              <div className="text-aq" dangerouslySetInnerHTML={{ __html: job.jobDescription.additionalInfo }}></div>
            </div>
          }
        </div>

      </div>

      <div className="cta-wrap-sq container-pad">
        {statusLoading ? (
          ''
        ) : (!isGuest && applicationStatus) ? (
          ''
        ) : (
          isGuest ? (
            <button className="comm-cta" onClick={() => { capture('apply_clicked_guest', { job_id: idHash, source: 'job_detail_footer' }); setShowJoinModal(true); }}>Apply Now</button>
          ) : (
            <Link
              className="comm-cta"
              href={`/explore-jobs/${idHash}/apply`}
            >
              Apply Now
            </Link>
          )
        )}
        <div className="go-back-cta">
          <Link href='/explore-jobs'>
            Back to Search Results
          </Link>
        </div>
      </div>

      {!isGuest && relatedJobs.length > 0 &&
        <div className="related-jobs container-pad">
          <div className="heads">
            Other job openings at this company
          </div>
          <div className="listing-sz">
            {relatedJobs.map((relatedJob, index) => (
              <JobCard
                key={index}
                data={relatedJob}
                saved={Boolean((authState.user?.savedJobIds || []).includes(relatedJob._id))}
                onToggleSave={() => toggleSaveJob(relatedJob._id)}
              />
            ))}
          </div>
        </div>
      }

      {!isGuest && similarJobs.length > 0 &&
        <div className="similar-jobs container-pad">
          <div className="heads">
            Other jobs in {job.location}
          </div>
          <div className="listing-sz">
            {similarJobs.map((similarJob, index) => (
              <JobCard
                key={index}
                data={similarJob}
                saved={Boolean((authState.user?.savedJobIds || []).includes(similarJob._id))}
                onToggleSave={() => toggleSaveJob(similarJob._id)}
              />
            ))}
          </div>
        </div>
      }

      {showJoinModal && (
        <div className="join-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="join-modal" onClick={(e) => e.stopPropagation()}>
            <div className="title">Sign up in Seconds!</div>
            <div className="subtitle">Your application is just a few steps away.</div>
            <div className="actions">
              <Link className="comm-cta fill-blue" href="/sign-in">Sign In</Link>
              <Link className="comm-cta fill-blue" href="/sign-up">Create Account</Link>
            </div>
            <div className="back-link">
              <Link href="/explore-jobs">← Back to Explore Jobs</Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobDetail;
