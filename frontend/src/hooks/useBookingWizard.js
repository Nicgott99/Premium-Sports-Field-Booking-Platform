/**
 * useBookingWizard.js — Multi-Step Booking Wizard State Manager
 * Premium Sports Booking Platform
 *
 * A self-contained React hook that drives any multi-step booking flow:
 *  - Declarative step definitions with per-step validation schemas
 *  - Forward/backward navigation with guard checks
 *  - Form data accumulation across steps (deep-merge strategy)
 *  - Draft auto-persistence to sessionStorage (survives page refresh)
 *  - Progress percentage, step label, and completion state
 *  - Submission lifecycle with loading / error / success states
 *  - Reset utility to wipe draft and restart from step 1
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * const STEPS = [
 *   {
 *     id: 'select-field',
 *     label: 'Choose Field',
 *     validate: (data) => data.fieldId ? null : 'Please select a field',
 *   },
 *   {
 *     id: 'pick-slot',
 *     label: 'Pick Date & Time',
 *     validate: (data) => data.slot ? null : 'Please pick a time slot',
 *   },
 *   {
 *     id: 'extras',
 *     label: 'Add-ons',
 *     // No validate → always passable
 *   },
 *   {
 *     id: 'payment',
 *     label: 'Payment',
 *     validate: (data) => data.paymentMethod ? null : 'Choose a payment method',
 *   },
 *   {
 *     id: 'confirm',
 *     label: 'Confirm',
 *   },
 * ];
 *
 * const {
 *   step, stepIndex, totalSteps, progress,
 *   formData, updateFormData,
 *   canGoBack, canGoForward,
 *   goNext, goBack, goToStep,
 *   stepError, clearStepError,
 *   isSubmitting, submitError, isComplete,
 *   submit, reset,
 * } = useBookingWizard(STEPS, {
 *   draftKey: 'booking_draft',
 *   initialData: { userId: currentUser.id },
 *   onSubmit: async (data) => await api.createBooking(data),
 *   onComplete: () => navigate('/bookings'),
 * });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Deep-merge two plain objects. Arrays are replaced (not concatenated).
 */
function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  const result = { ...base };
  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    if (
      patchVal !== null &&
      typeof patchVal === 'object' &&
      !Array.isArray(patchVal) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], patchVal);
    } else {
      result[key] = patchVal;
    }
  }
  return result;
}

/**
 * Safe sessionStorage read — returns null if unavailable or JSON invalid.
 */
function sessionRead(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Safe sessionStorage write — silently fails if unavailable.
 */
function sessionWrite(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

/**
 * Safe sessionStorage remove.
 */
function sessionRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} WizardStep
 * @property {string}   id             - Unique step identifier
 * @property {string}   label          - Human-readable step name
 * @property {Function} [validate]     - (formData) => errorMessage | null
 * @property {boolean}  [optional]     - If true, validation failures are non-blocking
 */

/**
 * @typedef {object} UseBookingWizardOptions
 * @property {string}         [draftKey]     - sessionStorage key for draft persistence
 * @property {object}         [initialData]  - Pre-populated form data (e.g. userId)
 * @property {Function}       [onSubmit]     - async (formData) => any   — called on final submit
 * @property {Function}       [onComplete]   - () => void                — called after successful submit
 * @property {boolean}        [persistDraft] - Set false to disable sessionStorage draft (default: true)
 */

/**
 * @param {WizardStep[]}            steps
 * @param {UseBookingWizardOptions} [options={}]
 */
export function useBookingWizard(steps, options = {}) {
  const {
    draftKey = '__booking_wizard_draft__',
    initialData = {},
    onSubmit,
    onComplete,
    persistDraft = true,
  } = options;

  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('useBookingWizard: steps must be a non-empty array');
  }

  // ── Restore draft from sessionStorage ──────────────────────────────────────
  const savedDraft = persistDraft ? sessionRead(draftKey) : null;

  const [stepIndex, setStepIndex] = useState(() => {
    const saved = savedDraft?.stepIndex ?? 0;
    return Math.min(Math.max(0, saved), steps.length - 1);
  });

  const [formData, setFormData] = useState(() =>
    deepMerge(initialData, savedDraft?.formData ?? {})
  );

  const [stepError, setStepError]       = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState(null);
  const [isComplete, setIsComplete]     = useState(false);

  // Track visited steps so we can show partial completion indicators
  const [visitedSteps, setVisitedSteps] = useState(() => {
    const saved = savedDraft?.visitedSteps;
    return new Set(Array.isArray(saved) ? saved : [0]);
  });

  // Ref to always have the latest formData inside callbacks without stale closures
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // ── Draft persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!persistDraft || isComplete) return;
    sessionWrite(draftKey, {
      stepIndex,
      formData,
      visitedSteps: [...visitedSteps],
    });
  }, [stepIndex, formData, visitedSteps, draftKey, persistDraft, isComplete]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalSteps  = steps.length;
  const step        = steps[stepIndex];
  const progress    = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const canGoBack   = stepIndex > 0 && !isSubmitting;
  const canGoForward = stepIndex < totalSteps - 1;

  // ── Form data updater ───────────────────────────────────────────────────────
  /**
   * Merge a partial update into the accumulated form data.
   * Accepts an object or an updater function (data) => partialUpdate.
   *
   * @param {object|Function} patch
   */
  const updateFormData = useCallback((patch) => {
    setFormData((prev) => {
      const update = typeof patch === 'function' ? patch(prev) : patch;
      return deepMerge(prev, update);
    });
    // Clear step error when user makes changes
    setStepError(null);
  }, []);

  // ── Step validation runner ──────────────────────────────────────────────────
  const validateCurrentStep = useCallback(() => {
    const currentStep = steps[stepIndex];
    if (!currentStep?.validate) return true;

    const error = currentStep.validate(formDataRef.current);
    if (error) {
      if (!currentStep.optional) {
        setStepError(typeof error === 'string' ? error : 'Please complete this step before continuing.');
        return false;
      }
    }
    setStepError(null);
    return true;
  }, [steps, stepIndex]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (isSubmitting) return;
    if (!validateCurrentStep()) return;

    setStepIndex((prev) => {
      const next = Math.min(prev + 1, totalSteps - 1);
      setVisitedSteps((vs) => new Set([...vs, next]));
      return next;
    });
    setStepError(null);
  }, [isSubmitting, validateCurrentStep, totalSteps]);

  const goBack = useCallback(() => {
    if (isSubmitting || !canGoBack) return;
    setStepIndex((prev) => prev - 1);
    setStepError(null);
    setSubmitError(null);
  }, [isSubmitting, canGoBack]);

  /**
   * Jump to an arbitrary step by index.
   * Only allows jumping to already-visited steps (prevents skipping required steps).
   *
   * @param {number} index
   * @param {boolean} [force=false] - Bypass visited-step guard (for admin/testing)
   */
  const goToStep = useCallback(
    (index, force = false) => {
      if (isSubmitting) return;
      if (index < 0 || index >= totalSteps) return;
      if (!force && !visitedSteps.has(index) && index > stepIndex) {
        // Validate all steps in between before jumping forward
        for (let i = stepIndex; i < index; i++) {
          const s = steps[i];
          if (s?.validate && !s.optional) {
            const err = s.validate(formDataRef.current);
            if (err) {
              setStepIndex(i);
              setStepError(typeof err === 'string' ? err : 'Please complete this step.');
              return;
            }
          }
        }
      }
      setStepIndex(index);
      setVisitedSteps((vs) => new Set([...vs, index]));
      setStepError(null);
    },
    [isSubmitting, totalSteps, visitedSteps, stepIndex, steps]
  );

  // ── Submission ──────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (isSubmitting || isComplete) return;

    // Validate final step
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (onSubmit) {
        await onSubmit(formDataRef.current);
      }
      setIsComplete(true);
      // Clear draft on success
      if (persistDraft) sessionRemove(draftKey);
      if (onComplete) onComplete();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'An unexpected error occurred. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isComplete, validateCurrentStep, onSubmit, onComplete, persistDraft, draftKey]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  /**
   * Reset the wizard to its initial state and clear the persisted draft.
   */
  const reset = useCallback(() => {
    setStepIndex(0);
    setFormData(initialData);
    setStepError(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setIsComplete(false);
    setVisitedSteps(new Set([0]));
    if (persistDraft) sessionRemove(draftKey);
  }, [initialData, persistDraft, draftKey]);

  // ── Clear single step error ─────────────────────────────────────────────────
  const clearStepError = useCallback(() => setStepError(null), []);

  // ── Step status helpers ─────────────────────────────────────────────────────
  /**
   * Returns the status of a step by index:
   * 'completed' | 'current' | 'upcoming' | 'error'
   *
   * @param {number} index
   * @returns {'completed'|'current'|'upcoming'|'error'}
   */
  const getStepStatus = useCallback(
    (index) => {
      if (index === stepIndex) return stepError ? 'error' : 'current';
      if (visitedSteps.has(index) && index < stepIndex) return 'completed';
      return 'upcoming';
    },
    [stepIndex, stepError, visitedSteps]
  );

  /**
   * Build a step descriptor array for rendering a step indicator UI component.
   *
   * @returns {Array<{ id, label, index, status, isActive, isCompleted, isVisited }>}
   */
  const getStepDescriptors = useCallback(
    () =>
      steps.map((s, i) => ({
        id: s.id,
        label: s.label,
        index: i,
        status: getStepStatus(i),
        isActive: i === stepIndex,
        isCompleted: visitedSteps.has(i) && i < stepIndex,
        isVisited: visitedSteps.has(i),
        isOptional: s.optional ?? false,
      })),
    [steps, stepIndex, visitedSteps, getStepStatus]
  );

  return {
    // ── State ──
    step,
    stepIndex,
    totalSteps,
    progress,
    formData,
    visitedSteps,

    // ── Step error ──
    stepError,
    clearStepError,

    // ── Navigation ──
    canGoBack,
    canGoForward,
    goNext,
    goBack,
    goToStep,

    // ── Form data ──
    updateFormData,

    // ── Submission ──
    isSubmitting,
    submitError,
    isComplete,
    submit,

    // ── Utilities ──
    reset,
    getStepStatus,
    getStepDescriptors,
    validateCurrentStep,
  };
}

export default useBookingWizard;
