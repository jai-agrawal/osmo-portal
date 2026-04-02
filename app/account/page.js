'use client'

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/app/context/AuthContext';
import Loader from '@/app/components/UI/Loader'
import countryCodesData from '../lib/utils/CountryCodes.json';

const AccountPage = () => {
  const { authState, updateUser, refreshUserData } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    newPassword: '',
    dateOfBirth: '',
    mobileCode: '+91',
  });
  const [countryCodes, setCountryCodes] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [messages, setMessages] = useState({ type: '', messages: [] });

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasUppercase = /[A-Z]/.test(password);

    return hasMinLength && hasNumber && hasUppercase;
  };

  useEffect(() => {
    setCountryCodes(countryCodesData);
    refreshUserData();
  }, []);

  useEffect(() => {
    if (authState.user) {
      let formattedDate = '';
      if (authState.user.dateOfBirth) {
        const date = new Date(authState.user.dateOfBirth);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      }

      setFormData({
        fullName: authState.user.name || '',
        email: authState.user.email || '',
        phoneNumber: authState.user.mobile || '',
        newPassword: '',
        dateOfBirth: formattedDate,
        mobileCode: authState.user.mobileCode || '+91',
      });
    }
  }, [authState.user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'fullName') {
      newValue = value.replace(/[^A-Za-z\s]/g, '');
    } else if (name === 'phoneNumber') {
      newValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'email') {
      newValue = value.toLowerCase();
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });

    setValidationErrors({
      ...validationErrors,
      [name]: false
    });
  };

  const validateForm = () => {
    const errors = {};
    const validationMessages = [];

    if (!formData.fullName) {
      errors.fullName = true;
      validationMessages.push("Full name is required");
    } else if (!/^[A-Za-z\s]+$/.test(formData.fullName)) {
      errors.fullName = true;
      validationMessages.push("Name should only contain letters and spaces");
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = true;
      validationMessages.push("Phone number is required");
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = true;
      validationMessages.push("Phone number should be exactly 10 digits");
    }

    if (!formData.email) {
      errors.email = true;
      validationMessages.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = true;
      validationMessages.push("Please enter a valid email address");
    }

    if (formData.newPassword && !validatePassword(formData.newPassword)) {
      errors.newPassword = true;
      validationMessages.push("Password must be at least 6 characters long, contain one number and one uppercase letter");
    }

    setValidationErrors(errors);
    if (validationMessages.length > 0) {
      setMessages({ type: 'error', messages: validationMessages });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessages({ type: '', messages: [] });

    if (!validateForm()) {
      return;
    }

    const updatedUserData = {
      _id: authState.user._id,
      name: formData.fullName,
      email: formData.email,
      mobile: formData.phoneNumber,
      mobileCode: formData.mobileCode,
      password: formData.newPassword,
      dateOfBirth: formData.dateOfBirth,
    };

    try {
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${authState.user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.accessToken}`,
        },
        body: JSON.stringify(updatedUserData),
      });

      if (userResponse.ok) {
        const updatedUser = await userResponse.json();
        updateUser(updatedUser);
        setMessages({
          type: 'success',
          messages: ['Profile updated successfully!']
        });
      } else {
        setMessages({
          type: 'error',
          messages: ['Error updating profile. Please try again.']
        });
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      setMessages({
        type: 'error',
        messages: ['An error occurred. Please try again later.']
      });
    }
  };

  if (!authState.user) {
    return <Loader/>;
  }

  return (
    <div className="account-page">
      <div className="spotlight-bar container-pad">
        <div className="left">
          <h1>Account</h1>
          <h4>This is your personal login information. Do not share your password with anyone.</h4>
        </div>
        <div className="right"></div>
      </div>
      <div className="account-form-w container-pad">
        <div className="inners-q">
          <form onSubmit={handleSubmit}>
            <fieldset>
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={validationErrors.fullName ? 'error' : ''}
                required
              />
            </fieldset>
            <fieldset>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={validationErrors.email ? 'error' : ''}
                required
              />
            </fieldset>
            <fieldset>
              <label>Phone Number *</label>
              <div className="phone-input-container">
                <select
                  name="mobileCode"
                  value={formData.mobileCode}
                  onChange={handleChange}
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
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={validationErrors.phoneNumber ? 'error' : ''}
                  required
                />
              </div>
            </fieldset>
            <fieldset>
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={validationErrors.dateOfBirth ? 'error' : ''}
              />
            </fieldset>
            <fieldset>
              <label>Change Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={validationErrors.newPassword ? 'error' : ''}
                placeholder="Leave empty to keep current password"
              />
              <div className="password-requirements">
                Password must contain:
                <ul>
                  <li>At least 6 characters</li>
                  <li>One number</li>
                  <li>One uppercase letter</li>
                </ul>
              </div>
            </fieldset>
            <div className="cta-wat">
              <button className='fill-blue' type="submit">Update</button>
            </div>
          </form>
          {messages.messages.length > 0 && (
            <div className="message-container">
              <div className={`message ${messages.type}`}>
                {messages.messages.length === 1 ? (
                  <p>{messages.messages[0]}</p>
                ) : (
                  <>
                    <p>Please resolve the following:</p>
                    <ul>
                      {messages.messages.map((message, index) => (
                        <li key={index}>{message}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
