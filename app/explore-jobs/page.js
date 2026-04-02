'use client'

import React, { useState, useEffect, useRef, useContext, Suspense, useReducer, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { AuthContext } from '@/app/context/AuthContext';
import { capture } from '@/app/lib/analytics/posthog';
import JobCard from '../components/UI/JobCard';
import OverlayDropdown from '../components/UI/OverlayDropdown';
import Loader from '@/app/components/UI/Loader'
import RangeSlider from '../components/UI/RangeSlider'

// Action types for reducer
const FILTER_ACTIONS = {
  SET_FILTERS_FROM_URL: 'SET_FILTERS_FROM_URL',
  UPDATE_TEMP_SELECTION: 'UPDATE_TEMP_SELECTION',
  UPDATE_TEMP_RANGE: 'UPDATE_TEMP_RANGE',
  APPLY_FILTERS: 'APPLY_FILTERS',
  REMOVE_FILTER: 'REMOVE_FILTER',
  CLEAR_ALL_FILTERS: 'CLEAR_ALL_FILTERS',
  CLEAR_FILTER_TYPE: 'CLEAR_FILTER_TYPE',
  RESET_TEMP_TO_APPLIED: 'RESET_TEMP_TO_APPLIED'
};

// Reducer for filter state management
const filterReducer = (state, action) => {
  switch (action.type) {
    case FILTER_ACTIONS.SET_FILTERS_FROM_URL:
      return {
        ...state,
        applied: action.payload,
        temp: action.payload
      };

    case FILTER_ACTIONS.UPDATE_TEMP_SELECTION:
      const { filterType, item } = action.payload;
      const currentTemp = [...state.temp[filterType]];
      const newTemp = currentTemp.includes(item)
        ? currentTemp.filter(i => i !== item)
        : [...currentTemp, item];

      return {
        ...state,
        temp: {
          ...state.temp,
          [filterType]: newTemp
        }
      };

    case FILTER_ACTIONS.UPDATE_TEMP_RANGE:
      return {
        ...state,
        temp: {
          ...state.temp,
          ...action.payload
        }
      };

    case FILTER_ACTIONS.APPLY_FILTERS:
      return {
        ...state,
        applied: { ...state.temp }
      };

    case FILTER_ACTIONS.REMOVE_FILTER:
      const { filterType: removeType, item: removeItem } = action.payload;
      const updatedFilters = {
        ...state.applied,
        [removeType]: state.applied[removeType].filter(i => i !== removeItem)
      };
      return {
        ...state,
        applied: updatedFilters,
        temp: updatedFilters
      };

    case FILTER_ACTIONS.CLEAR_ALL_FILTERS:
      const emptyFilters = { roleType: [], jobLocation: [], workType: [], experience: [], minAnnualCtc: null, maxAnnualCtc: null, minExperienceLevel: null, maxExperienceLevel: null };
      return {
        ...state,
        applied: emptyFilters,
        temp: emptyFilters
      };

    case FILTER_ACTIONS.CLEAR_FILTER_TYPE:
      // Special handling for range filters
      if (action.payload === 'ctc') {
        const clearedCtc = {
          ...state.applied,
          minAnnualCtc: null,
          maxAnnualCtc: null
        };
        return { ...state, applied: clearedCtc, temp: clearedCtc };
      }
      if (action.payload === 'experiencerange') {
        const clearedExp = {
          ...state.applied,
          minExperienceLevel: null,
          maxExperienceLevel: null
        };
        return { ...state, applied: clearedExp, temp: clearedExp };
      }
      const clearedFilters = {
        ...state.applied,
        [action.payload]: []
      };
      return {
        ...state,
        applied: clearedFilters,
        temp: clearedFilters
      };

    case FILTER_ACTIONS.RESET_TEMP_TO_APPLIED:
      return {
        ...state,
        temp: { ...state.applied }
      };

    default:
      return state;
  }
};

const JobsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authState, updateUser } = useContext(AuthContext);
  const isGuest = !authState?.accessToken;

  // Filter state using reducer
  const [filterState, dispatchFilter] = useReducer(filterReducer, {
    applied: { roleType: [], jobLocation: [], workType: [], experience: [], minAnnualCtc: null, maxAnnualCtc: null, minExperienceLevel: null, maxExperienceLevel: null },
    temp: { roleType: [], jobLocation: [], workType: [], experience: [], minAnnualCtc: null, maxAnnualCtc: null, minExperienceLevel: null, maxExperienceLevel: null }
  });

  // Other state
  const [jobs, setJobs] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    roleType: { options: [] },
    jobLocation: { options: [] },
    workType: { options: [] },
    experience: { options: [] }
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatuses, setApplicationStatuses] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false); // UI only for now
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);
  const [drawerOpenSections, setDrawerOpenSections] = useState({ role: false, location: false, workType: false, salary: false, experience: false });
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    isLoadingMore: false,
    totalPages: 0,
    totalJobs: 0
  });

  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isInitialMount = useRef(true);
  const currentFiltersRef = useRef(filterState.applied);
  const appliedRecommendedRef = useRef(false);
  const prevFiltersBeforeRecRef = useRef(null);
  // Saved jobs are read directly from authState.user.savedJobIds

  // Memoized filter string for URL updates
  const filterString = useMemo(() => {
    const params = new URLSearchParams();
    if (filterState.applied.roleType.length > 0) {
      params.set('roleType', filterState.applied.roleType.join(','));
    }
    if (filterState.applied.jobLocation.length > 0) {
      params.set('jobLocation', filterState.applied.jobLocation.join(','));
    }
    // Work Type moved to drawer but still part of state/URL
    if (filterState.applied.workType.length > 0) {
      params.set('workType', filterState.applied.workType.join(','));
    }
    if (filterState.applied.experience.length > 0) {
      params.set('experience', filterState.applied.experience.join(','));
    }
    if (filterState.applied.minAnnualCtc != null) params.set('minAnnualCtc', String(filterState.applied.minAnnualCtc));
    if (filterState.applied.maxAnnualCtc != null) params.set('maxAnnualCtc', String(filterState.applied.maxAnnualCtc));
    if (filterState.applied.minExperienceLevel != null) params.set('minExperienceLevel', String(filterState.applied.minExperienceLevel));
    if (filterState.applied.maxExperienceLevel != null) params.set('maxExperienceLevel', String(filterState.applied.maxExperienceLevel));
    if (searchTerm && searchTerm.trim().length > 0) params.set('search', searchTerm.trim());
    if (isRecommended) params.set('recommended', '1');
    return params.toString();
  }, [filterState.applied, searchTerm, isRecommended]);

  // Update URL when filters change
  useEffect(() => {
    const newURL = filterString ? `?${filterString}` : '/explore-jobs';
    router.replace(newURL, { scroll: false });
  }, [filterString, router]);

  // Initialize filters from URL
  useEffect(() => {
    const roleTypeParam = searchParams.get('roleType');
    const jobLocationParam = searchParams.get('jobLocation');
    const workTypeParam = searchParams.get('workType');
    const experienceParam = searchParams.get('experience');
    const minCtcParam = searchParams.get('minAnnualCtc');
    const maxCtcParam = searchParams.get('maxAnnualCtc');
    const minExpParam = searchParams.get('minExperienceLevel');
    const maxExpParam = searchParams.get('maxExperienceLevel');
    const qParam = searchParams.get('search');
    const recParam = searchParams.get('recommended');

    const urlFilters = {
      roleType: roleTypeParam ? roleTypeParam.split(',').filter(Boolean) : [],
      jobLocation: jobLocationParam ? jobLocationParam.split(',').filter(Boolean) : [],
      workType: workTypeParam ? workTypeParam.split(',').filter(Boolean) : [],
      experience: experienceParam ? experienceParam.split(',').filter(Boolean) : [],
      minAnnualCtc: minCtcParam ? Number(minCtcParam) : null,
      maxAnnualCtc: maxCtcParam ? Number(maxCtcParam) : null,
      minExperienceLevel: minExpParam ? Number(minExpParam) : null,
      maxExperienceLevel: maxExpParam ? Number(maxExpParam) : null
    };

    dispatchFilter({
      type: FILTER_ACTIONS.SET_FILTERS_FROM_URL,
      payload: urlFilters
    });

    if (qParam) setSearchTerm(qParam);
    if (recParam === '1') setIsRecommended(true);
  }, [searchParams]);

  // Cleanup function for aborting requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle outside clicks and scrolling
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const isClickOnFilterButton = event.target.closest('.filter-name-s');

      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !isClickOnFilterButton) {
        setOpenDropdown(null);
        dispatchFilter({ type: FILTER_ACTIONS.RESET_TEMP_TO_APPLIED });
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [openDropdown]);

  // Reset temp selections when dropdown opens
  useEffect(() => {
    if (!openDropdown) return;
    // Sync temp with currently applied once when opening
    dispatchFilter({ type: FILTER_ACTIONS.RESET_TEMP_TO_APPLIED });
    // Initialize sensible defaults if unset in APPLIED so Apply works without interaction
    if (openDropdown === 'ctc') {
      const a = filterState.applied;
      if (a.minAnnualCtc == null && a.maxAnnualCtc == null) {
        dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minAnnualCtc: 0, maxAnnualCtc: 5 } });
      }
    }
    if (openDropdown === 'experience') {
      const a = filterState.applied;
      if (a.minExperienceLevel == null && a.maxExperienceLevel == null) {
        dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minExperienceLevel: 0, maxExperienceLevel: 3 } });
      }
    }
  }, [openDropdown, filterState.applied]);

  // Memoized fetch functions
  const fetchSettings = useCallback(async () => {
    try {
      const settingsUrl = `${process.env.NEXT_PUBLIC_API_URL}/settings`;
      const response = await fetch(settingsUrl, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      const { roleType, jobLocation, workType, experienceLevel } = data.settings || {};

      setFilterOptions({
        roleType: roleType || { options: [] },
        jobLocation: jobLocation || { options: [] },
        workType: workType || { options: [] },
        experience: experienceLevel || { options: [] }
      });
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
    }
  }, [authState.accessToken]);

  const fetchJobs = useCallback(async (pageNum, filters = filterState.applied) => {
    try {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      let url = `${process.env.NEXT_PUBLIC_JOB_URL}?page=${pageNum}&pageSize=20&status=ACTIVE`;

      if (filters.roleType.length) {
        url += `&roleTypes=${filters.roleType.join(',')}`;
      }
      if (filters.jobLocation.length) {
        url += `&location=${filters.jobLocation.join(',')}`;
      }
      if (filters.workType.length) {
        url += `&workType=${filters.workType.join(',')}`;
      }
      if (filters.experience.length) {
        url += `&experience=${filters.experience.join(',')}`;
      }
      if (searchTerm && searchTerm.trim().length > 0) {
        const q = encodeURIComponent(searchTerm.trim());
        url += `&search=${q}`;
      }
      // Ensure API receives both min and max together in the expected bounds
      const hasCtcRange = filters.minAnnualCtc != null || filters.maxAnnualCtc != null;
      if (hasCtcRange) {
        const minCtc = Math.max(1, Number(filters.minAnnualCtc ?? 1));
        const maxCtc = Math.max(minCtc, Number(filters.maxAnnualCtc ?? minCtc));
        url += `&minAnnualCtc=${minCtc}&maxAnnualCtc=${maxCtc}`;
      }
      const hasExpRange = filters.minExperienceLevel != null || filters.maxExperienceLevel != null;
      if (hasExpRange) {
        const minExp = Math.max(0, Number(filters.minExperienceLevel ?? 0));
        const maxExp = Math.max(minExp, Number(filters.maxExperienceLevel ?? minExp));
        url += `&minExperienceLevel=${minExp}&maxExperienceLevel=${maxExp}`;
      }

      const headers = isGuest
        ? { 'Content-Type': 'application/json' }
        : { 'Authorization': `Bearer ${authState.accessToken}`, 'Content-Type': 'application/json' };

      // Snapshot current filters to validate on response
      const snapshot = JSON.stringify(filters);

      const response = await fetch(url, { headers, signal: abortControllerRef.current.signal });

      console.log('📡 Jobs API Response Status:', response.status, response.statusText);

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();

      // Drop results if filters changed mid-flight
      if (snapshot !== JSON.stringify(currentFiltersRef.current)) {
        return;
      }

      if (pageNum === 1) {
        setJobs(data.data || []);
      } else {
        setJobs(prev => {
          // Prevent duplicate jobs
          const existingIds = new Set(prev.map(job => job._id));
          const newJobs = (data.data || []).filter(job => !existingIds.has(job._id));
          return [...prev, ...newJobs];
        });
      }

      setPagination(prev => ({
        ...prev,
        hasMore: data.meta.page < data.meta.pages,
        isLoadingMore: false,
        totalPages: data.meta.pages,
        totalJobs: data.meta.total,
        page: pageNum
      }));

      if (pageNum === 1) {
        setLoading(false);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Error fetching jobs:', error);
        console.error('🔍 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setPagination(prev => ({
          ...prev,
          isLoadingMore: false,
          hasMore: false
        }));
        if (pageNum === 1) {
          setLoading(false);
        }
      } else {
        console.log('🔄 Jobs API request was aborted');
      }
    }
  }, [authState.accessToken, filterState.applied, isGuest, searchTerm]);

  // Fetch only 10 recent jobs for guests
  const fetchGuestJobs = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const url = `${process.env.NEXT_PUBLIC_JOB_URL}?page=1&pageSize=10&status=ACTIVE`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal
      });
      if (!response.ok) throw new Error('Failed to fetch guest jobs');
      const data = await response.json();
      setJobs(data.data || []);
      setPagination(prev => ({ ...prev, page: 1, hasMore: false, totalPages: 1, totalJobs: data.meta?.total || (data.data?.length || 0) }));
      setLoading(false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Error fetching guest jobs:', error);
        setJobs([]);
        setLoading(false);
      }
    }
  }, []);

  const fetchApplicationStatuses = useCallback(async (userId) => {
    try {
      const applicationUrl = `${process.env.NEXT_PUBLIC_JOB_APPLICATION_URL}?candidateId=${userId}`;

      const response = await fetch(applicationUrl, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch application statuses');

      const data = await response.json();

      const statusMap = {};

      if (data.data) {
        data.data.forEach(application => {
          statusMap[application.jobId] = application;
        });
      }

      setApplicationStatuses(statusMap);
    } catch (error) {
      console.error('❌ Error fetching application statuses:', error);
    }
  }, [authState.accessToken]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      if (!authState.accessToken) {
        await fetchGuestJobs();
        return;
      }

      try {
        await fetchSettings();
        await fetchJobs(1);
        if (authState.user?._id) {
          await fetchApplicationStatuses(authState.user._id);
        }
      } catch (error) {
        console.error('Error in initial fetch:', error);
      }
    };

    fetchData();
  }, [authState.accessToken, fetchSettings, fetchJobs, fetchApplicationStatuses, authState.user?._id, fetchGuestJobs]);

  // No local saved state; rely on authState.user.savedJobIds

  // Handle filter changes
  useEffect(() => {
    if (authState.accessToken && !loading) {
      setPagination(prev => ({
        ...prev,
        page: 1,
        hasMore: true,
        isLoadingMore: false,
        totalPages: 0,
        totalJobs: 0
      }));
      fetchJobs(1);
    }
  }, [filterState.applied, authState.accessToken, fetchJobs, loading]);

  // Track applied filter changes (covers apply/clear/remove/reset/drawer toggles)
  useEffect(() => {
    if (!authState.accessToken || loading) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const a = filterState.applied || {};
    capture('jobs_filters_changed', {
      role_type_count: Array.isArray(a.roleType) ? a.roleType.length : 0,
      job_location_count: Array.isArray(a.jobLocation) ? a.jobLocation.length : 0,
      work_type_count: Array.isArray(a.workType) ? a.workType.length : 0,
      experience_label_count: Array.isArray(a.experience) ? a.experience.length : 0,
      min_annual_ctc: a.minAnnualCtc ?? null,
      max_annual_ctc: a.maxAnnualCtc ?? null,
      min_experience_level: a.minExperienceLevel ?? null,
      max_experience_level: a.maxExperienceLevel ?? null,
      is_recommended: Boolean(isRecommended),
      show_saved_only: Boolean(showSavedOnly),
      show_applied_only: Boolean(showAppliedOnly),
    });
  }, [authState.accessToken, filterState.applied, isRecommended, loading, showAppliedOnly, showSavedOnly]);

  // Debounce search term changes
  useEffect(() => {
    if (!authState.accessToken) return; // guests see latest 10 only
    const t = setTimeout(() => {
      if (!loading) {
        const query = (searchTerm || '').trim();
        capture('jobs_search_performed', {
          query_length: query.length,
          has_query: query.length > 0,
        });
        setPagination(prev => ({ ...prev, page: 1, hasMore: true, isLoadingMore: false }));
        fetchJobs(1);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Load more function
  const handleLoadMore = () => {
    if (pagination.hasMore && !pagination.isLoadingMore) {
      capture('jobs_load_more_clicked', { next_page: pagination.page + 1 });
      setPagination(prev => ({
        ...prev,
        isLoadingMore: true,
        page: prev.page + 1
      }));
    }
  };

  // Handle pagination changes
  useEffect(() => {
    if (pagination.page > 1) {
      fetchJobs(pagination.page);
    }
  }, [pagination.page, fetchJobs]);

  // Update current filters ref when filters change
  useEffect(() => {
    currentFiltersRef.current = filterState.applied;
  }, [filterState.applied]);

  // Apply recommended filters based on user profile
  const applyRecommended = useCallback(() => {
    if (isGuest) return;
    const user = authState.user || {};
    const recommendedFilters = {
      ...filterState.applied,
      roleType: Array.isArray(user.areaOfExpertise) ? user.areaOfExpertise.filter(Boolean) : [],
      // Use experience range from profile if present
      minExperienceLevel: typeof user.minExperienceLevel === 'number' ? user.minExperienceLevel : null,
      maxExperienceLevel: typeof user.maxExperienceLevel === 'number' ? user.maxExperienceLevel : null
    };
    // store previous filters before applying recommended
    prevFiltersBeforeRecRef.current = { ...filterState.applied };
    dispatchFilter({ type: FILTER_ACTIONS.SET_FILTERS_FROM_URL, payload: recommendedFilters });
    appliedRecommendedRef.current = true;
    capture('jobs_recommended_enabled');
  }, [authState.user, filterState.applied, isGuest]);

  useEffect(() => {
    if (isRecommended) {
      applyRecommended();
    } else {
      // restore previous filters if recommended was applied earlier
      if (appliedRecommendedRef.current) {
        const prev = prevFiltersBeforeRecRef.current;
        if (prev) {
          dispatchFilter({ type: FILTER_ACTIONS.SET_FILTERS_FROM_URL, payload: prev });
        }
        appliedRecommendedRef.current = false;
        prevFiltersBeforeRecRef.current = null;
      }
    }
  }, [isRecommended]);

  // Ensure accordions start closed whenever opening the drawer
  useEffect(() => {
    if (isDrawerOpen) {
      setDrawerOpenSections({ role: false, location: false, workType: false, salary: false, experience: false });
      // Initialize defaults for ranges if unset in APPLIED so Apply works without interaction
      const a = filterState.applied;
      if (a.minAnnualCtc == null && a.maxAnnualCtc == null) {
        dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minAnnualCtc: 0, maxAnnualCtc: 5 } });
      }
      if (a.minExperienceLevel == null && a.maxExperienceLevel == null) {
        dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minExperienceLevel: 0, maxExperienceLevel: 3 } });
      }
    }
  }, [isDrawerOpen, filterState.applied]);

  // Toggle save/unsave a job with optimistic UI
  const toggleSaveJob = useCallback(async (jobId) => {
    if (isGuest) {
      capture('job_save_clicked_guest', { job_id: jobId });
      router.push('/sign-in');
      return;
    }

    try {
      const current = Array.isArray(authState.user?.savedJobIds) ? authState.user.savedJobIds : [];
      const prevSaved = current;
      const isSavedNow = current.includes(jobId);
      const nextSaved = isSavedNow ? current.filter(id => id !== jobId) : [...current, jobId];
      capture(isSavedNow ? 'job_unsaved' : 'job_saved', { job_id: jobId, source: 'jobs_list' });
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
  }, [authState.accessToken, authState.user, isGuest, router, updateUser]);

  if (loading) {
    return <Loader/>
  }

  return (
    <div className="explore-jobs">
      <div className="spotlight-bar container-pad">
        <div className="left"><h1>Explore Jobs</h1></div>
        <div className="right">
          <div className="image-w">
            <Image src='/img/explore-spot.png' width={500} height={500} alt="graphic" />
          </div>
        </div>
      </div>
      <div className="jobs-listing-w container-pad">
        <div className="filters-w">
          {isGuest ? (
            <div className="guest-banner">
              <div className='text'>Showing latest 10 jobs. Sign in to view all, filter and apply.</div>
              <div className='actions'>
                <a className='comm-cta sm fill-blue' href='/sign-in'>Sign In</a>
                <a className='comm-cta sm fill-none' href='/sign-up'>Create Account</a>
              </div>
            </div>
          ) : (
          <>
          <div className="top-bars">
            <div className='filters-card'>
              <div className='filters first-row'>
                {/* Search */}
                <div className="filter-group search-group" style={{ flex: 1, minWidth: '280px' }}>
                  <div className="search-w">
                    {/* search icon */}
                    <svg className="search-icn" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="#98A2B3" strokeWidth="2"/>
                      <path d="M21 21l-4.35-4.35" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search jobs"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
                {/* Recommended toggle */}
                <div className="filter-group">
                  <label className={`filter-name-s pill${isRecommended ? ' active' : ''}`} style={{ cursor: isGuest ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isRecommended}
                      disabled={isGuest}
                      onChange={(e) => {
                        setIsRecommended(e.target.checked);
                        capture('jobs_recommended_toggled', { enabled: Boolean(e.target.checked) });
                      }}
                      style={{ marginRight: 8 }}
                    />
                    Recommended Jobs
                  </label>
                </div>
              </div>
              {/* Second row: Salary left, bookmark + All Filters right */}
              <div className='filters second-row'>
                <div className="filter-group">
                  <div
                    className={`filter-name-s pill ${openDropdown === 'roleType' ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'roleType' ? null : 'roleType')}
                  >
                    {`Role${filterState.applied.roleType?.length > 0 ? ` (${filterState.applied.roleType.length})` : ''}`}
                    <span className='arr-img'><Image src='/img/arrow-down.svg' alt='down' width={6} height={10}/></span>
                  </div>
                </div>
                {/* Experience */}
                <div className="filter-group">
                  <div
                    className={`filter-name-s pill ${openDropdown === 'experience' ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'experience' ? null : 'experience')}
                  >
                    Experience
                    <span className='arr-img'><Image src='/img/arrow-down.svg' alt='down' width={6} height={10}/></span>
                  </div>
                </div>
                {/* Location */}
                <div className="filter-group">
                  <div
                    className={`filter-name-s pill ${openDropdown === 'jobLocation' ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'jobLocation' ? null : 'jobLocation')}
                  >
                    {`Location${filterState.applied.jobLocation?.length > 0 ? ` (${filterState.applied.jobLocation.length})` : ''}`}
                    <span className='arr-img'><Image src='/img/arrow-down.svg' alt='down' width={6} height={10}/></span>
                  </div>
                </div>
                {/* Work Type */}
                <div className="filter-group">
                  <div
                    className={`filter-name-s pill ${openDropdown === 'workType' ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'workType' ? null : 'workType')}
                  >
                    {`Work Type${filterState.applied.workType?.length > 0 ? ` (${filterState.applied.workType.length})` : ''}`}
                    <span className='arr-img'><Image src='/img/arrow-down.svg' alt='down' width={6} height={10}/></span>
                  </div>
                </div>
                <div className="filter-group">
                  <div
                    className={`filter-name-s pill ${openDropdown === 'ctc' ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'ctc' ? null : 'ctc')}
                  >
                    Salary
                    <span className='arr-img'><Image src='/img/arrow-down.svg' alt='down' width={6} height={10}/></span>
                  </div>
                </div>
                <div className="filter-group">
                  <button
                    type="button"
                    className={`icon-btn ${showSavedOnly ? 'active' : ''}`}
                    onClick={() => {
                      setShowSavedOnly(v => {
                        const next = !v;
                        capture('jobs_saved_only_toggled', { enabled: Boolean(next) });
                        return next;
                      });
                    }}
                    aria-label="Saved Jobs"
                  >
                    {/* Outline (inactive) */}
                    <svg className="bk-outline" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M6 3h12a1 1 0 0 1 1 1v16.5a.5.5 0 0 1-.79.407L12 16.5l-6.21 4.407A.5.5 0 0 1 5 20.5V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
                    </svg>
                    {/* Filled (active) */}
                    <svg className="bk-fill" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M6 5c0-1.105.895-2 2-2h8c1.105 0 2 .895 2 2v13l-6-2.7L6 18V5Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <div className="filter-divider" aria-hidden="true" />
                <div className="filter-group">
                  <button type="button" className="filter-name-s pill" onClick={() => setIsDrawerOpen(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }} aria-hidden>
                      <path d="M3 6h18M6 12h12M9 18h6" stroke="#344054" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    All Filters
                    {/* <span className='arr-img'><Image src='/img/arrow-down.svg' alt='down' width={6} height={10}/></span> */}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bottom-bars">
            <div className="selected-filters-w">
              {filterState.applied.roleType.map(role => (
                <span key={`roleType-${role}`} className="selected-option">
                  {role}
                  <button onClick={() => dispatchFilter({
                    type: FILTER_ACTIONS.REMOVE_FILTER,
                    payload: { filterType: 'roleType', item: role }
                  })}>
                    <Image src='/img/remove-btn.svg' width={17} height={17} alt='close' />
                  </button>
                </span>
              ))}
              {filterState.applied.jobLocation.map(location => (
                <span key={`jobLocation-${location}`} className="selected-option">
                  {location}
                  <button onClick={() => dispatchFilter({
                    type: FILTER_ACTIONS.REMOVE_FILTER,
                    payload: { filterType: 'jobLocation', item: location }
                  })}>
                    <Image src='/img/remove-btn.svg' width={17} height={17} alt='close' />
                  </button>
                </span>
              ))}
              {filterState.applied.workType.map(workType => (
                <span key={`workType-${workType}`} className="selected-option">
                  {workType}
                  <button onClick={() => dispatchFilter({
                    type: FILTER_ACTIONS.REMOVE_FILTER,
                    payload: { filterType: 'workType', item: workType }
                  })}>
                    <Image src='/img/remove-btn.svg' width={17} height={17} alt='close' />
                  </button>
                </span>
              ))}
              {filterState.applied.minExperienceLevel != null && filterState.applied.maxExperienceLevel != null && (
                <span className="selected-option">
                  {`Exp: ${filterState.applied.minExperienceLevel}-${filterState.applied.maxExperienceLevel} yrs`}
                  <button onClick={() => dispatchFilter({ type: FILTER_ACTIONS.CLEAR_FILTER_TYPE, payload: 'experiencerange' })}>
                    <Image src='/img/remove-btn.svg' width={17} height={17} alt='close' />
                  </button>
                </span>
              )}
              {filterState.applied.minAnnualCtc != null && filterState.applied.maxAnnualCtc != null && (
                <span className="selected-option">
                  {`CTC: Rs. ${filterState.applied.minAnnualCtc}L - ${filterState.applied.maxAnnualCtc}L`}
                  <button onClick={() => dispatchFilter({ type: FILTER_ACTIONS.CLEAR_FILTER_TYPE, payload: 'ctc' })}>
                    <Image src='/img/remove-btn.svg' width={17} height={17} alt='close' />
                  </button>
                </span>
              )}
            </div>
            {openDropdown === 'roleType' && (
              <div ref={dropdownRef}>
                <OverlayDropdown
                  items={filterOptions.roleType.options || []}
                  selectedItems={filterState.temp.roleType || []}
                  toggleSelection={(item) => dispatchFilter({
                    type: FILTER_ACTIONS.UPDATE_TEMP_SELECTION,
                    payload: { filterType: 'roleType', item }
                  })}
                  applyFilters={() => {
                    dispatchFilter({ type: FILTER_ACTIONS.APPLY_FILTERS });
                    capture('jobs_filters_applied', { source: 'roleType_dropdown' });
                    setOpenDropdown(null);
                  }}
                  clearSelection={() => {
                    dispatchFilter({
                      type: FILTER_ACTIONS.CLEAR_FILTER_TYPE,
                      payload: 'roleType'
                    });
                    capture('jobs_filters_cleared', { filter_type: 'roleType', source: 'roleType_dropdown' });
                    setOpenDropdown(null);
                  }}
                />
              </div>
            )}
            {openDropdown === 'workType' && (
              <div ref={dropdownRef}>
                <OverlayDropdown
                  items={filterOptions.workType.options || []}
                  selectedItems={filterState.temp.workType || []}
                  toggleSelection={(item) => dispatchFilter({
                    type: FILTER_ACTIONS.UPDATE_TEMP_SELECTION,
                    payload: { filterType: 'workType', item }
                  })}
                  applyFilters={() => {
                    dispatchFilter({ type: FILTER_ACTIONS.APPLY_FILTERS });
                    capture('jobs_filters_applied', { source: 'workType_dropdown' });
                    setOpenDropdown(null);
                  }}
                  clearSelection={() => {
                    dispatchFilter({
                      type: FILTER_ACTIONS.CLEAR_FILTER_TYPE,
                      payload: 'workType'
                    });
                    capture('jobs_filters_cleared', { filter_type: 'workType', source: 'workType_dropdown' });
                    setOpenDropdown(null);
                  }}
                />
              </div>
            )}
            {openDropdown === 'jobLocation' && (
              <div ref={dropdownRef}>
                <OverlayDropdown
                  items={filterOptions.jobLocation.options || []}
                  selectedItems={filterState.temp.jobLocation || []}
                  toggleSelection={(item) => dispatchFilter({
                    type: FILTER_ACTIONS.UPDATE_TEMP_SELECTION,
                    payload: { filterType: 'jobLocation', item }
                  })}
                  applyFilters={() => {
                    dispatchFilter({ type: FILTER_ACTIONS.APPLY_FILTERS });
                    capture('jobs_filters_applied', { source: 'jobLocation_dropdown' });
                    setOpenDropdown(null);
                  }}
                  clearSelection={() => {
                    dispatchFilter({
                      type: FILTER_ACTIONS.CLEAR_FILTER_TYPE,
                      payload: 'jobLocation'
                    });
                    capture('jobs_filters_cleared', { filter_type: 'jobLocation', source: 'jobLocation_dropdown' });
                    setOpenDropdown(null);
                  }}
                />
              </div>
            )}
            {openDropdown === 'experience' && (
              <div ref={dropdownRef}>
                <div className="overlay-dropdown">
                  <div className="inner-z">
                    <RangeSlider
                      min={0}
                      max={20}
                      step={1}
                      valueMin={filterState.temp.minExperienceLevel ?? 0}
                      valueMax={filterState.temp.maxExperienceLevel ?? 10}
                      maxSpan={3}
                      formatValue={(v) => `${v} Years`}
                      ariaLabelMin="Minimum experience"
                      ariaLabelMax="Maximum experience"
                      onChange={({ min, max }) =>
                        dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minExperienceLevel: min, maxExperienceLevel: max } })
                      }
                    />
                    <small className="hint">You can select a maximum 3-year range.</small>

                    {/* <div className="ctc-inputs">
                      <label>
                        Min (Years)
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={1}
                          value={filterState.temp.minExperienceLevel ?? 0}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            const nextMin = Math.max(0, Math.min(20, isNaN(raw) ? 0 : raw));
                            let nextMax = filterState.temp.maxExperienceLevel ?? 20;
                            if (nextMin > nextMax) {
                              nextMax = nextMin;
                            }
                            dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minExperienceLevel: nextMin, maxExperienceLevel: nextMax } });
                          }}
                        />
                      </label>
                      <label>
                        Max (Years)
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={1}
                          value={filterState.temp.maxExperienceLevel ?? 20}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            let nextMax = Math.max(0, Math.min(20, isNaN(raw) ? 0 : raw));
                            let nextMin = filterState.temp.minExperienceLevel ?? 0;
                            if (nextMax < nextMin) {
                              nextMin = nextMax;
                            }
                            dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minExperienceLevel: nextMin, maxExperienceLevel: nextMax } });
                          }}
                        />
                      </label>
                      </div> */}
                      {/* <small className="hint"> Choose any experience range.</small> */}
                    <div className="ctas-q">
                      <button className='apply-it' onClick={() => { dispatchFilter({ type: FILTER_ACTIONS.APPLY_FILTERS }); capture('jobs_filters_applied', { source: 'experience_dropdown' }); setOpenDropdown(null); }}>Apply Filter(s)</button>
                      <button className='clear-it' onClick={() => { dispatchFilter({ type: FILTER_ACTIONS.CLEAR_FILTER_TYPE, payload: 'experiencerange' }); capture('jobs_filters_cleared', { filter_type: 'experience_range', source: 'experience_dropdown' }); setOpenDropdown(null); }}>Clear All</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {openDropdown === 'ctc' && (
              <div ref={dropdownRef}>
                <div className="overlay-dropdown">
                  <div className="inner-z">
                    <RangeSlider
                      min={0}
                      max={50}
                      step={1}
                      valueMin={filterState.temp.minAnnualCtc ?? 0}
                      valueMax={filterState.temp.maxAnnualCtc ?? 5}
                      maxSpan={5}
                      formatValue={(v) => `Rs. ${v}L`}
                      ariaLabelMin="Minimum annual CTC"
                      ariaLabelMax="Maximum annual CTC"
                      onChange={({ min, max }) =>
                        dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minAnnualCtc: min, maxAnnualCtc: max } })
                      }
                    />
                    <small className="hint">You can select a maximum 5L range.</small>

                    {/* <div className="ctc-inputs">
                      <label>
                        Min (L)
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step={1}
                          value={filterState.temp.minAnnualCtc ?? 0}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            const nextMin = Math.max(0, Math.min(50, isNaN(raw) ? 0 : raw));
                            let nextMax = filterState.temp.maxAnnualCtc ?? 50;
                            if (nextMin > nextMax) {
                              nextMax = nextMin;
                            }
                            dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minAnnualCtc: nextMin, maxAnnualCtc: nextMax } });
                          }}
                        />
                      </label>
                      <label>
                        Max (L)
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step={1}
                          value={filterState.temp.maxAnnualCtc ?? 50}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            let nextMax = Math.max(0, Math.min(50, isNaN(raw) ? 0 : raw));
                            let nextMin = filterState.temp.minAnnualCtc ?? 0;
                            if (nextMax < nextMin) {
                              nextMin = nextMax;
                            }
                            dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minAnnualCtc: nextMin, maxAnnualCtc: nextMax } });
                          }}
                        />
                      </label>
                      </div> */}
                      {/* <small className="hint">Choose any salary range.</small> */}
                    <div className="ctas-q">
                      <button className='apply-it' onClick={() => { dispatchFilter({ type: FILTER_ACTIONS.APPLY_FILTERS }); capture('jobs_filters_applied', { source: 'ctc_dropdown' }); setOpenDropdown(null); }}>Apply Filter(s)</button>
                      <button className='clear-it' onClick={() => { dispatchFilter({ type: FILTER_ACTIONS.CLEAR_FILTER_TYPE, payload: 'ctc' }); capture('jobs_filters_cleared', { filter_type: 'ctc_range', source: 'ctc_dropdown' }); setOpenDropdown(null); }}>Clear All</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </>
          )}
        </div>
        {/* All Filters Drawer */}
        {isDrawerOpen && (
          <div className="filters-drawer-overlay" onClick={(e) => { if (e.target.classList.contains('filters-drawer-overlay')) { setIsDrawerOpen(false); dispatchFilter({ type: FILTER_ACTIONS.RESET_TEMP_TO_APPLIED }); } }}>
            <div className="filters-drawer">
              <div className="drawer-header">
                <div className="title">
                  <span style={{ marginRight: 8 }}>All Filters</span>
                </div>
                <button className="close-btn" onClick={() => { setIsDrawerOpen(false); dispatchFilter({ type: FILTER_ACTIONS.RESET_TEMP_TO_APPLIED }); }}>✕</button>
              </div>
              <div className="drawer-body">
                {/* Top three checkboxes */}
                <div className="drawer-toggles">
                  <label className="toggle-row">
                    <span className="toggle-label">Recommended For You</span>
                    <input
                      type="checkbox"
                      checked={isRecommended}
                      disabled={isGuest}
                      onChange={(e)=> {
                        setIsRecommended(e.target.checked);
                        capture('jobs_recommended_toggled', { enabled: Boolean(e.target.checked), source: 'drawer' });
                      }}
                    />
                  </label>
                  <label className="toggle-row">
                    <span className="toggle-label with-icon">
                      <svg className="bk-fill" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M6 5c0-1.105.895-2 2-2h8c1.105 0 2 .895 2 2v13l-6-2.7L6 18V5Z" fill="#FF9600"/>
                      </svg>
                      Saved Jobs
                    </span>
                    <input type="checkbox" checked={showSavedOnly} onChange={(e)=> { setShowSavedOnly(e.target.checked); capture('jobs_saved_only_toggled', { enabled: Boolean(e.target.checked), source: 'drawer' }); }} />
                  </label>
                  <label className="toggle-row">
                    <span className="toggle-label">Applied Jobs</span>
                    <input type="checkbox" checked={showAppliedOnly} onChange={(e)=> { setShowAppliedOnly(e.target.checked); capture('jobs_applied_only_toggled', { enabled: Boolean(e.target.checked), source: 'drawer' }); }} />
                  </label>
                </div>

                {/* Accordion: Role */}
                <div className="acc-section">
                  <button type="button" className="acc-head" onClick={()=> setDrawerOpenSections(s=>({...s, role: !s.role}))}>
                    <span className="acc-title">Role{filterState.temp.roleType?.length ? ` (${filterState.temp.roleType.length})` : ''}</span>
                    <span className={`chev ${drawerOpenSections.role ? 'open' : ''}`}>▾</span>
                  </button>
                  {drawerOpenSections.role && (
                    <div className="acc-body">
                      <div className="options-grid">
                        {(filterOptions.roleType.options || []).map((opt) => (
                          <button key={`d-role-${opt}`} type="button" className={`option-btn ${filterState.temp.roleType?.includes(opt) ? 'selected' : ''}`} onClick={() => dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_SELECTION, payload: { filterType: 'roleType', item: opt } })}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion: Location */}
                <div className="acc-section">
                  <button type="button" className="acc-head" onClick={()=> setDrawerOpenSections(s=>({...s, location: !s.location}))}>
                    <span className="acc-title">Location{filterState.temp.jobLocation?.length ? ` (${filterState.temp.jobLocation.length})` : ''}</span>
                    <span className={`chev ${drawerOpenSections.location ? 'open' : ''}`}>▾</span>
                  </button>
                  {drawerOpenSections.location && (
                    <div className="acc-body">
                      <div className="options-grid">
                        {(filterOptions.jobLocation.options || []).map((opt) => (
                          <button key={`d-loc-${opt}`} type="button" className={`option-btn ${filterState.temp.jobLocation?.includes(opt) ? 'selected' : ''}`} onClick={() => dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_SELECTION, payload: { filterType: 'jobLocation', item: opt } })}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion: Work Type */}
                <div className="acc-section">
                  <button type="button" className="acc-head" onClick={()=> setDrawerOpenSections(s=>({...s, workType: !s.workType}))}>
                    <span className="acc-title">Work Type{filterState.temp.workType?.length ? ` (${filterState.temp.workType.length})` : ''}</span>
                    <span className={`chev ${drawerOpenSections.workType ? 'open' : ''}`}>▾</span>
                  </button>
                  {drawerOpenSections.workType && (
                    <div className="acc-body">
                      <div className="options-grid">
                        {(filterOptions.workType.options || []).map((opt) => (
                          <button key={`d-work-${opt}`} type="button" className={`option-btn ${filterState.temp.workType?.includes(opt) ? 'selected' : ''}`} onClick={() => dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_SELECTION, payload: { filterType: 'workType', item: opt } })}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion: Salary */}
                <div className="acc-section">
                  <button type="button" className="acc-head" onClick={()=> setDrawerOpenSections(s=>({...s, salary: !s.salary}))}>
                    <span className="acc-title">Annual Salary{filterState.temp.minAnnualCtc!=null && filterState.temp.maxAnnualCtc!=null ? ` (${filterState.temp.minAnnualCtc}-${filterState.temp.maxAnnualCtc}L)` : ''}</span>
                    <span className={`chev ${drawerOpenSections.salary ? 'open' : ''}`}>▾</span>
                  </button>
                  {drawerOpenSections.salary && (
                    <div className="acc-body">
                      <RangeSlider
                        min={0}
                        max={50}
                        step={1}
                        valueMin={filterState.temp.minAnnualCtc ?? 0}
                        valueMax={filterState.temp.maxAnnualCtc ?? 50}
                        maxSpan={5}
                        formatValue={(v) => `Rs. ${v}L`}
                        ariaLabelMin="Minimum annual CTC"
                        ariaLabelMax="Maximum annual CTC"
                        onChange={({ min, max }) =>
                          dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minAnnualCtc: min, maxAnnualCtc: max } })
                        }
                      />
                      <small className="hint">You can select a maximum 5L range.</small>
                    </div>
                  )}
                </div>

                {/* Accordion: Experience */}
                <div className="acc-section">
                  <button type="button" className="acc-head" onClick={()=> setDrawerOpenSections(s=>({...s, experience: !s.experience}))}>
                    <span className="acc-title">Experience{filterState.temp.minExperienceLevel!=null && filterState.temp.maxExperienceLevel!=null ? ` (${filterState.temp.minExperienceLevel}-${filterState.temp.maxExperienceLevel} yrs)` : ''}</span>
                    <span className={`chev ${drawerOpenSections.experience ? 'open' : ''}`}>▾</span>
                  </button>
                  {drawerOpenSections.experience && (
                    <div className="acc-body">
                    <RangeSlider
                        min={0}
                        max={20}
                        step={1}
                        valueMin={filterState.temp.minExperienceLevel ?? 0}
                      valueMax={filterState.temp.maxExperienceLevel ?? 3}
                        maxSpan={3}
                        formatValue={(v) => `${v} Years`}
                        ariaLabelMin="Minimum experience"
                        ariaLabelMax="Maximum experience"
                        onChange={({ min, max }) =>
                          dispatchFilter({ type: FILTER_ACTIONS.UPDATE_TEMP_RANGE, payload: { minExperienceLevel: min, maxExperienceLevel: max } })
                        }
                      />
                      <small className="hint">You can select a maximum 3-year range.</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="drawer-footer">
                <button className='comm-cta fill-none' onClick={() => { setShowSavedOnly(false); setShowAppliedOnly(false); setIsRecommended(false); setSearchTerm(''); dispatchFilter({ type: FILTER_ACTIONS.CLEAR_ALL_FILTERS }); capture('jobs_filters_reset', { source: 'drawer' }); }}>Reset</button>
                <button className='comm-cta fill-blue' onClick={() => { dispatchFilter({ type: FILTER_ACTIONS.APPLY_FILTERS }); capture('jobs_filters_applied', { source: 'drawer' }); setIsDrawerOpen(false); }}>Apply Filter(s)</button>
              </div>
            </div>
          </div>
        )}
        <div className="job-list">
          {(() => {
            let list = showAppliedOnly ? jobs.filter(j => applicationStatuses[j._id]) : jobs;
            if (showSavedOnly && !isGuest) {
              const savedSet = new Set(Array.isArray(authState.user?.savedJobIds) ? authState.user.savedJobIds : []);
              list = list.filter(j => savedSet.has(j._id));
            }
            return list.length > 0 ? (
              list.map((job) => (
              <JobCard
                key={job._id}
                data={job}
                applicationStatus={applicationStatuses[job._id]}
                saved={Boolean((authState.user?.savedJobIds || []).includes(job._id))}
                onToggleSave={() => toggleSaveJob(job._id)}
              />
              ))
            ) : (
              <div className="no-jobs-message">
                No jobs available for current selection
              </div>
            );
          })()}
        </div>
        {jobs.length > 0 && pagination.hasMore && !isGuest && (
          <div className="load-more-section">
            {pagination.isLoadingMore ? (
              <Loader />
            ) : (
              <button
                className="load-more-btn comm-cta fill-blue"
                onClick={handleLoadMore}
                disabled={pagination.isLoadingMore}
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Jobs = () => {
  return (
    <Suspense fallback={<Loader />}>
      <JobsContent />
    </Suspense>
  );
};

export default Jobs;
