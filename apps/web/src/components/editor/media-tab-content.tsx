"use client";

import React from "react";
import { Image, Music, Play, ExternalLink, Eye, EyeOff } from "lucide-react";
import {
  ArcadeButton,
  ArcadeInput,
} from "@/components/arcade";
import { StrudelPlayer } from "@/components/strudel-player";
import { encodeStrudelUrl } from "@/lib/strudel-encoder";
import type { ThemeMediaConfig, GameMedia, ImageSlot } from "@/lib/trpc-types";

interface ImageSlotFieldProps {
  slot: ImageSlot;
  value: string;
  onChange: (url: string) => void;
}

function ImageSlotField({ slot, value, onChange }: ImageSlotFieldProps) {
  const [previewError, setPreviewError] = React.useState(false);
  const inputId = `image-slot-${slot.name}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setPreviewError(false);
  };

  const displayUrl = value || slot.defaultUrl || "";
  const showPreview = displayUrl && !previewError;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-[var(--foreground)]">
        {slot.label}
        <span className="text-[var(--muted-foreground)] ml-2 text-xs">
          ({slot.name})
        </span>
      </label>
      <div className="flex gap-3">
        <div className="flex-1">
          <ArcadeInput
            id={inputId}
            type="url"
            placeholder={slot.defaultUrl ?? `Enter URL for ${slot.label}`}
            value={value}
            onChange={handleInputChange}
          />
          {slot.defaultUrl && !value && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Using default: {slot.defaultUrl}
            </p>
          )}
        </div>
        {showPreview && (
          <div className="w-16 h-16 rounded border border-[var(--border)] overflow-hidden bg-[var(--muted)]/10 shrink-0">
            <img
              src={displayUrl}
              alt={slot.label}
              className="w-full h-full object-cover"
              onError={() => setPreviewError(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface MediaTabContentProps {
  themeMediaConfig: ThemeMediaConfig;
  initialMedia?: GameMedia;
  onMediaChange: (media: GameMedia) => void;
}

export function MediaTabContent({
  themeMediaConfig,
  initialMedia,
  onMediaChange,
}: MediaTabContentProps) {
  const [strudelEnabled, setStrudelEnabled] = React.useState(
    initialMedia?.strudelCode !== null && initialMedia?.strudelCode !== ""
  );
  const [strudelCode, setStrudelCode] = React.useState(
    initialMedia?.strudelCode ?? themeMediaConfig.strudelDefaultCode ?? ""
  );
  const [showPreview, setShowPreview] = React.useState(false);
  const [mediaUrls, setMediaUrls] = React.useState<Record<string, string>>(
    initialMedia?.mediaUrls ?? {}
  );

  const handleSlotChange = (slotName: string, url: string) => {
    const newUrls = { ...mediaUrls, [slotName]: url };
    setMediaUrls(newUrls);
    emitMediaChange(newUrls, strudelEnabled ? strudelCode : null);
  };

  const handleStrudelToggle = (enabled: boolean) => {
    setStrudelEnabled(enabled);
    emitMediaChange(mediaUrls, enabled ? strudelCode : null);
  };

  const handleStrudelCodeChange = (code: string) => {
    setStrudelCode(code);
    if (strudelEnabled) {
      emitMediaChange(mediaUrls, code);
    }
  };

  const emitMediaChange = (urls: Record<string, string>, code: string | null) => {
    onMediaChange({
      strudelCode: code,
      mediaUrls: urls,
    });
  };

  const handlePreviewStrudel = () => {
    if (!strudelCode.trim()) return;
    const strudelUrl = encodeStrudelUrl(strudelCode);
    window.open(strudelUrl, "_blank");
  };

  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  const hasImageSlots = themeMediaConfig.imageSlots.length > 0;
  const hasStrudel = themeMediaConfig.enableStrudel;

  if (!hasImageSlots && !hasStrudel) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
        <div className="text-center space-y-2">
          <Image className="h-8 w-8 mx-auto opacity-50" />
          <p>No media configuration available for this theme.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {hasImageSlots && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Image Slots
            </h3>
          </div>
          <div className="space-y-4">
            {themeMediaConfig.imageSlots.map((slot) => (
              <ImageSlotField
                key={slot.name}
                slot={slot}
                value={mediaUrls[slot.name] ?? ""}
                onChange={(url) => handleSlotChange(slot.name, url)}
              />
            ))}
          </div>
        </section>
      )}

      {hasStrudel && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Strudel Music
            </h3>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Enable Custom Music
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Add a custom Strudel pattern for your game
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleStrudelToggle(!strudelEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                strudelEnabled
                  ? "bg-[var(--primary)]"
                  : "bg-[var(--muted)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  strudelEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {strudelEnabled && (
            <div className="space-y-3">
              <label htmlFor="strudel-code" className="block text-sm font-medium text-[var(--foreground)]">
                Strudel Pattern Code
              </label>
              <textarea
                id="strudel-code"
                value={strudelCode}
                onChange={(e) => handleStrudelCodeChange(e.target.value)}
                placeholder="s('bd sd').sound()"
                className="w-full h-40 px-4 py-3 rounded-lg bg-[var(--input)] border-2 border-[var(--border)] text-[var(--foreground)] font-mono text-sm resize-none focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              />
              <div className="flex justify-between items-center">
                <ArcadeButton
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePreview}
                  disabled={!strudelCode.trim()}
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </ArcadeButton>
                <ArcadeButton
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewStrudel}
                  disabled={!strudelCode.trim()}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Open in Strudel
                  <ExternalLink className="h-3 w-3 ml-2" />
                </ArcadeButton>
              </div>
              {showPreview && strudelCode.trim() && (
                <StrudelPlayer code={strudelCode} height={350} />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
