const LocationPreferenceStep = ({ options, selected, updateFormData, onNext }) => {
  const handleSelect = (location) => {
    const currentLocations = selected || [];
    const newLocations = currentLocations.includes(location)
      ? currentLocations.filter(l => l !== location)
      : [...currentLocations, location];
    updateFormData('locationPreference', newLocations);
  };

  return (
    <div className="forms-a">
      <div className="headers">
        <h1>Where would you like to work?</h1>
        <h4>Select all that apply</h4>
      </div>
      <div className="options-grid">
        {options.map((location) => (
          <button
            key={location}
            type="button"
            className={`option-btn ${selected?.includes(location) ? 'selected' : ''}`}
            onClick={() => handleSelect(location)}
          >
            {location}
          </button>
        ))}
      </div>
      <div className="form-actions">
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

export default LocationPreferenceStep;
