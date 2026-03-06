import type { Route } from "next";

function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getModelSlugSegment(modelName: string, modelId: string): string {
  const slug = slugifySegment(modelName);
  return slug.length > 0 ? `${slug}--${modelId}` : modelId;
}

export function getModelDetailRoute(modelName: string, modelId: string): Route {
  return `/models/${getModelSlugSegment(modelName, modelId)}` as Route;
}

export function getModelIdFromSegment(segment: string): string {
  const separatorIndex = segment.lastIndexOf("--");
  return separatorIndex === -1 ? segment : segment.slice(separatorIndex + 2);
}
