import { useEffect, useState } from "react"

// Compact Price Range Component for Sidebar
export default function PriceRangeInputs({
    minPrice,
    maxPrice,
    onRangeChange,
    className = ""
}: {
    minPrice: number
    maxPrice: number
    onRangeChange: (min: number, max: number) => void
    className?: string
}) {
    const [tempMin, setTempMin] = useState(minPrice.toString())
    const [tempMax, setTempMax] = useState(maxPrice.toString())

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price)
    }

    // Sync local state with props when they change externally
    useEffect(() => {
        setTempMin(minPrice.toString())
        setTempMax(maxPrice.toString())
    }, [minPrice, maxPrice])

    // Debounce the price range changes - only triggers after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            const minNum = parseInt(tempMin) || 0
            const maxNum = parseInt(tempMax) || 10000000

            // Only trigger if values actually changed
            if (minNum !== minPrice || maxNum !== maxPrice) {
                onRangeChange(minNum, maxNum)
            }
        }, 800) // Wait 800ms after user stops typing

        return () => clearTimeout(timer)
    }, [tempMin, tempMax])

    const handleMinChange = (value: string) => {
        const numericValue = value.replace(/[^\d]/g, '')
        setTempMin(numericValue)
    }

    const handleMaxChange = (value: string) => {
        const numericValue = value.replace(/[^\d]/g, '')
        setTempMax(numericValue)
    }

    const clearFilters = () => {
        setTempMin('0')
        setTempMax('10000000')
        onRangeChange(0, 10000000)
    }

    const handlePresetClick = (min: number, max: number) => {
        setTempMin(min.toString())
        setTempMax(max.toString())
        // Immediate update for preset buttons
        onRangeChange(min, max)
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="space-y-2">
                <div className="space-y-1">
                    <label className="text-xs text-gray-600 font-medium">Precio mínimo</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                        <input
                            type="text"
                            value={tempMin}
                            onChange={(e) => handleMinChange(e.target.value)}
                            className="text-gray-700 placeholder-gray-400 w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-gray-600 font-medium">Precio máximo</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                        <input
                            type="text"
                            value={tempMax}
                            onChange={(e) => handleMaxChange(e.target.value)}
                            className="text-gray-700 placeholder-gray-400 w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                            placeholder="Sin límite"
                        />
                    </div>
                </div>
            </div>

            {(parseInt(tempMin) > 0 || parseInt(tempMax) < 10000000) && (
                <div className="text-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-xs font-medium text-blue-700">
                        {formatPrice(parseInt(tempMin) || 0)} a {formatPrice(parseInt(tempMax) || 10000000)}
                    </span>
                </div>
            )}

            <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Rangos rápidos</p>
                <div className="flex flex-col gap-2">
                    {[
                        { label: "Hasta $50k", min: 0, max: 50000 },
                        { label: "$50k - $200k", min: 50000, max: 200000 },
                        { label: "$200k - $500k", min: 200000, max: 500000 },
                        { label: "Más de $500k", min: 500000, max: 10000000 }
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => handlePresetClick(preset.min, preset.max)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 text-left font-medium"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200 font-medium"
            >
                Limpiar filtro de precio
            </button>
        </div>
    )
}