import Image from "next/image";
import { credit } from "@/lib/photos";

/**
 * next/image wrapper that pulls width, height and blur placeholder out of the
 * generated photo manifest, so every picture loads progressively.
 */
export default function Photo({
  src,
  alt,
  fill = true,
  sizes = "100vw",
  priority = false,
  className = "",
  imgClassName = "",
  quality = 72,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  quality?: number;
}) {
  const meta = credit(src);

  if (!fill) {
    return (
      <Image
        src={src}
        alt={alt}
        width={meta?.w ?? 1600}
        height={meta?.h ?? 1067}
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        placeholder={meta?.blur ? "blur" : undefined}
        blurDataURL={meta?.blur}
        className={imgClassName}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        placeholder={meta?.blur ? "blur" : undefined}
        blurDataURL={meta?.blur}
        className={`object-cover ${imgClassName}`}
      />
    </div>
  );
}
