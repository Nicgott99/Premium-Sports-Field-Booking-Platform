/**
 * MultiSelect.jsx — Multi-Select Dropdown Component
 * Premium Sports Booking Platform
 *
 * A fully accessible, searchable multi-select dropdown with:
 *  - Chip display for selected values (with individual remove)
 *  - Searchable option list with real-time filtering
 *  - Select All / Clear All controls
 *  - Keyboard navigation (Arrow keys, Enter, Escape, Backspace to remove last chip)
 *  - Max selection limit with visual feedback
 *  - Grouped options support
 *  - Click-outside to close
 *  - Zero external dependencies
 *  - Dark-theme premium styling consistent with the platform design system
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * // Flat options
 * <MultiSelect
 *   options={[
 *     { value: 'football', label: 'Football' },
 *     { value: 'cricket',  label: 'Cricket'  },
 *     { value: 'tennis',   label: 'Tennis'   },
 *   ]}
 *   value={['football', 'cricket']}
 *   onChange={(values) => setSports(values)}
 *   placeholder="Select sports..."
 *   maxSelect={3}
 * />
 *
 * // Grouped options
 * <MultiSelect
 *   options={[
 *     { group: 'Team Sports',       value: 'football', label: 'Football' },
 *     { group: 'Team Sports',       value: 'cricket',  label: 'Cricket'  },
 *     { group: 'Individual Sports', value: 'tennis',   label: 'Tennis'   },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';

// ─── MultiSelect Component ────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {Option[]} props.options          - List of selectable options
 * @param {string[]} props.value            - Currently selected values (controlled)
 * @param {Function} props.onChange         - (newValues: string[]) => void
 * @param {string}   [props.placeholder]    - Shown when nothing is selected
 * @param {string}   [props.searchPlaceholder]
 * @param {number}   [props.maxSelect]      - Maximum number of selections allowed
 * @param {boolean}  [props.disabled]
 * @param {string}   [props.label]          - Visible label above the control
 * @param {string}   [props.error]          - Error message below the control
 * @param {boolean}  [props.allowSelectAll] - Show "Select All" option (default: true)
 * @param {string}   [props.className]
 * @param {string}   [props.id]
 *
 * @typedef {object} Option
 * @property {string}  value
 * @property {string}  label
 * @property {string}  [group]
 * @property {boolean} [disabled]
 * @property {string}  [icon]
 */
export function MultiSelect({
  options = [],
  value   = [],
  onChange,
  placeholder        = 'Select options...',
  searchPlaceholder  = 'Search...',
  maxSelect,
  disabled           = false,
  label,
  error,
  allowSelectAll     = true,
  className          = '',
  id: externalId,
}) {
  const generatedId = useId();
  const id          = externalId ?? generatedId;

  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef  = useRef(null);
  const searchRef     = useRef(null);
  const listRef       = useRef(null);

  const selectedSet = useMemo(() => new Set(value), [value]);

  // ── Filter & group options ────────────────────────────────────────────────
  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return options.filter(
      (o) => !q || o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const groupedOptions = useMemo(() => {
    const groups = new Map();
    for (const opt of filteredOptions) {
      const group = opt.group ?? '__ungrouped__';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(opt);
    }
    return groups;
  }, [filteredOptions]);

  const flatFiltered = filteredOptions; // for keyboard index tracking

  // ── Open/close ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    setFocusedIndex(-1);
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Toggle option ─────────────────────────────────────────────────────────
  const toggleOption = useCallback((optValue) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(optValue)) {
      next.delete(optValue);
    } else {
      if (maxSelect != null && next.size >= maxSelect) return;
      next.add(optValue);
    }
    onChange?.([...next]);
  }, [disabled, selectedSet, maxSelect, onChange]);

  const removeChip = useCallback((optValue, e) => {
    e?.stopPropagation();
    const next = new Set(selectedSet);
    next.delete(optValue);
    onChange?.([...next]);
  }, [selectedSet, onChange]);

  const selectAll = useCallback(() => {
    const eligible = flatFiltered.filter((o) => !o.disabled);
    if (maxSelect != null) {
      onChange?.(eligible.slice(0, maxSelect).map((o) => o.value));
    } else {
      onChange?.(eligible.map((o) => o.value));
    }
  }, [flatFiltered, maxSelect, onChange]);

  const clearAll = useCallback(() => onChange?.([]), [onChange]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setOpen(false);
        setSearch('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && flatFiltered[focusedIndex]) {
          toggleOption(flatFiltered[focusedIndex].value);
        }
        break;
      case 'Backspace':
        if (search === '' && value.length > 0) {
          removeChip(value[value.length - 1]);
        }
        break;
      default:
        break;
    }
  }, [open, flatFiltered, focusedIndex, toggleOption, search, value, removeChip]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.querySelector(`[data-index="${focusedIndex}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  // ── Chip labels ───────────────────────────────────────────────────────────
  const selectedOptions = useMemo(
    () => value.map((v) => options.find((o) => o.value === v)).filter(Boolean),
    [value, options]
  );

  const atMax = maxSelect != null && value.length >= maxSelect;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={`ms-wrapper ${className}`} id={id}>
      {label && (
        <label className="ms-label" htmlFor={`${id}-search`}>
          {label}
          {maxSelect && <span className="ms-limit"> (max {maxSelect})</span>}
        </label>
      )}

      {/* Trigger box */}
      <div
        className={`ms-control ${open ? 'ms-control--open' : ''} ${disabled ? 'ms-control--disabled' : ''} ${error ? 'ms-control--error' : ''}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={label ? `${id}-label` : undefined}
      >
        <div className="ms-chips">
          {selectedOptions.length === 0 && (
            <span className="ms-placeholder">{placeholder}</span>
          )}
          {selectedOptions.map((opt) => (
            <span key={opt.value} className="ms-chip">
              {opt.icon && <span className="ms-chip-icon">{opt.icon}</span>}
              {opt.label}
              <button
                type="button"
                className="ms-chip-remove"
                onClick={(e) => removeChip(opt.value, e)}
                aria-label={`Remove ${opt.label}`}
                tabIndex={-1}
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="ms-controls-right">
          {value.length > 0 && (
            <button
              type="button"
              className="ms-clear-btn"
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              aria-label="Clear all"
              tabIndex={-1}
            >
              ✕
            </button>
          )}
          <span className="ms-chevron" aria-hidden="true">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="ms-dropdown" role="listbox" aria-multiselectable="true">
          {/* Search input */}
          <div className="ms-search-wrap">
            <span className="ms-search-icon" aria-hidden="true">🔍</span>
            <input
              ref={searchRef}
              id={`${id}-search`}
              type="text"
              className="ms-search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFocusedIndex(-1); }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
          </div>

          {/* Select all / count bar */}
          {filteredOptions.length > 0 && (
            <div className="ms-meta-bar">
              <span className="ms-count">{value.length} selected{maxSelect ? ` / ${maxSelect}` : ''}</span>
              <div className="ms-meta-actions">
                {allowSelectAll && !atMax && (
                  <button type="button" className="ms-meta-btn" onClick={selectAll}>
                    Select all
                  </button>
                )}
                {value.length > 0 && (
                  <button type="button" className="ms-meta-btn ms-meta-btn--danger" onClick={clearAll}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="ms-list" ref={listRef}>
            {filteredOptions.length === 0 ? (
              <div className="ms-no-results">No options found</div>
            ) : (
              [...groupedOptions.entries()].map(([group, groupOpts]) => (
                <div key={group}>
                  {group !== '__ungrouped__' && (
                    <div className="ms-group-label">{group}</div>
                  )}
                  {groupOpts.map((opt) => {
                    const flatIdx   = flatFiltered.indexOf(opt);
                    const isChecked = selectedSet.has(opt.value);
                    const isDisabled = opt.disabled || (!isChecked && atMax);
                    const isFocused = flatIdx === focusedIndex;

                    return (
                      <div
                        key={opt.value}
                        data-index={flatIdx}
                        className={`ms-option ${isChecked ? 'ms-option--checked' : ''} ${isDisabled ? 'ms-option--disabled' : ''} ${isFocused ? 'ms-option--focused' : ''}`}
                        onClick={() => !isDisabled && toggleOption(opt.value)}
                        role="option"
                        aria-selected={isChecked}
                        aria-disabled={isDisabled}
                      >
                        <span className={`ms-checkbox ${isChecked ? 'ms-checkbox--checked' : ''}`} aria-hidden="true">
                          {isChecked && '✓'}
                        </span>
                        {opt.icon && <span className="ms-opt-icon">{opt.icon}</span>}
                        <span className="ms-opt-label">{opt.label}</span>
                        {isChecked && <span className="ms-opt-tick" aria-hidden="true" />}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && <span className="ms-error" role="alert">{error}</span>}

      {/* Scoped styles */}
      <style>{`
        .ms-wrapper { position: relative; display: block; font-family: inherit; }

        .ms-label {
          display: block; font-size: 13px; font-weight: 500; color: #94a3b8;
          margin-bottom: 6px; letter-spacing: 0.02em;
        }
        .ms-limit { color: #64748b; font-weight: 400; }

        .ms-control {
          display: flex; align-items: center; gap: 8px; min-height: 44px;
          padding: 6px 10px 6px 12px; border-radius: 10px; cursor: pointer;
          background: #1a1f2e; border: 1.5px solid #2d3548; color: #e2e8f0;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none;
        }
        .ms-control:focus-visible { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .ms-control:hover:not(.ms-control--disabled) { border-color: #4b5680; }
        .ms-control--open { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .ms-control--error { border-color: #ef4444; }
        .ms-control--disabled { opacity: 0.5; cursor: not-allowed; }

        .ms-chips { display: flex; flex-wrap: wrap; gap: 5px; flex: 1; min-width: 0; }
        .ms-placeholder { color: #64748b; font-size: 14px; align-self: center; }

        .ms-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px 3px 10px; border-radius: 20px;
          background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4);
          color: #a5b4fc; font-size: 12px; font-weight: 500;
          animation: ms-chip-in 0.15s ease;
        }
        @keyframes ms-chip-in { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
        .ms-chip-icon { font-size: 13px; }
        .ms-chip-remove {
          background: none; border: none; cursor: pointer; color: #818cf8;
          padding: 0 0 0 2px; font-size: 10px; line-height: 1; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .ms-chip-remove:hover { color: #e2e8f0; background: rgba(255,255,255,0.15); }

        .ms-controls-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: auto; }
        .ms-clear-btn {
          background: none; border: none; color: #64748b; cursor: pointer;
          padding: 2px 5px; border-radius: 4px; font-size: 12px;
        }
        .ms-clear-btn:hover { color: #e2e8f0; background: rgba(255,255,255,0.1); }
        .ms-chevron { font-size: 10px; color: #64748b; transition: transform 0.2s; }

        .ms-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 9999;
          background: #1a1f2e; border: 1.5px solid #2d3548; border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
          animation: ms-drop-in 0.15s ease; overflow: hidden;
        }
        @keyframes ms-drop-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

        .ms-search-wrap {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border-bottom: 1px solid #2d3548;
        }
        .ms-search-icon { font-size: 13px; flex-shrink: 0; }
        .ms-search {
          flex: 1; background: none; border: none; outline: none;
          color: #e2e8f0; font-size: 14px; font-family: inherit;
        }
        .ms-search::placeholder { color: #64748b; }

        .ms-meta-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 12px; border-bottom: 1px solid #2d3548;
          background: rgba(255,255,255,0.02);
        }
        .ms-count { font-size: 11px; color: #64748b; }
        .ms-meta-actions { display: flex; gap: 8px; }
        .ms-meta-btn {
          background: none; border: none; cursor: pointer; font-size: 11px;
          color: #818cf8; font-weight: 500; padding: 2px 6px; border-radius: 4px;
        }
        .ms-meta-btn:hover { background: rgba(99,102,241,0.15); }
        .ms-meta-btn--danger { color: #f87171; }
        .ms-meta-btn--danger:hover { background: rgba(248,113,113,0.1); }

        .ms-list { max-height: 220px; overflow-y: auto; padding: 6px 0; }
        .ms-list::-webkit-scrollbar { width: 4px; }
        .ms-list::-webkit-scrollbar-track { background: transparent; }
        .ms-list::-webkit-scrollbar-thumb { background: #2d3548; border-radius: 2px; }

        .ms-group-label {
          padding: 8px 14px 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          color: #64748b; text-transform: uppercase;
        }

        .ms-option {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 14px; cursor: pointer; transition: background 0.1s;
          font-size: 14px; color: #cbd5e1;
        }
        .ms-option:hover:not(.ms-option--disabled) { background: rgba(99,102,241,0.1); color: #e2e8f0; }
        .ms-option--checked { color: #a5b4fc; }
        .ms-option--focused { background: rgba(99,102,241,0.12); }
        .ms-option--disabled { opacity: 0.4; cursor: not-allowed; }

        .ms-checkbox {
          width: 16px; height: 16px; flex-shrink: 0; border-radius: 4px; font-size: 11px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #4b5680; transition: all 0.15s; font-weight: 700; color: #fff;
        }
        .ms-checkbox--checked { background: #6366f1; border-color: #6366f1; }

        .ms-opt-icon { font-size: 15px; flex-shrink: 0; }
        .ms-opt-label { flex: 1; }

        .ms-no-results { padding: 16px; text-align: center; color: #64748b; font-size: 13px; }
        .ms-error { display: block; margin-top: 5px; font-size: 12px; color: #ef4444; }
      `}</style>
    </div>
  );
}

export default MultiSelect;
