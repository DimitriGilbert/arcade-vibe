import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Archive, Sparkles } from "lucide-react";

interface Theme {
  id: string;
  title: string;
  description: string;
  status: "upcoming" | "active" | "frozen" | "archived";
  visibility: "private" | "public_on_freeze" | "public";
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ThemeHeaderProps {
  currentTheme: Theme | null;
  archivedThemes: Theme[];
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
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Theme Tabs */}
      <div className="flex items-center justify-between">
        <Tabs
          value={themeStatus}
          onValueChange={(value) => onThemeStatusChange(value as "current" | "archived")}
        >
          <TabsList className="bg-white dark:bg-gray-800">
            <TabsTrigger
              value="current"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Sparkles className="h-4 w-4" />
              Current
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Archive className="h-4 w-4" />
              Archived
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Current Theme Card */}
      {themeStatus === "current" && (
        <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
          {currentTheme ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{currentTheme.title}</h2>
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      Active
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{currentTheme.description}</p>
                </div>
              </div>

              {/* Theme Dates */}
              {(currentTheme.startDate || currentTheme.endDate) && (
                <div className="flex items-center gap-6 text-sm">
                  {currentTheme.startDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Started: {formatDate(currentTheme.startDate)}</span>
                    </div>
                  )}
                  {currentTheme.endDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Ends: {formatDate(currentTheme.endDate)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Active Theme</h3>
              <p className="text-muted-foreground">
                Check back later for the next exciting theme!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Archived Themes List */}
      {themeStatus === "archived" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
          {archivedThemes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Archived Themes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedThemes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onThemeSelect(theme.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedThemeId === theme.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold line-clamp-1">{theme.title}</h4>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        <Archive className="h-3 w-3 mr-1" />
                        Archived
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {theme.description}
                    </p>
                    {theme.endDate && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
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
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Archived Themes</h3>
              <p className="text-muted-foreground">
                Archived themes will appear here when available.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
