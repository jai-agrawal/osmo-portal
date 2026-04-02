'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { capture, flush } from '@/app/lib/analytics/posthog';
import LocationPreferenceStep from './components/LocationPreferenceStep';
import ExperienceLevelStep from './components/ExperienceLevelStep';
import AvailabilityStep from './components/AvailabilityStep';
import ExpertiseStep from './components/ExpertiseStep';
import ExpectedCtcStep from './components/ExpectedCtcStep';
import AccountStep from './components/AccountStep';
import Loader from '@/app/components/UI/Loader';

const STEP_NAMES = {
  1: 'location_preference',
  2: 'expertise',
  3: 'experience_level',
  4: 'expected_ctc',
  5: 'availability',
  6: 'account'
};

const SignUpPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [wasSkipped, setWasSkipped] = useState(false);
  const [formData, setFormData] = useState({
    locationPreference: [],
    // new min/max fields replacing single values
    minExperienceLevel: 0,
    maxExperienceLevel: 3,
    availability: '',
    areaOfExpertise: [],
    minExpectedCtc: 0,
    maxExpectedCtc: 5,
    name: '',
    email: '',
    mobile: '',
    socialUrls: {
      linkedin: '',
      website: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Track sign-up form start time for time-to-complete analytics
  const signupStartedAtRef = useRef(null);
  // Refs for drop-off tracking (read in unload/cleanup where state may be stale)
  const currentStepRef = useRef(currentStep);
  const signupCompletedRef = useRef(false);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    fetchSettings();
    signupStartedAtRef.current = Date.now();
    capture('signup_started');
  }, []);

  useEffect(() => {
    capture('signup_step_viewed', { step: currentStep, step_name: STEP_NAMES[currentStep] });
  }, [currentStep]);

  // Fire signup_abandoned when user leaves without submitting (step/field drop-off)
  const reportAbandoned = () => {
    if (signupCompletedRef.current) return;
    signupCompletedRef.current = true; // avoid double-send
    const lastStep = currentStepRef.current;
    const durationMs = signupStartedAtRef.current != null ? Date.now() - signupStartedAtRef.current : null;
    const signupDurationSeconds = durationMs != null ? Math.round(durationMs / 1000) : null;
    capture('signup_abandoned', {
      last_step: lastStep,
      last_step_name: STEP_NAMES[lastStep] ?? null,
      ...(signupDurationSeconds != null && { signup_duration_seconds: signupDurationSeconds })
    });
  };

  useEffect(() => {
    const onUnload = () => {
      reportAbandoned();
      flush();
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
      reportAbandoned();
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
      const data = await response.json();
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleNext = () => {
    capture('signup_step_completed', { step: currentStep, step_name: STEP_NAMES[currentStep] });
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSkip = () => {
    capture('signup_skipped_quiz', { from_step: currentStep });
    setWasSkipped(true);
    setCurrentStep(6);
  };

  const updateFormData = (field, value) => {
    // Support steps sending grouped objects
    if (field === 'experienceRange') {
      setFormData(prev => ({
        ...prev,
        minExperienceLevel: value.minExperienceLevel,
        maxExperienceLevel: value.maxExperienceLevel
      }));
      return;
    }
    if (field === 'ctcRange') {
      setFormData(prev => ({
        ...prev,
        minExpectedCtc: value.minExpectedCtc,
        maxExpectedCtc: value.maxExpectedCtc
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    signupCompletedRef.current = true; // user completed the flow (submitted); don't fire abandoned
    try {
      setApiError(null);
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      const durationMs = signupStartedAtRef.current != null ? Date.now() - signupStartedAtRef.current : null;
      const signupDurationSeconds = durationMs != null ? Math.round(durationMs / 1000) : null;
      const durationProps = signupDurationSeconds != null ? { signup_duration_seconds: signupDurationSeconds } : {};

      capture('signup_submitted', { was_skipped: Boolean(wasSkipped), ...durationProps });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // remove legacy keys if present
          experienceLevel: undefined,
          expectedCtc: undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        capture('signup_succeeded', { was_skipped: Boolean(wasSkipped), ...durationProps });
        setMessage({
          type: 'success',
          text: `Account created successfully!`
        });
      } else {
        capture('signup_failed', { was_skipped: Boolean(wasSkipped), ...durationProps });
        setApiError(data);
      }
    } catch (error) {
      capture('signup_failed', { was_skipped: Boolean(wasSkipped), error_type: 'network_or_unhandled', ...durationProps });
      setApiError({ message: 'An error occurred. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = {
    1: LocationPreferenceStep,
    2: ExpertiseStep,
    3: ExperienceLevelStep,
    4: ExpectedCtcStep,
    5: AvailabilityStep,
    6: AccountStep
  };

  if (loading) return <Loader />;

  if (signupSuccess) {
    return (
      <div className="onboard-page sign-up-steps">
        <div className="inner">
          <div className="main-cont">
            <div className="success-message">
              <h1>Thank you for signing up!</h1>
              <p>Your account has been created successfully.</p>
              <p>Please check your email for login credentials and further instructions.</p>
              <div className="email-highlight">
                We've sent the details to: <strong>{formData.email}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const CurrentStep = steps[currentStep];

  return (
    <div className="onboard-page sign-up-steps">
      <div className="inner">
        <div className="main-cont">
          <div className="progress-steps-w">
            <span>Step {currentStep} of 6</span>
          </div>
          {currentStep < 6 && (
            <div className="skip-woa">
              <button onClick={handleSkip} className="skip-btn">
                Skip Quiz
              </button>
            </div>
          )}
          <CurrentStep
            options={
              currentStep === 1 ? settings?.settings?.jobLocation?.options :
              currentStep === 2 ? settings?.settings?.areaOfExpertise?.options :
              currentStep === 5 ? settings?.settings?.candidateAvailability?.options :
              []
            }
            selected={
              currentStep === 1 ? formData.locationPreference :
              currentStep === 2 ? formData.areaOfExpertise :
              currentStep === 3 ? { minExperienceLevel: formData.minExperienceLevel, maxExperienceLevel: formData.maxExperienceLevel } :
              currentStep === 4 ? { minExpectedCtc: formData.minExpectedCtc, maxExpectedCtc: formData.maxExpectedCtc } :
              currentStep === 5 ? formData.availability :
              null
            }
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={currentStep > 1 && !wasSkipped ? handleBack : undefined}
            onSubmit={currentStep === 6 ? handleSubmit : undefined}
            apiError={currentStep === 6 ? apiError : null}
            isLoading={isLoading}
            message={message}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
