/**
 * @fileoverview Gallery components barrel exports
 *
 * Server Components (can be rendered on the server for better performance):
 * - PodiumCard - Top 3 podium display card
 * - TopGamesSection - Section displaying top 3 games
 * - AllGamesSection - Section displaying remaining games
 * - ForksSection - Section displaying prompt forks
 *
 * Client Components (require client-side interactivity):
 * - HeroSection - Has onClick handlers for play/fork/share
 * - NoGamesEmpty - Has onClick handler for fork action
 * - useGalleryData - Hook using React Query for data fetching
 */

// Server Components
export { PodiumCard } from "./podium-card";
export type { PodiumCardProps } from "./podium-card";

export { TopGamesSection } from "./top-games-section";
export type { TopGamesSectionProps } from "./top-games-section";

export { AllGamesSection } from "./all-games-section";
export type { AllGamesSectionProps } from "./all-games-section";

export { ForksSection } from "./forks-section";
export type { ForksSectionProps } from "./forks-section";

// Client Components
export { HeroSection } from "./hero-section";
export type { HeroSectionProps } from "./hero-section";

export { NoGamesEmpty } from "./no-games-empty";

// Hooks
export { useGalleryData } from "./use-gallery-data";
