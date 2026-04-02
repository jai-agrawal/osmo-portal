const AvailabilityStep = ({ options, selected, updateFormData, onNext, onBack }) => {
  const handleSelect = (availability) => {
    updateFormData('availability', availability);
  };

  return (
    <div className="forms-a">
      <div className="headers">
        <h1>When are you looking to start a new job?</h1>
      </div>
      <div className="radio-group">
        {options.map((availability) => (
          <label key={availability} className="radio-label">
            <input
              type="radio"
              name="candidateAvailability"
              value={availability}
              checked={selected === availability}
              onChange={() => handleSelect(availability)}
            />
            {availability}
            <span>&nbsp;</span>
          </label>
        ))}
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="comm-cta fill-none"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="comm-cta fill-blue"
          onClick={onNext}
          disabled={!selected}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AvailabilityStep;
