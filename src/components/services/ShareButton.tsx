// ShareButton Component - components/ShareButton.tsx
'use client'

import { Link2, Check } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonProps {
    url?: string
    title?: string
}

export default function ShareButton({ url, title }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleCopyLink = async () => {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : url || ''
        
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => {
                setCopied(false)
            }, 2000)
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = shareUrl
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            document.body.appendChild(textArea)
            textArea.select()
            try {
                document.execCommand('copy')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch (err) {
                console.error('Failed to copy:', err)
            }
            document.body.removeChild(textArea)
        }
    }

    return (
        <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            type="button"
            title={copied ? "¡Enlace copiado!" : "Copiar enlace para compartir"}
        >
            {copied ? (
                <>
                    <Check className="w-5 h-5" />
                    <span>¡Copiado!</span>
                </>
            ) : (
                <>
                    <Link2 className="w-5 h-5" />
                    <span>Compartir</span>
                </>
            )}
        </button>
    )
}
