import {  Instagram, Facebook, Music, Music2  } from 'lucide-react'

interface SocialMediaLinkProps {
  name: string;
  url: string;
}

export function SocialMediaLink({ name, url }: SocialMediaLinkProps) {
  const platforms = {
    instagram: {
      name: 'Instagram',
      icon: Instagram,
      gradient: 'from-pink-500 to-purple-600',
      bgColor: 'from-pink-50 to-purple-50',
      hoverBg: 'hover:from-pink-100 hover:to-purple-100',
      borderColor: 'border-pink-200',
      hoverBorder: 'hover:border-pink-400',
    },
    facebook: {
      name: 'Facebook',
      icon: Facebook,
      gradient: 'from-blue-500 to-blue-700',
      bgColor: 'from-blue-50 to-blue-100',
      hoverBg: 'hover:from-blue-100 hover:to-blue-200',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
    },
    tiktok: {
      name: 'TikTok',
      icon: Music2,
      gradient: 'from-gray-800 to-pink-600',
      bgColor: 'from-gray-50 to-pink-50',
      hoverBg: 'hover:from-gray-100 hover:to-pink-100',
      borderColor: 'border-gray-300',
      hoverBorder: 'hover:border-pink-400',
    },
  };

  const config = platforms[name as keyof typeof platforms];
  const Icon = config?.icon;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center p-4 rounded-2xl border-2 bg-gradient-to-br ${config.bgColor} ${config.borderColor} ${config.hoverBg} ${config.hoverBorder} transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500 font-medium">Síguenos en</div>
        <div className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
          {config.name}
        </div>
      </div>
      <svg 
        className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}