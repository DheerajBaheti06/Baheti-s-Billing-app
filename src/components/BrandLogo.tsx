import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
}

export function getGoogleDriveDirectLink(url: string): string {
  if (!url) return '';
  
  // Support extracting File ID from Google Drive share links
  const dRegex = /\/d\/([a-zA-Z0-9_-]{25,50})/;
  const idRegex = /[?&]id=([a-zA-Z0-9_-]{25,50})/;
  
  const dMatch = url.match(dRegex);
  const idMatch = url.match(idRegex);
  
  let fileId = '';
  if (dMatch && dMatch[1]) {
    fileId = dMatch[1];
  } else if (idMatch && idMatch[1]) {
    fileId = idMatch[1];
  } else if (/^[a-zA-Z0-9_-]{25,50}$/.test(url.trim())) {
    fileId = url.trim();
  }
  
  if (fileId) {
    // Utilizing the high-performance Google Drive thumbnail endpoint to load public images seamlessly
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  
  return url;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className, 
  size = 'md', 
  showBorder = true 
}) => {
  const { logoUrl } = useSettings();
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  // Re-evaluate image source when logoUrl changes
  useEffect(() => {
    setHasError(false);
    if (logoUrl) {
      setImgSrc(getGoogleDriveDirectLink(logoUrl));
    } else {
      setImgSrc('/logo.png');
    }
  }, [logoUrl]);

  // Dimensions based on size preset
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32 md:w-40 md:h-40',
  };

  const handleImgError = () => {
    if (!hasError) {
      if (logoUrl && imgSrc !== '/logo.png') {
        // Fall back from driver link to local logo.png if link fails
        setImgSrc('/logo.png');
      } else if (imgSrc === '/logo.png') {
        // Try fallback to logo.jpg or logo.jpeg representatively
        setImgSrc('/logo.jpg');
      } else if (imgSrc === '/logo.jpg') {
        setImgSrc('/logo.jpeg');
      } else {
        setHasError(true);
      }
    }
  };

  return (
    <div 
      className={cn(
        "relative rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-md select-none",
        showBorder && "ring-2 ring-primary/20 dark:ring-primary/40 p-0.5",
        sizeClasses[size],
        className
      )}
    >
      {!hasError && imgSrc ? (
        <img 
          src={imgSrc} 
          onError={handleImgError}
          alt="Baheti Logo" 
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        // High-fidelity vector SVG fallback simulating the sticker
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="#fefaf6" stroke="url(#goldGrad)" strokeWidth="2" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#ea580c" strokeWidth="0.5" strokeDasharray="1,1" />
          
          {/* Outer ring text simulation */}
          <path id="textPath" d="M 12,50 A 38,38 0 1,1 88,50" fill="none" />
          <text fontSize="4" fontWeight="bold" fill="#7c2d12" letterSpacing="0.2">
            <textPath href="#textPath" startOffset="50%" textAnchor="middle">
              BAHETI'S GRAHASTHI UDYOG
            </textPath>
          </text>
          
          {/* Inner details */}
          <circle cx="50" cy="51" r="28" fill="#ea580c" />
          
          {/* Cute stylized rolling pin/mortar or initials */}
          <text x="50" y="55" fontSize="11" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="-0.5">
            BGU
          </text>
          
          <path d="M 30,68 Q 50,78 70,68" fill="none" stroke="#b45309" strokeWidth="1" />
          <text x="50" y="78" fontSize="3" fontWeight="bold" fill="#b45309" textAnchor="middle">
            TRUST OF PURITY
          </text>
        </svg>
      )}
    </div>
  );
};
