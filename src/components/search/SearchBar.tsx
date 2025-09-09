"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    // Remove query param from URL when input is empty
    if (newQuery.trim() === '') {
      // Remove the query parameter by navigating to the current path without search params
      const currentPath = window.location.pathname
      router.replace(currentPath, { scroll: false })
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4 sm:px-0">
      <form onSubmit={handleSearch} className="relative">
        <div className={`
          flex items-center w-full bg-white rounded-full shadow-lg border-2 transition-all duration-300
          ${isFocused 
            ? 'border-blue-300 shadow-xl ring-4 ring-blue-100/50' 
            : 'border-blue-100 hover:border-blue-200 hover:shadow-xl'
          }
        `}>
          {/* Search Icon */}
          <div className="pl-4 sm:pl-6 pr-2 sm:pr-4">
            <Search className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${
              isFocused ? 'text-blue-600' : 'text-gray-400'
            }`} />
          </div>

          {/* Input Field */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Busca servicios: ej. diseño web, limpieza..."
            className="
              flex-1 py-3 sm:py-4 px-1 sm:px-2 text-gray-700 placeholder-gray-400 bg-transparent 
              border-none outline-none text-sm sm:text-base font-medium
              placeholder:text-xs sm:placeholder:text-sm
            "
          />

          {/* Search Button */}
          <button 
            type="submit" 
            disabled={!query.trim()}
            className={`
              m-1.5 sm:m-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm 
              transition-all duration-200 flex items-center space-x-1 sm:space-x-2 
              transform hover:scale-105 whitespace-nowrap
              ${query.trim()
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <span className="hidden xs:inline">Buscar</span>
            <Search className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Subtle gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </form>

      {/* Search suggestions or popular searches */}
      <div className="mt-4 flex flex-wrap justify-center gap-2 px-2">
        {['Diseño web', 'Limpieza', 'Fotografía', 'Reparaciones', 'Tutorías'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setQuery(suggestion)
              router.push(`/search?query=${encodeURIComponent(suggestion)}`)
            }}
            className="
              px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 bg-white/60 hover:bg-white 
              rounded-full border border-blue-100 hover:border-blue-200 
              transition-all duration-200 hover:shadow-md hover:scale-105
              backdrop-blur-sm whitespace-nowrap
            "
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}