export type MusicTrack = {
  id: string;
  name: string;
  file: string;
};

export type MusicState = {
  isPlaying: boolean;
  currentTrackId: string | null;
};