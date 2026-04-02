'use client'

import React, { useEffect, useState, useContext } from 'react'
import Loader from '@/app/components/UI/Loader'
import { AuthContext } from '@/app/context/AuthContext'
import Link from 'next/link'

function StatusPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const { authState } = useContext(AuthContext)

  useEffect(() => {
    if (authState.user?._id) {
      // console.log(authState.user?._id)
      fetchApplications(authState.user._id)
    }
  }, [authState.user])

  const fetchApplications = async (candidateId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/job-applications?candidateId=${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setApplications(data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching applications:', error)
      setLoading(false)
    }
  }

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
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return <Loader/>
  }

  return (
    <div className="status-page">
      <div className="spotlight-bar container-pad">
        <div className="content">
          <h1>Status</h1>
          <h4>View the status of all the jobs you have applied to with Osmo.</h4>
        </div>
      </div>

      <div className="applications-list container-pad">
        <div className="applications-table">
          <div className="table-header">
            <div className="th">Date Applied</div>
            <div className="th">Job Title</div>
            <div className="th">Status</div>
            <div className="th">Recruiter</div>
          </div>
          {applications.map((application) => (
            <div key={application._id} className="table-row">
              <div className="td">{formatDate(application.createdAt)}</div>
              <div className="td"><Link href={`/explore-jobs/${application.jobId}`}>{application.jobName} (#{application.jobId.slice(-4)})</Link></div>
              <div className="td">
                <span className={`status-badge ${getStatusStyle(application.status, application.jobStatus)}`}>
                  {application.jobStatus === 'CLOSED' ? 'CLOSED' : application.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="td">{application.assignedTo?.name || 'Unassigned'}</div>
            </div>
          ))}
        </div>

        <div className="applications-cards">
          {applications.map((application) => (
            <div key={application._id} className="application-card">
              <div className="card-content">
                <div className="field">
                  <label>Date Applied:</label>
                  <span>{formatDate(application.createdAt)}</span>
                </div>

                <div className="field">
                  <label>Job Title:</label>
                  <span><Link href={`/explore-jobs/${application.jobId}`}>{application.jobName} (#{application.jobId.slice(-4)})</Link></span>
                </div>

                <div className="field">
                  <label>Status:</label>
                  <span className={`status-badge ${getStatusStyle(application.status, application.jobStatus)}`}>
                    {application.jobStatus === 'CLOSED' ? 'CLOSED' : application.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="field">
                  <label>Recruiter:</label>
                  <span>{application.assignedTo?.name || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatusPage
