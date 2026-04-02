import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';

export const useApplicationStatus = (candidateId, jobId) => {
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { authState } = useContext(AuthContext);

  useEffect(() => {
    if (candidateId && jobId) {
      setLoading(true);
      fetchApplicationStatus(candidateId, jobId);
    } else {
      // Guest users or missing data -> no status to fetch
      setLoading(false);
      setApplicationStatus(null);
    }
  }, [candidateId, jobId, authState.accessToken]);

  const fetchApplicationStatus = async (candidateId, jobId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_JOB_APPLICATION_URL}?candidateId=${candidateId}&jobId=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        setApplicationStatus(data.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching application status:', error);
      setLoading(false);
    }
  };
  // console.log(applicationStatus)
  return { applicationStatus, loading };
};
