import Image, { type ImageProps } from 'next/image';
import { getAssetUrl } from '@/lib/assets';

type AssetImageProps = Omit<ImageProps, 'src'> & {
  src: string;
  resolveAsset?: boolean;
};

export function AssetImage({
  src,
  resolveAsset = true,
  alt,
  ...props
}: AssetImageProps) {
  const resolvedSrc = resolveAsset ? getAssetUrl(src) : src;

  return <Image src={resolvedSrc} alt={alt} {...props} />;
}
