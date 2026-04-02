import RangeSlider from '@/app/components/UI/RangeSlider';
import { useMemo } from 'react';

const ExperienceLevelStep = ({ selected, updateFormData, onNext, onBack }) => {
  // Expecting selected to be an object: { minExperienceLevel, maxExperienceLevel }
  const maxRange = 3;
  const absoluteMax = 20;
  
  // Clamp initial values to respect 3-year range
  const clampedValues = useMemo(() => {
    let minExp = selected?.minExperienceLevel ?? 0;
    let maxExp = selected?.maxExperienceLevel ?? 3;
    
    // Ensure values are within absolute bounds
    minExp = Math.max(0, Math.min(minExp, absoluteMax));
    maxExp = Math.max(0, Math.min(maxExp, absoluteMax));
    
    // Clamp range to maximum 3 years
    if (maxExp - minExp > maxRange) {
      maxExp = Math.min(absoluteMax, minExp + maxRange);
    }
    
    return { min: minExp, max: maxExp };
  }, [selected?.minExperienceLevel, selected?.maxExperienceLevel]);

  return (
    <div className="forms-a">
      <div className="headers">
        <h1>What is your experience level?</h1>
        <h4>Select your minimum and maximum years of experience.</h4>
      </div>

      {/* Temporarily replaced RangeSlider with manual inputs */}

      <RangeSlider
        min={0}
        max={20}
        step={1}
        valueMin={clampedValues.min}
        valueMax={clampedValues.max}
        maxSpan={3}
        formatValue={(v) => `${v} Year${v === 1 ? '' : 's'}`}
        ariaLabelMin="Minimum experience"
        ariaLabelMax="Maximum experience"
        onChange={({ min, max }) =>
          updateFormData('experienceRange', {
            minExperienceLevel: min,
            maxExperienceLevel: max
          })
        }
      />


      {/* <div className="ctc-inputs">
        <label>
          Min (Years)
          <input
            type="number"
            min={0}
            max={30}
            step={1}
            value={min}
            onChange={(e) => {
              const raw = Number(e.target.value);
              const nextMin = Math.max(0, Math.min(30, isNaN(raw) ? 0 : raw));
              let nextMax = max;
              if (nextMax - nextMin > 3) {
                nextMax = Math.min(30, nextMin + 3);
              }
              updateFormData('experienceRange', { minExperienceLevel: nextMin, maxExperienceLevel: nextMax });
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
            value={max}
            onChange={(e) => {
              const raw = Number(e.target.value);
              let nextMax = Math.max(0, Math.min(30, isNaN(raw) ? 0 : raw));
              let nextMin = min;
              if (nextMax - nextMin > 3) {
                nextMin = Math.max(0, nextMax - 3);
              }
              updateFormData('experienceRange', { minExperienceLevel: nextMin, maxExperienceLevel: nextMax });
            }}
          />
        </label>
      </div> */}

      <small className="hint">You can select a maximum 3-year range.</small>

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
          disabled={clampedValues.min == null || clampedValues.max == null}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ExperienceLevelStep;
