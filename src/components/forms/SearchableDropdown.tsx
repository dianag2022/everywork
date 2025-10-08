import { useState, useRef, useEffect } from 'react';
import { Tag, ChevronDown, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface SearchableDropdownProps {
  categories: Category[];
  category: string;
  setCategory: (value: string) => void;
  categoriesLoading: boolean;
  categoriesError: string | null;
}

export function SearchableDropdown({ 
  categories, 
  category, 
  setCategory,
  categoriesLoading, 
  categoriesError 
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected category object
  const selectedCategory = categories.find(cat => cat.name === category);

  return (
    <div>
      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
        Categoría *
      </label>
      <div className="relative" ref={dropdownRef}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Tag className="h-5 w-5 text-gray-400" />
        </div>

        {/* Custom searchable input */}
        <div
          className={`w-full pl-12 pr-10 py-3 border rounded-xl transition-all duration-200 bg-gray-50 cursor-pointer ${
            isOpen ? 'ring-2 ring-purple-500 border-transparent bg-white' : 'border-gray-300'
          } ${categoriesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!categoriesLoading) {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setTimeout(() => inputRef.current?.focus(), 50);
              }
            }
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : (selectedCategory?.name || '')}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={categoriesLoading ? 'Cargando categorías...' : 'Selecciona o busca una categoría'}
            className="w-full bg-transparent outline-none"
            onFocus={() => setIsOpen(true)}
            disabled={categoriesLoading}
            required={!category}
          />
        </div>

        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Dropdown options with fixed height */}
        {isOpen && !categoriesLoading && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-30 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.name);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-purple-50 transition-colors ${
                    category === cat.name ? 'bg-purple-100' : ''
                  }`}
                  title={cat.description}
                >
                  <div className="font-medium text-gray-900">{cat.name}</div>
                  {cat.description && (
                    <div className="text-sm text-gray-500 mt-1">{cat.description}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                No se encontraron categorías
              </div>
            )}
          </div>
        )}
      </div>

      {categoriesError && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <X className="w-4 h-4 mr-1" />
          Error al cargar categorías: {categoriesError}
        </p>
      )}
    </div>
  );
}