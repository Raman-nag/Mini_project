import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchBar = ({
  placeholder = 'Search...',
  onSearch,
  onClear,
  debounceMs = 300,
  showClearButton = true,
  showSearchIcon = true,
  size = 'md',
  variant = 'default',
  className = '',
  suggestions = [],
  onSuggestionClick,
  showSuggestions = true,
  maxSuggestions = 5,
  ...props
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (onSearch && query.trim()) {
        onSearch(query.trim());
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  // Filter suggestions based on query
  useEffect(() => {
    if (query.trim() && suggestions.length > 0) {
      const filtered = suggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, maxSuggestions);
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [query, suggestions, maxSuggestions]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    setFilteredSuggestions([]);
    if (onClear) {
      onClear();
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setFilteredSuggestions([]);
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setFilteredSuggestions([]);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variants = {
    default: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    filled: 'bg-gray-100 border border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-blue-500',
    outline: 'bg-transparent border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    glassmorphism: 'bg-white/20 backdrop-blur-md border border-white/30 focus:bg-white/30 focus:border-white/50'
  };

  return (
    <div className={`relative ${className}`} {...props}>
      {/* Search Input */}
      <div className="relative">
        {showSearchIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full rounded-lg transition-all duration-200 focus:outline-none focus:ring-2
            ${showSearchIcon ? 'pl-10' : 'pl-4'}
            ${showClearButton && query ? 'pr-10' : 'pr-4'}
            ${sizes[size]}
            ${variants[variant]}
          `}
        />

        {showClearButton && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && isFocused && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 hover:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex items-center">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-3" />
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Medical-themed search bar
const MedicalSearchBar = ({
  type = 'patient',
  placeholder,
  className = '',
  ...props
}) => {
  const medicalTypes = {
    patient: {
      placeholder: placeholder || 'Search patients...',
      icon: '👤',
      color: 'from-green-50 to-emerald-50 border-green-200 focus:border-green-500'
    },
    doctor: {
      placeholder: placeholder || 'Search doctors...',
      icon: '👨‍⚕️',
      color: 'from-blue-50 to-indigo-50 border-blue-200 focus:border-blue-500'
    },
    hospital: {
      placeholder: placeholder || 'Search hospitals...',
      icon: '🏥',
      color: 'from-orange-50 to-amber-50 border-orange-200 focus:border-orange-500'
    },
    records: {
      placeholder: placeholder || 'Search medical records...',
      icon: '📋',
      color: 'from-purple-50 to-violet-50 border-purple-200 focus:border-purple-500'
    },
    prescriptions: {
      placeholder: placeholder || 'Search prescriptions...',
      icon: '💊',
      color: 'from-yellow-50 to-orange-50 border-yellow-200 focus:border-yellow-500'
    }
  };

  const config = medicalTypes[type] || medicalTypes.patient;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center mb-2">
        <span className="text-lg mr-2">{config.icon}</span>
        <span className="text-sm font-medium text-gray-700 capitalize">
          {type} Search
        </span>
      </div>
      <SearchBar
        placeholder={config.placeholder}
        className={`bg-gradient-to-r ${config.color} border-2`}
        {...props}
      />
    </div>
  );
};

// Advanced search with filters
const AdvancedSearchBar = ({
  filters = [],
  onFilterChange,
  onSearch,
  className = '',
  ...props
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value };
    setActiveFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <SearchBar onSearch={onSearch} {...props} />
      
      {filters.length > 0 && (
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {Object.keys(activeFilters).length > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {showFilters && filters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filter.label}
              </label>
              {filter.type === 'select' ? (
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={filter.type || 'text'}
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export all components
SearchBar.Medical = MedicalSearchBar;
SearchBar.Advanced = AdvancedSearchBar;

export default SearchBar;
