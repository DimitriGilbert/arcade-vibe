import Link from "next/link";
import { getModelDetailRoute } from "@/lib/model-routes";

export interface EntrySubtitleProps {
  creator: {
    name: string;
  };
  model?: {
    id: string;
    name: string;
  } | null;
  tier?: {
    slug: string;
  } | null;
  showLinks?: boolean;
}

export function EntrySubtitle({
  creator,
  model,
  tier,
  showLinks = false,
}: EntrySubtitleProps) {
  const creatorElement = showLinks ? (
    <Link
      href={`/profile/${creator.name}`}
      className="hover:text-[var(--primary)] transition-colors"
    >
      {creator.name}
    </Link>
  ) : (
    <span>{creator.name}</span>
  );

  const modelElement = model
    ? showLinks
      ? (
        <Link
          href={getModelDetailRoute(model.name, model.id)}
          className="hover:text-[var(--primary)] transition-colors"
        >
          {model.name}
        </Link>
      )
      : (
        <span>{model.name}</span>
      )
    : null;

  const tierElement = tier ? <span>{tier.slug}</span> : null;

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
      {creatorElement}
      {modelElement && (
        <>
          <span className="text-[var(--muted)]">|</span>
          {modelElement}
        </>
      )}
      {tierElement && (
        <>
          <span className="text-[var(--muted)]">|</span>
          {tierElement}
        </>
      )}
    </div>
  );
}
