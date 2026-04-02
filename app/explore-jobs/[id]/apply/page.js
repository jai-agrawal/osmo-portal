'use client'

import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { uploadFiles } from '@/app/lib/utils/s3-upload';
import { AuthContext } from '@/app/context/AuthContext';
import Image from 'next/image';
import { capture } from '@/app/lib/analytics/posthog';

const JobApplicationPage = ({ params }) => {
  const router = useRouter();
  const { authState, updateUser } = useContext(AuthContext);
  const jobId = params.jobId;
  const pathname = usePathname();
  const idHash = pathname.split('/')[2];
  const [job, setJob] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    candidateName: authState.user.name || '',
    candidateEmail: authState.user.email || '',
    phoneNumber: authState.user.mobile || '',
    linkedin: authState.user.socialUrls?.linkedin || '',
    websitePortfolio: authState.user.socialUrls?.website || '',
    resumeFileId: authState.user.resumeFileId || null,
    portfolioFileId: authState.user.portfolioFileId || null,
    additionalFileIds: authState.user.additionalFileIds || [],
    resume: null,
    portfolio: null,
    additionalFiles: [],
    highestEducation: authState.user.highestEducation || '',
    visualDesignExperience: authState.user.visualDesignExperience || '',
    totalWorkExperience: authState.user.totalWorkExperience || '',
    interestedReason: '',
    areaOfExpertise: authState.user.areaOfExpertise || [],
    // new range-based fields
    minExpectedCtc: authState.user.minExpectedCtc ?? 0,
    maxExpectedCtc: authState.user.maxExpectedCtc ?? 50,
    minExperienceLevel: authState.user.minExperienceLevel ?? 0,
    maxExperienceLevel: authState.user.maxExperienceLevel ?? 30,
    locationPreference: authState.user.locationPreference || [],
    candidateAvailability: authState.user.candidateAvailability || '',
    socialUrls: {
      linkedin: authState.user.socialUrls?.linkedin || '',
      website: authState.user.socialUrls?.website || ''
    }
  });
  const fieldFocusTimeRef = useRef(null);
  const currentFieldRef = useRef(null);

  const handleFieldFocus = (fieldName) => {
    fieldFocusTimeRef.current = Date.now();
    currentFieldRef.current = fieldName;
  };

  const handleFieldBlur = (fieldName) => {
    if (currentFieldRef.current === fieldName && fieldFocusTimeRef.current) {
      const timeSpent = Date.now() - fieldFocusTimeRef.current;
      capture('application_field_completed', {
        field_name: fieldName,
        time_spent_ms: timeSpent,
        job_id: idHash
      });
      fieldFocusTimeRef.current = null;
      currentFieldRef.current = null;
    }
  };

  const [lastUpdated, setLastUpdated] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [errorMessages, setErrorMessages] = useState([]);

  useEffect(() => {
    capture('application_started', { job_id: idHash });
    if (idHash) {
      fetch(`${process.env.NEXT_PUBLIC_JOB_URL}/${idHash}`)
        .then((response) => response.json())
        .then((data) => {
          setJob(data);
          capture('application_job_loaded', { job_id: idHash, has_questions: Boolean(data?.questions?.length), questions_count: data?.questions?.length || 0 });
        })
        .catch((error) => console.error('Error fetching job details:', error));
    } else {
      console.error('jobId is undefined');
    }

    if (authState.user.updatedAt) {
      const date = new Date(authState.user.updatedAt);
      setLastUpdated(date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }));
    }
  }, [idHash, authState.user.updatedAt]);

  const validateStep1 = () => {
    const errors = {};
    const messages = [];

    if (!formData.candidateName) {
      errors.candidateName = true;
      messages.push("Full name is required");
    } else if (!/^[A-Za-z\s]+$/.test(formData.candidateName)) {
      errors.candidateName = true;
      messages.push("Name should only contain letters and spaces");
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = true;
      messages.push("Phone number is required");
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = true;
      messages.push("Phone number should be exactly 10 digits");
    }

    if (!formData.candidateEmail) {
      errors.candidateEmail = true;
      messages.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.candidateEmail)) {
      errors.candidateEmail = true;
      messages.push("Please enter a valid email address");
    }

    if (formData.linkedin && !/^https?:\/\/(www\.)?linkedin\.com\/.*$/.test(formData.linkedin)) {
      errors.linkedin = true;
      messages.push("Please enter a valid LinkedIn URL with https://");
    }

    if (formData.websitePortfolio && !/^https?:\/\/.*$/.test(formData.websitePortfolio)) {
      errors.websitePortfolio = true;
      messages.push("Please enter a valid website URL with https://");
    }

    if (!formData.resumeFileId) {
      errors.resume = true;
      messages.push("CV is required");
    }

    setValidationErrors(errors);
    setErrorMessages(messages);
    if (Object.keys(errors).length > 0) {
      capture('application_step1_validation_failed', { job_id: idHash, fields: Object.keys(errors) });
    }
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    job?.questions.forEach((_, index) => {
      if (!formData[`question_${index}`]) {
        errors[`question_${index}`] = true;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    capture('application_step1_next_clicked', { job_id: idHash });
    if (validateStep1()) {
      await updateUserData();

      // Skip to submission if there are no questions
      if (!job?.questions?.length) {
        setIsSubmitting(true);
        const jobApplicationPayload = getJobApplicationPayload();
        submitApplication(jobApplicationPayload);
      } else {
        setCurrentStep(2);
        capture('application_step2_viewed', { job_id: idHash, questions_count: job?.questions?.length || 0 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    capture('application_submit_clicked', { job_id: idHash, step: currentStep });

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    // Only validate step 2 if there are questions
    if (job?.questions?.length && !validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    const jobApplicationPayload = getJobApplicationPayload();
    submitApplication(jobApplicationPayload);
  };

  const submitApplication = async (payload) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_JOB_APPLICATION_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.accessToken}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        capture('application_submitted', { job_id: idHash, had_questions: Boolean(job?.questions?.length) });
        router.push('/application-success');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        capture('application_submit_failed', { job_id: idHash, http_ok: false });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      capture('application_submit_failed', { job_id: idHash, error_type: 'network_or_unhandled' });
      setIsSubmitting(false);
    }
  };

  const updateUserData = async () => {
    const updatedUserData = {
      _id: authState.user._id,
      name: formData.candidateName,
      email: formData.candidateEmail,
      mobile: formData.phoneNumber,
      areaOfExpertise: formData.areaOfExpertise,
      locationPreference: formData.locationPreference,
      minExpectedCtc: formData.minExpectedCtc,
      maxExpectedCtc: formData.maxExpectedCtc,
      minExperienceLevel: formData.minExperienceLevel,
      maxExperienceLevel: formData.maxExperienceLevel,
      candidateAvailability: formData.candidateAvailability,
      socialUrls: {
        linkedin: formData.linkedin,
        website: formData.websitePortfolio,
      },
      resumeFileId: formData.resumeFileId,
      portfolioFileId: formData.portfolioFileId,
      additionalFileIds: formData.additionalFileIds,
      highestEducation: formData.highestEducation,
      visualDesignExperience: formData.visualDesignExperience,
      totalWorkExperience: formData.totalWorkExperience
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
      } else {
        console.error('Error updating user data');
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const getJobApplicationPayload = () => {
    const jobApplicationPayload = {
      candidateId: authState.user._id,
      candidateName: formData.candidateName,
      candidateEmail: formData.candidateEmail,
      clientId: job?.clientId || '',
      jobId: job?.id || jobId || '',
      status: 'PENDING_REVIEW',
      resumeFileId: formData.resumeFileId || undefined,
      portfolioFileId: formData.portfolioFileId || undefined,
      additionalFileIds: formData.additionalFileIds || [],
      socialUrls: {
        linkedin: formData.linkedin,
        website: formData.websitePortfolio,
      },
      minExpectedCtc: formData.minExpectedCtc,
      maxExpectedCtc: formData.maxExpectedCtc,
      minExperienceLevel: formData.minExperienceLevel,
      maxExperienceLevel: formData.maxExperienceLevel,
      locationPreference: formData.locationPreference || [],
      candidateAvailability: formData.candidateAvailability || '',
      areaOfExpertise: formData.areaOfExpertise || [],
      highestEducation: formData.highestEducation,
      visualDesignExperience: formData.visualDesignExperience,
      totalWorkExperience: formData.totalWorkExperience,
      questions: job?.questions ? job.questions.map((question, index) => ({
        question: question.question,
        questionType: question.questionType,
        answer: formData[`question_${index}`] || '',
      })) : [],
    };

    return jobApplicationPayload;
  };

  const handleFileChange = async (e, type) => {
    const files = Array.from(e.target.files);
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setErrorMessages(['File size exceeds 20MB limit. Please choose smaller files.']);
      // Clear the input
      e.target.value = '';
      return;
    }

    // Clear any previous error messages related to file size
    setErrorMessages([]);

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

  const getFileName = (fileId, type) => {
    if (!fileId) return '';
    if (formData[type]?.name) {
      return formData[type].name;
    }
    return 'File uploaded';
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

  return (
    <div className="job-application-wp">
      <div className="spotlight-bar container-pad">
        <div className="left">
          <h1>Apply Now</h1>
        </div>
      </div>
      <div className="submit-main-body container-pad">
        <div className="left-az">
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <div className="heads-txt">
              <h3>Your Personal Details {job?.questions?.length ? '(1/2)' : ''}</h3>
              <div className="disc-a">All changes made here will reflect in your profile as well</div>
              <div className="last-udt">
                {lastUpdated ? `Last updated on ${lastUpdated}` : 'Not updated yet'}
              </div>
            </div>
          </div>

          {job?.questions?.length > 0 && (
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
              <div className="heads-txt">
                <h3>Questions from the employer (2/2)</h3>
              </div>
            </div>
          )}

          <form className="form-cala" onSubmit={handleSubmit}>
            <div className="form-step" style={{ display: currentStep === 1 ? 'block' : 'none' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.candidateName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setFormData({ ...formData, candidateName: value });
                    setValidationErrors({ ...validationErrors, candidateName: false });
                  }}
                  onFocus={() => handleFieldFocus('candidateName')}
                  onBlur={() => handleFieldBlur('candidateName')}
                  className={validationErrors.candidateName ? 'error' : ''}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, candidateEmail: e.target.value.toLowerCase() });
                    setValidationErrors({ ...validationErrors, candidateEmail: false });
                  }}
                  onFocus={() => handleFieldFocus('candidateEmail')}
                  onBlur={() => handleFieldBlur('candidateEmail')}
                  className={validationErrors.candidateEmail ? 'error' : ''}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phoneNumber: value });
                    setValidationErrors({ ...validationErrors, phoneNumber: false });
                  }}
                  onFocus={() => handleFieldFocus('phoneNumber')}
                  onBlur={() => handleFieldBlur('phoneNumber')}
                  className={validationErrors.phoneNumber ? 'error' : ''}
                  required
                />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => {
                    setFormData({ ...formData, linkedin: e.target.value });
                    setValidationErrors({ ...validationErrors, linkedin: false });
                  }}
                  onFocus={() => handleFieldFocus('linkedin')}
                  onBlur={() => handleFieldBlur('linkedin')}
                  className={validationErrors.linkedin ? 'error' : ''}
                />
              </div>
              <div className="form-group">
                <label>Website/Portfolio Link</label>
                <input
                  type="text"
                  value={formData.websitePortfolio}
                  onFocus={() => handleFieldFocus('websitePortfolio')}
                  onBlur={() => handleFieldBlur('websitePortfolio')}
                />
              </div>
              <div className="documents-section">
                <div className="tops">
                  <div className="upload-group">
                    <label>Your CV *</label>
                    <small className="file-size-limit">Max size: 20MB</small>
                    <div className={`file-input-wrapper ${validationErrors.resume ? 'error' : ''}`}>
                      <input
                        type="file"
                        id="resume"
                        onChange={(e) => {
                          handleFileChange(e, 'resume');
                          setValidationErrors({ ...validationErrors, resume: false });
                        }}
                        onFocus={() => handleFieldFocus('resume')}
                        onBlur={() => handleFieldBlur('resume')}
                        accept=".pdf,.doc,.docx,.png"
                        required={!formData.resumeFileId}
                      />
                      <label htmlFor="resume" className="file-label">
                        <div className="upload-icon">
                          <Image src="/img/upload.svg" width={30} height={30} alt="upload" />
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
                    <label>Your Portfolio</label>
                    <small className="file-size-limit">Max size: 20MB</small>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="portfolio"
                        onChange={(e) => handleFileChange(e, 'portfolio')}
                        onFocus={() => handleFieldFocus('portfolio')}
                        onBlur={() => handleFieldBlur('portfolio')}
                        accept=".pdf,.doc,.docx,.png"
                      />
                      <label htmlFor="portfolio" className="file-label">
                        <div className="upload-icon">
                          <Image src="/img/upload.svg" width={30} height={30} alt="upload" />
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
                        onFocus={() => handleFieldFocus('additionalFiles')}
                        onBlur={() => handleFieldBlur('additionalFiles')}
                        accept=".pdf,.doc,.docx,.png"
                      />
                      <label htmlFor="additional" className="file-label">
                        <div className="upload-icon">
                          <Image src="/img/upload.svg" width={30} height={30} alt="upload" />
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

              </div>
              <div className="form-actions">
                <div className="button-container" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`comm-cta ${isSubmitting && !job?.questions?.length ? 'disabled-btn' : ''}`}
                    onClick={handleNext}
                    disabled={isSubmitting && !job?.questions?.length}
                  >
                    {job?.questions?.length ? 'Next' : 'Submit Application'}
                  </button>
                  {isSubmitting && !job?.questions?.length && (
                    <div className="button-loader" style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: '10'
                    }}>
                      <span className="loader-spin"></span>
                    </div>
                  )}
                </div>
              </div>
              {errorMessages.length > 0 && (
                <div className="validation-errors">
                  <p>Please resolve the following errors:</p>
                  <ul>
                    {errorMessages.map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {job?.questions?.length > 0 && (
              <div className="form-step" style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                {job?.questions.map((question, index) => (
                  <div className="form-group" key={index}>
                    <label>{question.question} *</label>
                    {question.questionType === 'shortAnswer' && (
                      <input
                        type="text"
                        value={formData[`question_${index}`] || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [`question_${index}`]: e.target.value });
                          setValidationErrors({ ...validationErrors, [`question_${index}`]: false });
                        }}
                        onFocus={() => handleFieldFocus(`question_${index}`)}
                        onBlur={() => handleFieldBlur(`question_${index}`)}
                        className={validationErrors[`question_${index}`] ? 'error' : ''}
                        required
                      />
                    )}
                    {question.questionType === 'yesNoOther' && (
                      <select
                        value={formData[`question_${index}`] || ''}
                        onChange={(e) => setFormData({ ...formData, [`question_${index}`]: e.target.value })}
                        onFocus={() => handleFieldFocus(`question_${index}`)}
                        onBlur={() => handleFieldBlur(`question_${index}`)}
                        required
                      >
                        <option value="">Select an option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Other">Other</option>
                      </select>
                    )}
                    {question.questionType === 'multipleChoice' && (
                      <select
                        value={formData[`question_${index}`] || ''}
                        onChange={(e) => setFormData({ ...formData, [`question_${index}`]: e.target.value })}
                        onFocus={() => handleFieldFocus(`question_${index}`)}
                        onBlur={() => handleFieldBlur(`question_${index}`)}
                        required
                      >
                        <option value="">Select an option</option>
                        {question.choices.map((choice, choiceIndex) => (
                          <option key={choiceIndex} value={choice}>{choice}</option>
                        ))}
                        {question.addOther && <option value="Other">Other</option>}
                      </select>
                    )}
                  </div>
                ))}
                <div className="form-actions grp-form">
                  <div className="button-container" style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      type="submit"
                      className={`comm-cta ${isSubmitting ? 'disabled-btn' : ''}`}
                      disabled={isSubmitting}
                    >
                      Submit Application
                    </button>
                    {isSubmitting && (
                      <div className="button-loader" style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: '10'
                      }}>
                        <span className="loader-spin"></span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="comm-cta fill-none"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
        <div className="right-az">
          {job && (
            <div className="job-overview-board">
              <div className="top-s">
                <div className="lefta">{job.name}</div>
                {/* <div className="righta">{job.client.name}</div> */}
              </div>
              <div className="bottom-s">
                <div className="job-text-deets">
                  {job.jobDescription.companyOverview &&
                    <div className="breaks">
                      <h2>Company Overview</h2>
                      <div className="text-aq" dangerouslySetInnerHTML={{__html:job.jobDescription.companyOverview}}></div>
                    </div>
                  }
                  {job.jobDescription.whoLookingFor &&
                    <div className="breaks">
                      <h2>Who We Are Looking For</h2>
                      <div className="text-aq" dangerouslySetInnerHTML={{__html:job.jobDescription.whoLookingFor}}></div>
                    </div>
                  }
                  {job.jobDescription.responsibilities &&
                    <div className="breaks">
                      <h2>Responsibilities</h2>
                      <div className="text-aq" dangerouslySetInnerHTML={{__html:job.jobDescription.responsibilities}}></div>
                    </div>
                  }
                  {job.jobDescription.qualifications &&
                    <div className="breaks">
                      <h2>Qualifications</h2>
                      <div className="text-aq" dangerouslySetInnerHTML={{__html:job.jobDescription.qualifications}}></div>
                    </div>
                  }
                  {job.jobDescription.additionalInfo &&
                    <div className="breaks">
                      <h2>Additional Info</h2>
                      <div className="text-aq" dangerouslySetInnerHTML={{__html:job.jobDescription.additionalInfo}}></div>
                    </div>
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplicationPage;
