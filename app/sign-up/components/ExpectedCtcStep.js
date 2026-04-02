import RangeSlider from '@/app/components/UI/RangeSlider';

const ExpectedCtcStep = ({ selected, updateFormData, onNext, onBack }) => {
  // Expecting selected to be an object: { minExpectedCtc, maxExpectedCtc }
  const min = selected?.minExpectedCtc ?? 0;
  const max = selected?.maxExpectedCtc ?? 5;

  return (
    <div className="forms-a">
      <div className="headers">
        <h1>What is your expected CTC range?</h1>
        <h4>If you're unsure, choose a lower minimum so you don't miss out.</h4>
      </div>

      {/* Temporarily replaced RangeSlider with manual inputs */}

      <RangeSlider
        min={0}
        max={50}
        step={1}
        valueMin={min}
        valueMax={max}
        maxSpan={5}
        formatValue={(v) => `Rs. ${v}L`}
        ariaLabelMin="Minimum expected CTC"
        ariaLabelMax="Maximum expected CTC"
        onChange={({ min: nextMin, max: nextMax }) =>
          updateFormData('ctcRange', {
            minExpectedCtc: nextMin,
            maxExpectedCtc: nextMax
          })
        }
      />


      {/* <div className="ctc-inputs">
        <label>
          Min (L)
          <input
            type="number"
            min={0}
            max={50}
            step={1}
            value={min}
            onChange={(e) => {
              const raw = Number(e.target.value);
              const nextMin = Math.max(0, Math.min(50, isNaN(raw) ? 0 : raw));
              let nextMax = max;
              if (nextMax - nextMin > 5) {
                nextMax = Math.min(50, nextMin + 5);
              }
              updateFormData('ctcRange', { minExpectedCtc: nextMin, maxExpectedCtc: nextMax });
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
            value={max}
            onChange={(e) => {
              const raw = Number(e.target.value);
              let nextMax = Math.max(0, Math.min(50, isNaN(raw) ? 0 : raw));
              let nextMin = min;
              if (nextMax - nextMin > 5) {
                nextMin = Math.max(0, nextMax - 5);
              }
              updateFormData('ctcRange', { minExpectedCtc: nextMin, maxExpectedCtc: nextMax });
            }}
          />
        </label>
        </div> */}
      <small className="hint">You can select a maximum 5L range.</small>

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
          disabled={min == null || max == null}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ExpectedCtcStep;
