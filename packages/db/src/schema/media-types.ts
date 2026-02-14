export interface ImageSlot {
  name: string;
  label: string;
  defaultUrl?: string;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export interface ThemeMediaConfig {
  enabled: boolean;
  imageSlots: ImageSlot[];
  enableStrudel: boolean;
  strudelDefaultCode: string | null;
}
