import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { track } from "@/lib/analytics";
import { signedUrl } from "@/lib/media";

export type PlayerTrack = {
  id: string;
  title: string;
  slug: string;
  bpm: number | null;
  coverPath: string | null;
  previewPath: string | null;
};

type PlayerValue = {
  current: PlayerTrack | null;
  playing: boolean;
  loading: boolean;
  error: string | null;
  progress: number;
  duration: number;
  volume: number;
  play: (track: PlayerTrack) => void;
  toggle: (track?: PlayerTrack) => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PlayerTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.9;
    audioRef.current = audio;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);
    const onErr = () => {
      setError("This preview could not be loaded.");
      setPlaying(false);
      setLoading(false);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
    };
  }, []);

  const play = useCallback(
    async (next: PlayerTrack) => {
      const audio = audioRef.current;
      if (!audio) return;
      setError(null);
      if (current?.id === next.id && audio.src) {
        try {
          await audio.play();
          setPlaying(true);
        } catch {
          setError("Playback was blocked by the browser.");
        }
        return;
      }
      if (!next.previewPath) {
        setError("No preview available for this beat yet.");
        return;
      }
      setLoading(true);
      setCurrent(next);
      setProgress(0);
      setDuration(0);
      const url = await signedUrl("previews", next.previewPath);
      if (!url) {
        setLoading(false);
        setError("Audio file unavailable.");
        return;
      }
      audio.src = url;
      try {
        await audio.play();
        setPlaying(true);
        // One play event per beat per browser session — no inflated stats.
        void track("beat_play", { beatId: next.id, once: true });
      } catch {
        setError("Playback was blocked by the browser.");
      } finally {
        setLoading(false);
      }
    },
    [current],
  );

  const toggle = useCallback(
    (next?: PlayerTrack) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (next && next.id !== current?.id) {
        void play(next);
        return;
      }
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else if (current) {
        void play(current);
      }
    },
    [current, playing, play],
  );

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((value: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = value;
    setVolumeState(value);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    setPlaying(false);
    setCurrent(null);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        current,
        playing,
        loading,
        error,
        progress,
        duration,
        volume,
        play: (t) => void play(t),
        toggle,
        seek,
        setVolume,
        stop,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
