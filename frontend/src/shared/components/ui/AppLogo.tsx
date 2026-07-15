import Image from 'next/image';
import { cn } from '@/lib/utils';

export const APP_NAME = 'Planora';

const LOGO_SIZES = {
  xs: 28,
  sm: 32,
  md: 40,
} as const;

type AppLogoSize = keyof typeof LOGO_SIZES;

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
}

export function AppLogo({ size = 'sm', className }: AppLogoProps) {
  const dimension = LOGO_SIZES[size];

  return (
    <Image
      src="/logo.webp"
      alt={APP_NAME}
      width={dimension}
      height={dimension}
      className={cn('shrink-0 object-contain', className)}
      priority={size === 'sm'}
    />
  );
}
