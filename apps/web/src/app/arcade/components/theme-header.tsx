import {
  ArcadeBadge,
  ArcadeButton,
  ArcadeTabs,
  ArcadeTabsList,
  ArcadeTabsTrigger,
} from "@/components/arcade";
import { Calendar, Archive, Sparkles } from "lucide-react";
import type { ThemeList } from "@/types/entities";

interface ThemeHeaderProps {
  currentTheme: ThemeList | null;
  archivedThemes: ThemeList[];
  selectedThemeId: string;
  themeStatus: "current" | "archived";
  onThemeSelect: (themeId: string) => void;
  onThemeStatusChange: (status: "current" | "archived") => void;
  isLoading: boolean;
}

export function ThemeHeader({
  currentTheme,
  archivedThemes,
  selectedThemeId,
  themeStatus,
  onThemeSelect,
  onThemeStatusChange,
  isLoading,
}: ThemeHeaderProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 mb-6">
        <div className="h-8 bg-[var(--muted)]/60 rounded w-1/4" />
        <div className="h-24 bg-[var(--muted)]/60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Theme Tabs */}
      <div className="flex items-center justify-between">
        <ArcadeTabs
          value={themeStatus}
          onValueChange={(value) =>
            onThemeStatusChange(value as "current" | "archived")
          }
        >
          <ArcadeTabsList>
            <ArcadeTabsTrigger value="current" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Current
            </ArcadeTabsTrigger>
            <ArcadeTabsTrigger value="archived" className="gap-2">
              <Archive className="h-4 w-4" />
              Archived
            </ArcadeTabsTrigger>
          </ArcadeTabsList>
        </ArcadeTabs>
      </div>

      {/* Current Theme Card */}
      {themeStatus === "current" && (
        <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-lg">
          {currentTheme ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{currentTheme.title}</h2>
                    <ArcadeBadge text="Active" variant="neon" />
                  </div>
                  <p className="text-[var(--muted-foreground)]">
                    {currentTheme.description}
                  </p>
                </div>
              </div>

              {/* Theme Dates */}
              {(currentTheme.startDate || currentTheme.endDate) && (
                <div className="flex items-center gap-6 text-sm">
                  {currentTheme.startDate && (
                    <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                      <Calendar className="h-4 w-4" />
                      <span>Started: {formatDate(currentTheme.startDate)}</span>
                    </div>
                  )}
                  {currentTheme.endDate && (
                    <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                      <Calendar className="h-4 w-4" />
                      <span>Ends: {formatDate(currentTheme.endDate)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Active Theme</h3>
              <p className="text-[var(--muted-foreground)]">
                Check back later for the next exciting theme!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Archived Themes List */}
      {themeStatus === "archived" && (
        <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-lg">
          {archivedThemes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Archived Themes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedThemes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onThemeSelect(theme.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selectedThemeId === theme.id
                        ? "border-[var(--primary)] bg-[var(--muted)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--muted)]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold line-clamp-1">
                        {theme.title}
                      </h4>
                      <ArcadeBadge
                        text="Archived"
                        variant="default"
                        icon={<Archive className="h-3 w-3" />}
                        className="ml-2 shrink-0"
                      />
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                      {theme.description}
                    </p>
                    {theme.endDate && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-[var(--muted-foreground)]">
                        <Calendar className="h-3 w-3" />
                        <span>Ended: {formatDate(theme.endDate)}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Archived Themes</h3>
              <p className="text-[var(--muted-foreground)]">
                Archived themes will appear here when available.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
