import React from 'react';
import { Search } from 'lucide-react';
import './SearchInput.css';

export default function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "",
  ...props 
}) {
  return (
    <div className={`search-input-wrapper ${className}`}>
      <Search className="search-input-icon" size={18} />
      <input 
        type="text" 
        className="search-input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}
