import React, { useState, useEffect } from 'react';
import countryCodesData from '../../lib/utils/CountryCodes.json';

const AccountStep = ({ formData, updateFormData, onBack, onSubmit, apiError, isLoading, message }) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [validationMessages, setValidationMessages] = useState({ type: '', messages: [] });
  const [countryCodes, setCountryCodes] = useState([]);

  useEffect(() => {
    setCountryCodes(countryCodesData);
  }, []);

  useEffect(() => {
    if (apiError) {
      setValidationMessages({
        type: 'error',
        messages: [apiError.message || 'An error occurred during signup']
      });

      if (apiError.error === 'Duplicate email') {
        setValidationErrors({
          ...validationErrors,
          email: true
        });
      }
    }
  }, [apiError]);

  const handleChange = (field, value) => {
    let newValue = value;

    if (field === 'name') {
      newValue = value.replace(/[^A-Za-z\s]/g, '');
    } else if (field === 'mobile') {
      newValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (field === 'email') {
      newValue = value.toLowerCase();
    }

    updateFormData(field, newValue);
    setValidationErrors({
      ...validationErrors,
      [field]: false
    });
    setValidationMessages({ type: '', messages: [] });
  };

  const validateForm = () => {
    const errors = {};
    const validationMessages = [];

    if (!formData.name) {
      errors.name = true;
      validationMessages.push("Full name is required");
    } else if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      errors.name = true;
      validationMessages.push("Name should only contain letters and spaces");
    }

    if (!formData.mobile) {
      errors.mobile = true;
      validationMessages.push("Phone number is required");
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = true;
      validationMessages.push("Phone number should be exactly 10 digits");
    }

    if (!formData.email) {
      errors.email = true;
      validationMessages.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = true;
      validationMessages.push("Please enter a valid email address");
    }

    if (!formData.password) {
      errors.password = true;
      validationMessages.push("Password is required");
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = true;
      validationMessages.push("Confirm Password is required");
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = true;
      validationMessages.push("Passwords do not match");
      }

    setValidationErrors(errors);
    if (validationMessages.length > 0) {
      setValidationMessages({ type: 'error', messages: validationMessages });
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationMessages({ type: '', messages: [] });

    if (validateForm()) {
      onSubmit();
      updateFormData('name', '');
      updateFormData('email', '');
      updateFormData('mobile', '');
      updateFormData('mobileCode', '+91');
      updateFormData('password', '');
      updateFormData('confirmPassword', '');
    }
  };

  return (
    <div className="forms-a">
      <div className="headers">
        <h1>Create an Account</h1>
        <h4>We will use your credentials to create your account</h4>
      </div>
      <div className="social-login-section">
        <button
          type="button"
          className="google-login-btn"
          onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/candidate/google`}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>
        <div className="social-divider">
          <span>or</span>
        </div>
      </div>
      <fieldset>
        <form onSubmit={handleSubmit}>
          <div className="form-groups">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={validationErrors.name ? 'error' : ''}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={validationErrors.email ? 'error' : ''}
              />
              {/* <div className="info-text">
                Your account password will be sent to this email address
              </div> */}
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <div className="phone-input-container">
                <select
                  value={formData.mobileCode || '+91'}
                  onChange={(e) => handleChange('mobileCode', e.target.value)}
                  className="country-code-select"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.dial_code}>
                      {country.name} ({country.dial_code})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  className={validationErrors.mobile ? 'error' : ''}
                />
              </div>
            </div>
            <div  className="form-group">
              <label>Password *</label>
              <input type="password" required placeholder="Password" id="password" onChange={(e) => handleChange('password', e.target.value)} className={validationErrors.password ? 'error' : ''}/>
            </div>
            <div  className="form-group">
              <label>Confirm Password *</label>
              <input type="password" required placeholder="Confirm Password" id="confirmPassword" onChange={(e) => handleChange('confirmPassword', e.target.value)} className={validationErrors.confirmPassword ? 'error' : ''}/>
            </div>
            </div>
          <div className="form-actions">
            {onBack && (
              <button
                type="button"
                className="comm-cta fill-none"
                onClick={onBack}
                disabled={isLoading}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="comm-cta fill-blue"
              disabled={!formData.name || !formData.email || !formData.mobile || !formData.password || !formData.confirmPassword || isLoading}
            >
              {isLoading ? (
                <span className="button-content">
                  <span className="loader"></span>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {(validationMessages.messages.length > 0 || apiError || message.text) && (
            <div className="gbl-msg">
              <div className={`form-message ${message.text ? message.type : validationMessages.type}`}>
                {message.text ? (
                  message.text
                ) : validationMessages.messages.length === 1 ? (
                  validationMessages.messages[0]
                ) : apiError ? (
                  apiError.message
                ) : (
                  <>
                    <p>Please resolve the following:</p>
                    <ul>
                      {validationMessages.messages.map((message, index) => (
                        <li key={index}>{message}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </form>
      </fieldset>
    </div>
  );
};

export default AccountStep;
