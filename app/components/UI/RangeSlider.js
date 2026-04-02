
'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react';

/**
 * A reusable dual-thumb range slider for selecting a numeric min and max.
 *
 * Props:
 * - min: number (absolute minimum)
 * - max: number (absolute maximum)
 * - step: number (increment)
 * - valueMin: number (current selected minimum)
 * - valueMax: number (current selected maximum)
 * - onChange: (next: { min: number, max: number }) => void
 * - formatValue: (val: number) => string (display text above thumbs)
 * - ariaLabelMin / ariaLabelMax: string (a11y)
 * - maxSpan?: number (optional) maximum allowed difference between max and min
 * - spanLimitMessage?: string (optional) custom message when span limit is hit
 */
const RangeSlider = ({
  min = 0,
  max = 100,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  formatValue = (v) => String(v),
  ariaLabelMin = 'Minimum value',
  ariaLabelMax = 'Maximum value',
  mode = 'dual', // 'dual' | 'single' (single renders only the max thumb)
  showFixedMinBubble = false,
  showBubbles = true,
  maxSpan,
  spanLimitMessage,
}) => {
  const safeMin = typeof valueMin === 'number' ? Math.max(min, Math.min(valueMin, max)) : min;
  const safeMax = typeof valueMax === 'number' ? Math.max(min, Math.min(valueMax, max)) : max;

  const leftPercent = useMemo(() => ((safeMin - min) / (max - min)) * 100, [safeMin, min, max]);
  const rightPercent = useMemo(() => ((safeMax - min) / (max - min)) * 100, [safeMax, min, max]);

  const [showSpanNotice, setShowSpanNotice] = useState(false);
  const hideTimerRef = useRef(null);
  const trackRef = useRef(null);
  const draggingRangeRef = useRef(false);
  const dragStartRef = useRef({ x: 0, min: 0, max: 0 });

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const triggerSpanNotice = () => {
    setShowSpanNotice(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowSpanNotice(false), 5000);
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
  const snapToStep = (v) => {
    const steps = Math.round((v - min) / step);
    return clamp(min + steps * step, min, max);
  };

  const applyPushForMin = (proposedMin) => {
    let nextMin = clamp(snapToStep(proposedMin), min, max);
    // do not cross max thumb
    nextMin = Math.min(nextMin, safeMax - step);
    let nextMax = safeMax;
    let clamped = false;
    if (typeof maxSpan === 'number') {
      if (nextMax - nextMin > maxSpan) {
        const pushedMax = nextMin + maxSpan;
        if (pushedMax <= max) {
          nextMax = pushedMax;
        } else {
          // cannot push beyond absolute max, clamp min to keep span
          clamped = true;
          nextMin = clamp(max - maxSpan, min, max);
          nextMax = clamp(nextMin + maxSpan, min, max);
        }
      }
    }
    return { min: nextMin, max: snapToStep(nextMax), clamped };
  };

  const applyPushForMax = (proposedMax) => {
    let nextMax = clamp(snapToStep(proposedMax), min, max);
    // do not cross min thumb
    nextMax = Math.max(nextMax, safeMin + step);
    let nextMin = safeMin;
    let clamped = false;
    if (typeof maxSpan === 'number') {
      if (nextMax - nextMin > maxSpan) {
        const pushedMin = nextMax - maxSpan;
        if (pushedMin >= min) {
          nextMin = pushedMin;
        } else {
          // cannot push beyond absolute min, clamp max to keep span
          clamped = true;
          nextMin = clamp(min, min, max);
          nextMax = clamp(nextMin + maxSpan, min, max);
        }
      }
    }
    return { min: snapToStep(nextMin), max: nextMax, clamped };
  };

  const handleMinChange = (e) => {
    const proposed = Number(e.target.value);
    const next = applyPushForMin(proposed);
    if (next.clamped) triggerSpanNotice();
    onChange?.({ min: next.min, max: next.max });
  };

  const handleMaxChange = (e) => {
    const proposed = Number(e.target.value);
    const next = applyPushForMax(proposed);
    if (next.clamped) triggerSpanNotice();
    onChange?.({ min: next.min, max: next.max });
  };

  const valueFromClientX = (clientX) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return min;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return snapToStep(min + ratio * (max - min));
  };

  const handleTrackPointerDown = (e) => {
    // If range segment was targeted, range-drag handler will take over
    if (e.target && e.target.classList && e.target.classList.contains('range')) return;
    const val = valueFromClientX(e.clientX);
    if (mode === 'single') {
      onChange?.({ min, max: val });
      return;
    }
    // choose nearest thumb
    const distToMin = Math.abs(val - safeMin);
    const distToMax = Math.abs(val - safeMax);
    if (distToMin <= distToMax) {
      const next = applyPushForMin(val);
      if (next.clamped) triggerSpanNotice();
      onChange?.({ min: next.min, max: next.max });
    } else {
      const next = applyPushForMax(val);
      if (next.clamped) triggerSpanNotice();
      onChange?.({ min: next.min, max: next.max });
    }
  };

  const onRangePointerDown = (e) => {
    if (mode !== 'dual') return;
    draggingRangeRef.current = true;
    dragStartRef.current = { x: e.clientX, min: safeMin, max: safeMax };
    window.addEventListener('pointermove', onRangePointerMove);
    window.addEventListener('pointerup', onRangePointerUp, { once: true });
  };

  const onRangePointerMove = (e) => {
    if (!draggingRangeRef.current) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const deltaPx = e.clientX - dragStartRef.current.x;
    const deltaValueRaw = (deltaPx / rect.width) * (max - min);
    const span = dragStartRef.current.max - dragStartRef.current.min;
    let nextMin = snapToStep(dragStartRef.current.min + deltaValueRaw);
    let nextMax = snapToStep(nextMin + span);
    // clamp within absolute bounds while keeping span
    if (nextMin < min) {
      nextMin = min;
      nextMax = snapToStep(min + span);
    }
    if (nextMax > max) {
      nextMax = max;
      nextMin = snapToStep(max - span);
    }
    onChange?.({ min: nextMin, max: nextMax });
  };

  const onRangePointerUp = () => {
    draggingRangeRef.current = false;
    window.removeEventListener('pointermove', onRangePointerMove);
  };

  return (
    <div
      className="range-slider"
      style={{
        '--minPos': `${leftPercent}%`,
        '--maxPos': `${rightPercent}%`,
      }}
    >
      <div
        className="track"
        aria-hidden
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
      >
        <div
          className="range"
          style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
          onPointerDown={onRangePointerDown}
        />
      </div>

      {mode === 'dual' && (
        <>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeMin}
            onChange={handleMinChange}
            aria-label={ariaLabelMin}
            className="thumb thumb-min"
          />

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeMax}
            onChange={handleMaxChange}
            aria-label={ariaLabelMax}
            className="thumb thumb-max"
          />

          {showBubbles && (
            <div className="bubbles">
              <div className="bubble bubble-min">{formatValue(safeMin)}</div>
              <div className="bubble bubble-max">{formatValue(safeMax)}</div>
            </div>
          )}
          {typeof maxSpan === 'number' && showSpanNotice && (
            <div className="range-slider__hint" role="status" aria-live="polite">
              {spanLimitMessage || `Maximum range is ${formatValue(maxSpan)}.`}
            </div>
          )}
        </>
      )}

      {mode === 'single' && (
        <>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeMax}
            onChange={(e) => {
              const next = Math.max(Number(e.target.value), min);
              onChange?.({ min, max: next });
            }}
            aria-label={ariaLabelMax}
            className="thumb thumb-max"
          />
          {showBubbles && (
            <div className="bubbles">
              {showFixedMinBubble && (
                <div className="bubble bubble-start">{formatValue(min)}</div>
              )}
              <div className="bubble bubble-max">{formatValue(safeMax)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RangeSlider;


