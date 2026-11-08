import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AssetIconProps {
  /** Nume cheie pentru un asset .png opțional (ex: 'math', 'romanian', 'catalog', 'grade') */
  assetKey?: string;
  /** Pictograma fallback Lucide când imaginea .png nu este furnizată */
  fallbackIcon: LucideIcon;
  size?: number;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * Registry modular de imagini .png.
 * Când adaugi fișiere .png în `src/assets/icons/`,
 * le poți importa sau înregistra direct aici!
 */
export const ASSET_REGISTRY: Record<string, string> = {
  // Exemplu când adaugi fișiere:
  // catalog: new URL('../assets/icons/catalog.png', import.meta.url).href,
  // timetable: new URL('../assets/icons/timetable.png', import.meta.url).href,
};

export const AssetIcon: React.FC<AssetIconProps> = ({
  assetKey,
  fallbackIcon: FallbackIcon,
  size = 18,
  className,
  alt = '',
  style,
}) => {
  const customImgSrc = assetKey ? ASSET_REGISTRY[assetKey] : undefined;

  if (customImgSrc) {
    return (
      <img
        src={customImgSrc}
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle', ...style }}
      />
    );
  }

  return <FallbackIcon size={size} className={className} style={style} />;
};

