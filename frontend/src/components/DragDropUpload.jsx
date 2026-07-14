import React, { useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * DragDropUpload Component
 * Premium Sports Field Booking Platform
 *
 * A styled drag-and-drop file upload zone that also supports clicking to
 * browse. Accepts MIME type and file count restrictions. Styled for the
 * premium dark theme with amber accent on drag-over.
 *
 * @example
 * <DragDropUpload
 *   accept="image/*"
 *   multiple
 *   maxFiles={5}
 *   onFilesSelected={(files) => handleUpload(files)}
 * />
 */
const DragDropUpload = ({
  accept = '*/*',
  multiple = false,
  maxFiles = 1,
  onFilesSelected,
  disabled = false,
  label = 'Drag & drop files here, or click to browse',
  sublabel = '',
  className = '',
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const processFiles = (fileList) => {
    const arr = Array.from(fileList).slice(0, maxFiles);
    if (arr.length && onFilesSelected) onFilesSelected(arr);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e) => processFiles(e.target.files);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="File upload drop zone"
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed
        px-6 py-10 text-center transition-all duration-200 cursor-pointer select-none
        ${isDragging
          ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
          : 'border-gray-700 bg-gray-900/40 hover:border-gray-500 hover:bg-gray-800/40'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
    >
      {/* Upload icon */}
      <div className={`rounded-full p-3 transition-colors ${isDragging ? 'bg-amber-500/20' : 'bg-gray-800'}`}>
        <svg className={`w-7 h-7 ${isDragging ? 'text-amber-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <div>
        <p className={`text-sm font-medium ${isDragging ? 'text-amber-300' : 'text-gray-300'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
        tabIndex={-1}
      />
    </div>
  );
};

DragDropUpload.propTypes = {
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  maxFiles: PropTypes.number,
  onFilesSelected: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  sublabel: PropTypes.string,
  className: PropTypes.string,
};

export default DragDropUpload;
