import { useReducer, useCallback } from 'react';

/**
 * useFormState Hook
 * Premium Sports Field Booking Platform
 *
 * A lightweight, structured form state manager using useReducer.
 * Handles field values, validation errors, touched states, and
 * submission status — without pulling in a full form library.
 * Ideal for simple to medium complexity forms.
 *
 * @param {object} initialValues - Initial field values.
 * @param {Function} [validate]  - (values) => errors object. Return {} if valid.
 *
 * @returns {{
 *   values: object,
 *   errors: object,
 *   touched: object,
 *   isSubmitting: boolean,
 *   isValid: boolean,
 *   handleChange: Function,
 *   handleBlur: Function,
 *   setFieldValue: Function,
 *   setFieldError: Function,
 *   reset: Function,
 *   handleSubmit: Function,
 * }}
 *
 * @example
 * const { values, errors, handleChange, handleSubmit } = useFormState(
 *   { email: '', password: '' },
 *   (v) => {
 *     const e = {};
 *     if (!v.email) e.email = 'Email is required';
 *     return e;
 *   }
 * );
 */
const ACTIONS = {
  SET_FIELD: 'SET_FIELD',
  SET_ERROR: 'SET_ERROR',
  SET_TOUCHED: 'SET_TOUCHED',
  SET_SUBMITTING: 'SET_SUBMITTING',
  RESET: 'RESET',
};

const createInitialState = (initialValues) => ({
  values: { ...initialValues },
  errors: {},
  touched: {},
  isSubmitting: false,
});

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_FIELD:
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case ACTIONS.SET_ERROR:
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case ACTIONS.SET_TOUCHED:
      return { ...state, touched: { ...state.touched, [action.field]: true } };
    case ACTIONS.SET_SUBMITTING:
      return { ...state, isSubmitting: action.value };
    case ACTIONS.RESET:
      return createInitialState(action.initialValues);
    default:
      return state;
  }
};

const useFormState = (initialValues = {}, validate) => {
  const [state, dispatch] = useReducer(reducer, createInitialState(initialValues));

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    dispatch({ type: ACTIONS.SET_FIELD, field: name, value: type === 'checkbox' ? checked : value });
  }, []);

  const handleBlur = useCallback((e) => {
    dispatch({ type: ACTIONS.SET_TOUCHED, field: e.target.name });
  }, []);

  const setFieldValue = useCallback((field, value) => {
    dispatch({ type: ACTIONS.SET_FIELD, field, value });
  }, []);

  const setFieldError = useCallback((field, error) => {
    dispatch({ type: ACTIONS.SET_ERROR, field, error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET, initialValues });
  }, [initialValues]);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e?.preventDefault?.();

    // Run validation if provided
    const errors = validate ? validate(state.values) : {};
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, error]) => {
        dispatch({ type: ACTIONS.SET_ERROR, field, error });
        dispatch({ type: ACTIONS.SET_TOUCHED, field });
      });
      return;
    }

    dispatch({ type: ACTIONS.SET_SUBMITTING, value: true });
    try {
      await onSubmit(state.values);
    } finally {
      dispatch({ type: ACTIONS.SET_SUBMITTING, value: false });
    }
  }, [state.values, validate]);

  const errors = validate ? validate(state.values) : state.errors;
  const isValid = Object.keys(errors).length === 0;

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    reset,
    handleSubmit,
  };
};

export default useFormState;
