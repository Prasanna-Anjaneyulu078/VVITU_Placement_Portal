import React from 'react';
import { Search, X } from 'lucide-react';
import './SearchInput.css';

export default function SearchInput({ 
  value = '', 
  onChange, 
  onClear,
  placeholder = "Search...", 
  className = "",
  ariaLabel = "Search input",
  ...props 
}) {
  const handleClear = (e) => {
    e.preventDefault();
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`search-input-wrapper relative flex items-center w-full min-w-0 ${className}`}>
      <Search className="search-input-icon absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={17} />
      <input 
        type="text" 
        className="search-input-field w-full min-h-[44px] h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 focus:bg-white transition-all shadow-2xs"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 bg-slate-200/60 hover:bg-slate-200 rounded-full transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
          title="Clear search"
          aria-label="Clear search text"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
