import Image from 'next/image';
import { uploadFiles } from '@/app/lib/utils/s3-upload';
import { useState } from 'react';

const DocumentsStep = ({ formData, updateFormData, onNext, onBack }) => {
  const [validationErrors, setValidationErrors] = useState({});

  const handleFileChange = async (e, type) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const signedUrls = await uploadFiles(e.target.files);

      if (type === 'additionalFiles') {
        updateFormData('additionalFileIds', signedUrls.map((item) => item._id));
        updateFormData(type, [...e.target.files]);
      } else {
        updateFormData(type, e.target.files[0]);
        updateFormData(`${type}FileId`, signedUrls[0]._id);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}`);
      const fileData = await response.json();
      if (fileData.url) {
        window.open(fileData.url, '_blank');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
    }
  };

  const validateUrl = (url) => {
    if (!url) return true;

    const urlRegex = /^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\/[a-zA-Z0-9_\-.~!*'();:@&=+$,/?%#[\]]*)?$/;
    return urlRegex.test(url);
  };

  const handleUrlChange = (e, type) => {
    const url = e.target.value;
    updateFormData('socialUrls', { ...formData.socialUrls, [type]: url });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.resumeFileId) {
      newErrors.resume = true;
    }

    if (formData.socialUrls.linkedin && !validateUrl(formData.socialUrls.linkedin)) {
      newErrors.linkedin = true;
    }

    if (formData.socialUrls.website && !validateUrl(formData.socialUrls.website)) {
      newErrors.website = true;
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextClick = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const handleBackClick = () => {
    validateForm();
    onBack();
  };

  return (
    <div className="forms-a">
      <div className="headers">
        <h1>Share Documents and Links</h1>
        <h4>Accepted file types .pdf, .doc, .docx, .png</h4>
      </div>
      <div className="documents-section">
        <div className="tops">
          <div className="upload-group">
            <label>Upload CV*</label>
            <div className={`file-input-wrapper ${validationErrors.resume ? 'error' : ''}`}>
              <input
                type="file"
                id="resume"
                onChange={(e) => handleFileChange(e, 'resume')}
                accept=".pdf,.doc,.docx,.png"
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
              <div className={`validation-error ${!validationErrors.resume ? 'hidden' : ''}`}>
                CV is required to proceed
              </div>
              <button
                type="button"
                className={`view-file-btn ${!formData.resumeFileId ? 'hidden' : ''}`}
                onClick={() => handleViewFile(formData.resumeFileId)}
                disabled={!formData.resumeFileId}
              >
                View File
              </button>
            </div>
          </div>

          <div className="upload-group">
            <label>Upload Portfolio</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="portfolio"
                onChange={(e) => handleFileChange(e, 'portfolio')}
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
              <button
                type="button"
                className={`view-file-btn ${!formData.portfolioFileId ? 'hidden' : ''}`}
                onClick={() => handleViewFile(formData.portfolioFileId)}
                disabled={!formData.portfolioFileId}
              >
                View File
              </button>
            </div>
          </div>

          <div className="upload-group">
            <label>Anything Else</label>
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
                  <Image src="/img/upload.svg" width={30} height={30} alt="upload" />
                </div>
                <span
                  className="file-name"
                  style={formData.additionalFileIds?.length > 0 ? { cursor: 'pointer' } : {}}
                >
                  {formData.additionalFiles?.length > 0
                    ? `${formData.additionalFiles.length} files selected`
                    : formData.additionalFileIds?.length > 0
                      ? `${formData.additionalFileIds.length} files uploaded`
                      : 'Upload Files'}
                </span>
              </label>
              <div className={`additional-files-view ${!formData.additionalFileIds?.length ? 'hidden' : ''}`}>
                {formData.additionalFileIds?.map((fileId, index) => (
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
            </div>
          </div>
        </div>

        <div className="bottoms">
          <div className="links-group">
            <label>LinkedIn URL</label>
            <input
              type="url"
              value={formData.socialUrls.linkedin}
              onChange={(e) => handleUrlChange(e, 'linkedin')}
              placeholder="https://linkedin.com/in/username"
              className={validationErrors.linkedin ? 'error' : ''}
            />
            <div className={`validation-error ${!validationErrors.linkedin ? 'hidden' : ''}`}>
              Please enter a valid URL including https://
            </div>
          </div>
          <div className="links-group">
            <label>Website/Portfolio URL</label>
            <input
              type="url"
              value={formData.socialUrls.website}
              onChange={(e) => handleUrlChange(e, 'website')}
              placeholder="https://yourwebsite.com"
              className={validationErrors.website ? 'error' : ''}
            />
            <div className={`validation-error ${!validationErrors.website ? 'hidden' : ''}`}>
              Please enter a valid URL including https://
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="comm-cta fill-none"
          onClick={handleBackClick}
        >
          Back
        </button>
        <button
          type="button"
          className="comm-cta fill-blue"
          onClick={handleNextClick}
        >
          Next
        </button>
      </div>
      <style jsx>{`
        .hidden {
          opacity: 0;
          visibility: hidden;
          height: 0;
          margin: 0;
          padding: 0;
          transition: opacity 0.2s, visibility 0.2s;
        }
        .validation-error {
          color: #ff3b30;
          font-size: 12px;
          margin-top: 4px;
          transition: opacity 0.2s, visibility 0.2s;
          min-height: 18px;
        }
        .view-file-btn {
          transition: opacity 0.2s, visibility 0.2s;
        }
        .additional-files-view {
          transition: opacity 0.2s, visibility 0.2s;
        }
      `}</style>
    </div>
  );
};

export default DocumentsStep;
