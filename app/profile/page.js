'use client'

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';
import { capture } from '@/app/lib/analytics/posthog';
import { uploadFiles } from '@/app/lib/utils/s3-upload';
import Loader from '@/app/components/UI/Loader';
import RangeSlider from '@/app/components/UI/RangeSlider';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const ProfilePage = () => {
  const router = useRouter();
  const { authState, updateUser, refreshUserData } = useContext(AuthContext);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const initPage = async () => {
      await refreshUserData();
      await fetchSettings();
    };

    initPage();
  }, []);

  useEffect(() => {
    if (authState.user) {
      // Clamp experience range to maximum 3 years
      let minExp = authState.user.minExperienceLevel ?? 0;
      let maxExp = authState.user.maxExperienceLevel ?? 10;
      const maxRange = 3;
      const absoluteMax = 20;
      
      // Ensure values are within absolute bounds
      minExp = Math.max(0, Math.min(minExp, absoluteMax));
      maxExp = Math.max(0, Math.min(maxExp, absoluteMax));
      
      // Clamp range to maximum 3 years
      if (maxExp - minExp > maxRange) {
        // Keep min value, adjust max to min + 3 (capped at absolute max)
        maxExp = Math.min(absoluteMax, minExp + maxRange);
      }

      setFormData({
        locationPreference: authState.user.locationPreference || [],
        areaOfExpertise: (authState.user.areaOfExpertise || []).slice(0, 3),
        minExperienceLevel: minExp,
        maxExperienceLevel: maxExp,
        minExpectedCtc: authState.user.minExpectedCtc ?? 0,
        maxExpectedCtc: authState.user.maxExpectedCtc ?? 50,
        candidateAvailability: authState.user.candidateAvailability || '',
        resumeFileId: authState.user.resumeFileId || null,
        portfolioFileId: authState.user.portfolioFileId || null,
        additionalFileIds: authState.user.additionalFileIds || [],
        resume: null,
        portfolio: null,
        additionalFiles: [],
        socialUrls: {
          linkedin: authState.user.socialUrls?.linkedin || '',
          website: authState.user.socialUrls?.website || '',
        }
      });

      if (authState.user.updatedAt) {
        const date = new Date(authState.user.updatedAt);
        setLastUpdated(date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }));
      }
    }
  }, [authState.user]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleFileChange = async (e, type) => {
    const files = Array.from(e.target.files);
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setFormMessage({
        type: 'error',
        text: `File size exceeds 20MB limit. Please choose smaller files.`
      });
      // Clear the input
      e.target.value = '';
      return;
    }

    // Clear any previous error messages
    setFormMessage({ type: '', text: '' });

    const signedUrls = await uploadFiles(e.target.files);
    if (type === 'additionalFiles') {
      setFormData({
        ...formData,
        [`additionalFileIds`]: signedUrls.map((item) => item._id),
        [type]: [...e.target.files]
      });
    } else {
      setFormData({
        ...formData,
        [type]: e.target.files[0],
        [`${type}FileId`]: signedUrls[0]._id
      });
    }
  };

  const handleMultiSelect = (field, value) => {
    const currentValues = formData[field];

    // If already selected, remove it
    if (currentValues.includes(value)) {
      setFormData({ ...formData, [field]: currentValues.filter(v => v !== value) });
      return;
    }

    // Enforce maximum of 3 selections for areaOfExpertise only
    if (field === 'areaOfExpertise' && currentValues.length >= 3) {
      return;
    }

    setFormData({ ...formData, [field]: [...currentValues, value] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    const updatedUserData = {
      _id: authState.user._id,
      locationPreference: formData.locationPreference,
      areaOfExpertise: formData.areaOfExpertise,
      minExperienceLevel: formData.minExperienceLevel,
      maxExperienceLevel: formData.maxExperienceLevel,
      minExpectedCtc: formData.minExpectedCtc,
      maxExpectedCtc: formData.maxExpectedCtc,
      candidateAvailability: formData.candidateAvailability,
      resumeFileId: formData.resumeFileId,
      portfolioFileId: formData.portfolioFileId,
      additionalFileIds: formData.additionalFileIds,
      socialUrls: formData.socialUrls,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${authState.user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.accessToken}`
        },
        body: JSON.stringify(updatedUserData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        capture('profile_updated');
        setFormMessage({
          type: 'success',
          text: 'Profile updated successfully!'
        });
      } else {
        setFormMessage({
          type: 'error',
          text: 'Error updating profile'
        });
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      setFormMessage({
        type: 'error',
        text: 'An error occurred while updating profile'
      });
    }
  };

  const getFileName = (fileId, type) => {
    if (!fileId) return '';
    if (formData[type]?.name) {
      return formData[type].name;
    }
    const storedFile = authState.user?.files?.find(f => f._id === fileId);
    return storedFile?.name || 'File uploaded';
  };

  const handleViewFile = async (fileId) => {
    if (!fileId) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
        }
      });
      const fileData = await response.json();
      if (fileData.url) {
        window.open(fileData.url, '_blank');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
    }
  };

  if (loading || !formData) return <Loader />;

  return (
    <div className="profile-page">
      <div className="spotlight-bar container-pad">
        <h1>Profile</h1>
        <h4>This information is shared with recruiters at Osmo. You can change this info anytime.</h4>
        <div className="last-udt">
          {lastUpdated ? `Last updated on ${lastUpdated}` : 'Not updated yet'}
        </div>
      </div>

      <div className="profile-form container-pad">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>1. Where would you like to work? <span>Select all that apply.</span> </h3>
            <div className="options-grid">
              {settings?.settings?.jobLocation?.options.map((location) => (
                <button
                  key={location}
                  type="button"
                  className={`option-btn ${formData.locationPreference.includes(location) ? 'selected' : ''}`}
                  onClick={() => handleMultiSelect('locationPreference', location)}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>2. What is your area of expertise? <span>Select all that apply upto 3 only.</span></h3>
            <div className="options-grid">
              {settings?.settings?.areaOfExpertise?.options?.map((expertise) => (
                <button
                  key={expertise}
                  type="button"
                  className={`option-btn ${formData.areaOfExpertise.includes(expertise) ? 'selected' : ''}`}
                  disabled={formData.areaOfExpertise.length >= 3 && !formData.areaOfExpertise.includes(expertise)}
                  onClick={() => handleMultiSelect('areaOfExpertise', expertise)}
                >
                  {expertise}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>3. What is your experience level?</h3>
            <div>
              {/* Temporarily replaced RangeSlider with manual inputs */}

              <RangeSlider
                min={0}
                max={20}
                step={1}
                valueMin={formData.minExperienceLevel}
                valueMax={formData.maxExperienceLevel}
                maxSpan={3}
                formatValue={(v) => `${v} Years`}
                onChange={({ min, max }) => setFormData({ ...formData, minExperienceLevel: min, maxExperienceLevel: max })}
              />

{/*
              <div className="ctc-inputs">
                <label>
                  Min (Years)
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={1}
                    value={formData.minExperienceLevel}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const nextMin = Math.max(0, Math.min(30, isNaN(raw) ? 0 : raw));
                      let nextMax = formData.maxExperienceLevel;
                      if (nextMax - nextMin > 3) {
                        nextMax = Math.min(30, nextMin + 3);
                      }
                      setFormData({ ...formData, minExperienceLevel: nextMin, maxExperienceLevel: nextMax });
                    }}
                  />
                </label>
                <label>
                  Max (Years)
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={1}
                    value={formData.maxExperienceLevel}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      let nextMax = Math.max(0, Math.min(30, isNaN(raw) ? 0 : raw));
                      let nextMin = formData.minExperienceLevel;
                      if (nextMax - nextMin > 3) {
                        nextMin = Math.max(0, nextMax - 3);
                      }
                      setFormData({ ...formData, minExperienceLevel: nextMin, maxExperienceLevel: nextMax });
                    }}
                  />
                </label>
              </div> */}
                <small className="hint">You can select a maximum 3-year range.</small>
            </div>
          </div>

          <div className="form-section">
            <h3>4. What is your expected CTC?</h3>
            <div>
              {/* Temporarily replaced RangeSlider with manual inputs */}

              <RangeSlider
                min={0}
                max={50}
                step={1}
                valueMin={formData.minExpectedCtc}
                valueMax={formData.maxExpectedCtc}
                maxSpan={5}
                formatValue={(v) => `Rs. ${v}L`}
                onChange={({ min, max }) => setFormData({ ...formData, minExpectedCtc: min, maxExpectedCtc: max })}
              />


              {/* <div className="ctc-inputs">
                <label>
                  Min (L)
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    value={formData.minExpectedCtc}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const nextMin = Math.max(0, Math.min(50, isNaN(raw) ? 0 : raw));
                      let nextMax = formData.maxExpectedCtc;
                      if (nextMax - nextMin > 5) {
                        nextMax = Math.min(50, nextMin + 5);
                      }
                      setFormData({ ...formData, minExpectedCtc: nextMin, maxExpectedCtc: nextMax });
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
                    value={formData.maxExpectedCtc}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      let nextMax = Math.max(0, Math.min(50, isNaN(raw) ? 0 : raw));
                      let nextMin = formData.minExpectedCtc;
                      if (nextMax - nextMin > 5) {
                        nextMin = Math.max(0, nextMax - 5);
                      }
                      setFormData({ ...formData, minExpectedCtc: nextMin, maxExpectedCtc: nextMax });
                    }}
                  />
                </label>
                </div> */}
              <small className="hint">You can select a maximum 5L range.</small>
              <h6>If you're unsure, we recommend choosing a lower amount so you don't miss out on roles that could be great</h6>
            </div>
          </div>

          <div className="form-section">
            <h3>5. When are you looking to start a new job?</h3>
            <div className="radio-group">
              {settings?.settings?.candidateAvailability?.options.map((availability) => (
                <label key={availability} className="radio-label">
                  <input
                    type="radio"
                    name="candidateAvailability"
                    value={availability}
                    checked={formData.candidateAvailability === availability}
                    onChange={(e) => setFormData({ ...formData, candidateAvailability: e.target.value })}
                  />
                  {availability}
                  <span>&nbsp;</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>6. Share Documents and Links</h3>
            <div className="documents-section">
              <div className="tops">
                <div className="upload-group">
                  <label>Upload CV*</label>
                  <small className="file-size-limit">Max size: 20MB</small>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id="resume"
                      onChange={(e) => handleFileChange(e, 'resume')}
                      accept=".pdf,.doc,.docx,.png"
                    />
                    <label htmlFor="resume" className="file-label">
                      <div className="upload-icon">
                        <Image src="/img/upload.svg" width={64} height={64} alt="upload" />
                      </div>
                      <span
                        className="file-name"
                        onClick={formData.resumeFileId ? () => handleViewFile(formData.resumeFileId) : undefined}
                        style={formData.resumeFileId ? { cursor: 'pointer', textDecoration: 'underline' } : {}}
                      >
                        {getFileName(formData.resumeFileId, 'resume') || 'Upload CV'}
                      </span>
                    </label>
                    {formData.resumeFileId && (
                      <button
                        type="button"
                        className="view-file-btn"
                        onClick={() => handleViewFile(formData.resumeFileId)}
                      >
                        View File
                      </button>
                    )}
                  </div>
                </div>
                <div className="upload-group">
                  <label>Upload Portfolio</label>
                  <small className="file-size-limit">Max size: 20MB</small>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id="portfolio"
                      onChange={(e) => handleFileChange(e, 'portfolio')}
                      accept=".pdf,.doc,.docx,.png"
                    />
                    <label htmlFor="portfolio" className="file-label">
                      <div className="upload-icon">
                        <Image src="/img/upload.svg" width={64} height={64} alt="upload" />
                      </div>
                      <span
                        className="file-name"
                        onClick={formData.portfolioFileId ? () => handleViewFile(formData.portfolioFileId) : undefined}
                        style={formData.portfolioFileId ? { cursor: 'pointer', textDecoration: 'underline' } : {}}
                      >
                        {getFileName(formData.portfolioFileId, 'portfolio') || 'Upload Portfolio'}
                      </span>
                    </label>
                    {formData.portfolioFileId && (
                      <button
                        type="button"
                        className="view-file-btn"
                        onClick={() => handleViewFile(formData.portfolioFileId)}
                      >
                        View File
                      </button>
                    )}
                  </div>
                </div>
                <div className="upload-group">
                  <label>Anything Else</label>
                  <small className="file-size-limit">Max size: 20MB per file</small>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id="additional"
                      multiple
                      onChange={(e) => handleFileChange(e, 'additionalFiles')}
                      accept=".pdf,.doc,.docx,.png"
                    />
                    <label htmlFor="additional" className="file-label">
                      <div className="upload-icon">
                        <Image src="/img/upload.svg" width={64} height={64} alt="upload" />
                      </div>
                      <span
                        className="file-name"
                        style={formData.additionalFileIds?.length > 0 ? { cursor: 'pointer' } : {}}
                      >
                        {formData.additionalFiles.length > 0
                          ? `${formData.additionalFiles.length} files selected`
                          : formData.additionalFileIds?.length > 0
                            ? `${formData.additionalFileIds.length} files uploaded`
                            : 'Upload Files'}
                      </span>
                    </label>
                    {formData.additionalFileIds?.length > 0 && (
                      <div className="additional-files-view">
                        {formData.additionalFileIds.map((fileId, index) => (
                          <button
                            key={fileId}
                            type="button"
                            className="view-file-btn"
                            onClick={() => handleViewFile(fileId)}
                          >
                            View File {index + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bottoms">
                <div className="links-group">
                  <label>Website/Portfolio Link</label>
                  <input
                    type="url"
                    placeholder="Website/Portfolio Link"
                    value={formData.socialUrls.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialUrls: { ...formData.socialUrls, website: e.target.value }
                    })}
                  />
                </div>
                <div className="links-group">
                  <label>LinkedIn</label>
                  <input
                    type="url"
                    placeholder="LinkedIn"
                    value={formData.socialUrls.linkedin}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialUrls: { ...formData.socialUrls, linkedin: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="comm-cta fill-blue">Update</button>
          </div>

          {formMessage.text && (
            <div className='gbl-msg'>
              <div className={`form-message ${formMessage.type}`}>
                {formMessage.text}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
