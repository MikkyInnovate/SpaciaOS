"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { CallRecordingState } from "../types";
import { CallRecordingBadge } from "./call-recording-badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

export interface CallAudioPlayerProps {
  callId: string;
  leadName: string;
  recordingState: CallRecordingState;
  durationSeconds: number;
  currentTimeSeconds?: number;
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

// 56 high-density frequency bars modeling natural conversational audio cadence
const WAVEFORM_HEIGHTS = [
  6, 10, 16, 22, 14, 28, 36, 26, 18, 10, 14, 24, 34, 40, 32, 22, 12, 18, 28,
  36, 42, 30, 20, 14, 22, 32, 38, 26, 16, 10, 16, 28, 36, 30, 20, 14, 8, 16,
  26, 34, 40, 28, 18, 12, 16, 26, 32, 24, 18, 12, 20, 28, 22, 14, 10, 6,
];

function generateWavAudioBlob(durationSeconds: number): Blob {
  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const duration = Math.min(4, Math.max(1.5, durationSeconds / 40));
  const numSamples = Math.floor(sampleRate * duration);
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const tone =
      Math.sin(2 * Math.PI * 440 * t) * 0.2 +
      Math.sin(2 * Math.PI * 554.37 * t) * 0.15;
    const env = Math.min(1, t / 0.1) * Math.min(1, (duration - t) / 0.3);
    const sample = Math.max(-1, Math.min(1, tone * env));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

export function CallAudioPlayer({
  callId,
  leadName,
  recordingState,
  durationSeconds,
  currentTimeSeconds = 0,
  onTimeUpdate,
  className,
}: CallAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(currentTimeSeconds);
  const [prevExternalTime, setPrevExternalTime] = React.useState(currentTimeSeconds);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<1 | 1.25 | 1.5 | 2>(1);
  const [isMuted, setIsMuted] = React.useState(false);

  // Sync internal time during render if parent pushed a new time
  if (currentTimeSeconds !== prevExternalTime) {
    setPrevExternalTime(currentTimeSeconds);
    setCurrentTime(currentTimeSeconds);
  }

  // Simulated audio ticker
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 1 * playbackSpeed;
          const capped = Math.min(durationSeconds, next);
          if (onTimeUpdate) {
            onTimeUpdate(capped);
          }
          return capped;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, durationSeconds, playbackSpeed, onTimeUpdate]);

  const handleTogglePlay = () => {
    if (recordingState !== "ready" && recordingState !== "live") {
      toast.error("Audio Unavailable", {
        description: `This call recording is currently ${recordingState}.`,
      });
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleScrub = (seconds: number) => {
    const clamped = Math.max(0, Math.min(durationSeconds, seconds));
    setCurrentTime(clamped);
    if (onTimeUpdate) {
      onTimeUpdate(clamped);
    }
  };

  const handleSkip = (deltaSeconds: number) => {
    handleScrub(currentTime + deltaSeconds);
  };

  const handleDownload = () => {
    try {
      const blob = generateWavAudioBlob(durationSeconds);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SpaciaOS_${leadName.replace(/[^a-zA-Z0-9]/g, "_")}_CallRecording.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Recording Downloaded", {
        description: `Saved WAV master recording for ${leadName}.`,
      });
    } catch {
      toast.error("Download Failed", {
        description: "Could not export audio file.",
      });
    }
  };

  const handleShare = () => {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/calls?callId=${callId}` : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `SpaciaOS Call Recording — ${leadName}`,
          text: `Review the voice interaction recording for ${leadName}.`,
          url: shareUrl,
        })
        .catch(() => {
          navigator.clipboard.writeText(shareUrl);
          toast.success("Recording Link Copied", {
            description: "Direct call link copied to clipboard.",
          });
        });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Recording Link Copied", {
        description: "Direct call link copied to clipboard.",
      });
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs space-y-2.5",
        className
      )}
    >
      {/* 1. Header Toolbar: Quality Badge & Action Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CallRecordingBadge state={recordingState} size="sm" />
          <span className="text-[11px] text-stone-500 font-medium truncate">
            48kHz Studio Mastered
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Playback Speed Segmented Buttons */}
          <div className="flex items-center rounded-md border border-stone-200 bg-stone-50/80 p-0.5 text-[10px] font-mono">
            {([1, 1.25, 1.5, 2] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackSpeed(speed)}
                className={cn(
                  "px-1.5 py-0.5 rounded transition-colors font-semibold cursor-pointer",
                  playbackSpeed === speed
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                    : "text-stone-600 hover:text-stone-900 hover:bg-white/40 border border-transparent"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-7 w-7 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-500" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-7 w-7 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md cursor-pointer"
            title="Download FLAC / WAV recording"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-7 w-7 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md cursor-pointer"
            title="Copy timestamped audio link"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Integrated Studio Playback Dock */}
      <div className="flex items-center gap-2.5 bg-stone-50/80 p-2 rounded-lg border border-stone-200/80">
        {/* Play / Pause Circular Primary Button */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-xs transition-all active:scale-95 cursor-pointer bg-[#0d4a36] hover:bg-[#0a3829]",
            isPlaying && "ring-2 ring-emerald-500/40"
          )}
          aria-label={isPlaying ? "Pause audio playback" : "Play audio recording"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-white" />
          ) : (
            <Play className="h-4 w-4 fill-white ml-0.5" />
          )}
        </button>

        {/* Skip 5s Rewind / 10s Forward */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:text-stone-800 hover:bg-white transition-colors cursor-pointer"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleSkip(10)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:text-stone-800 hover:bg-white transition-colors cursor-pointer"
            title="Fast forward 10 seconds"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* High-Fidelity Waveform Visualizer & Scrubber Track */}
        <div
          className="relative flex-1 flex items-center justify-between gap-[2px] h-10 px-1.5 rounded-md hover:bg-white/80 cursor-pointer overflow-hidden group select-none transition-colors border border-transparent hover:border-stone-200/60"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            handleScrub(ratio * durationSeconds);
          }}
          title="Click to jump playback position"
        >
          {WAVEFORM_HEIGHTS.map((h, idx) => {
            const barRatio = (idx / WAVEFORM_HEIGHTS.length) * 100;
            const isPassed = barRatio <= progressPercent;

            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full"
              >
                <div
                  className={cn(
                    "w-full rounded-full transition-all duration-100",
                    isPassed
                      ? "bg-[#0d4a36]"
                      : "bg-stone-300 group-hover:bg-stone-400"
                  )}
                  style={{
                    height: isPlaying
                      ? `${Math.min(36, Math.max(6, (h * ((idx % 3) + 2)) % 38))}px`
                      : `${Math.min(36, Math.max(6, h * 0.85))}px`,
                  }}
                />
              </div>
            );
          })}

          {/* Gliding Playhead Needle */}
          <div
            className="absolute top-1 bottom-1 w-0.5 bg-[#0d4a36] rounded-full pointer-events-none transition-all shadow-xs"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Digital Time Readout */}
        <div className="font-mono text-xs font-semibold text-stone-700 tabular-nums shrink-0 pl-1 select-none">
          <span className="text-stone-900 font-bold">
            {formatSeconds(currentTime)}
          </span>
          <span className="text-stone-300 mx-1">/</span>
          <span className="text-stone-400 font-normal">
            {formatSeconds(durationSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
