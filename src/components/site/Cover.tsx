import { Disc3 } from "lucide-react";

import { useSignedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function Cover({
  path,
  alt,
  className,
  sizes,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const { data: url, isPending } = useSignedUrl("covers", path);

  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      {url ? (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted-foreground/40">
          {path && isPending ? (
            <div className="h-full w-full animate-pulse bg-surface-2" />
          ) : (
            <Disc3 className="size-10" aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  );
}
