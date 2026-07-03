import { useState, useCallback } from 'react';

/**
 * useDisclosure Hook
 * Premium Sports Field Booking Platform
 *
 * Manages the open/closed/toggled state of UI elements such as modals,
 * drawers, dropdowns, and tooltips. A clean alternative to manually
 * writing `const [isOpen, setIsOpen] = useState(false)` everywhere.
 *
 * @param {boolean} [initialState=false] - Whether the element starts open.
 * @returns {{ isOpen: boolean, open: Function, close: Function, toggle: Function, onOpenChange: Function }}
 *
 * @example
 * const { isOpen, open, close, toggle } = useDisclosure();
 * <button onClick={open}>Open Modal</button>
 * <Modal open={isOpen} onClose={close} />
 */
const useDisclosure = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Useful for controlled components that pass a boolean setter (e.g. Radix UI)
  const onOpenChange = useCallback((value) => setIsOpen(Boolean(value)), []);

  return { isOpen, open, close, toggle, onOpenChange };
};

export default useDisclosure;
