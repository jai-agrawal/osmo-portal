const ExpertiseStep = ({ options, selected, updateFormData, onNext, onBack }) => {
  const handleSelect = (expertise) => {
    const currentExpertise = selected || [];
    // If already selected, remove it
    if (currentExpertise.includes(expertise)) {
      updateFormData('areaOfExpertise', currentExpertise.filter(e => e !== expertise));
      return;
    }

    // Enforce maximum of 3 selections
    if (currentExpertise.length >= 3) {
      return;
    }

    updateFormData('areaOfExpertise', [...currentExpertise, expertise]);
  };

  return (
    <div className="forms-a">
      <div className="headers">
        <h1>What is your area of expertise?</h1>
        <h4>Select all that apply upto 3 only</h4>
      </div>
      <div className="options-grid">
        {options.map((expertise) => (
          <button
            key={expertise}
            type="button"
            className={`option-btn ${selected?.includes(expertise) ? 'selected' : ''}`}
            disabled={selected?.length >= 3 && !selected?.includes(expertise)}
            onClick={() => handleSelect(expertise)}
          >
            {expertise}
          </button>
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
          disabled={!selected?.length}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ExpertiseStep;
