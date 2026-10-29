import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Play,
  Pause,
  Video,
  Camera,
  Download,
  Copy,
  CheckCircle2,
  Sparkles,
  Clock,
  Film,
  Maximize2,
  Share2,
} from 'lucide-react';

export default function MatchVideoReplayViewer({
  fixtureId = 'FIX-2026-089',
  matchTitle = 'Apex Strikers vs Metro Titans',
  pitchName = 'Stadium Arena — Pitch 1 (AI Cam 4K)',
  recordedDate = 'Oct 29, 2026',
  storageDaysRemaining = 12,
  className = '',
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAngle, setActiveAngle] = useState('MAIN_STAND'); // 'MAIN_STAND' | 'GOAL_NORTH' | 'TACTICAL_DRONE'
  const [currentPlaySecs, setCurrentPlaySecs] = useState(2535); // 42:15 min
  const [selectedClipId, setSelectedClipId] = useState('clip-1');
  const [exportFormat, setExportFormat] = useState('REEL_9_16'); // 'REEL_9_16' | 'WIDE_16_9'
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingClip, setDownloadingClip] = useState(false);

  // Pre-extracted AI Match Clips
  const HIGHLIGHT_CLIPS = [
    {
      id: 'clip-1',
      minute: 14,
      seconds: 840,
      title: 'Curling Long-Range Goal',
      player: 'D. Vance (#10)',
      icon: '⚽',
      type: 'GOAL',
      duration: '35s',
      team: 'Apex Strikers',
    },
    {
      id: 'clip-2',
      minute: 28,
      seconds: 1680,
      title: 'Fingertip Penalty Save',
      player: 'M. Al-Habsi (#1)',
      icon: '🧤',
      type: 'SAVE',
      duration: '28s',
      team: 'Metro Titans',
    },
    {
      id: 'clip-3',
      minute: 41,
      seconds: 2460,
      title: 'Solo Nutmeg & Assist',
      player: 'L. Chen (#7)',
      icon: '🪄',
      type: 'SKILL',
      duration: '30s',
      team: 'Apex Strikers',
    },
    {
      id: 'clip-4',
      minute: 76,
      seconds: 4560,
      title: 'Volley Crossbar Strike',
      player: 'T. Harris (#9)',
      icon: '🎯',
      type: 'WOODWORK',
      duration: '25s',
      team: 'Metro Titans',
    },
  ];

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const handleSelectClip = (clip) => {
    setSelectedClipId(clip.id);
    setCurrentPlaySecs(clip.seconds);
    setIsPlaying(true);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `https://platform.premiumsports.app/replay/${fixtureId}?clip=${selectedClipId}&cam=${activeAngle}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = () => {
    setDownloadingClip(true);
    setTimeout(() => setDownloadingClip(false), 1800);
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500" />

      {/* ── Header Title & Storage Info ──────────────────────────────────── */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{matchTitle}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                1080p 60FPS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{pitchName}</span>
              <span>•</span>
              <span>{recordedDate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/70 px-3.5 py-1.5 rounded-full border border-slate-700/60 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Vault: {storageDaysRemaining}d Left</span>
          </div>
        </div>
      </div>

      {/* ── Main Stadium Video Screen Simulation ─────────────────────────── */}
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-800 group">
        {/* Pitch Graphic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-slate-950/90 to-slate-900 flex items-center justify-center">
          <div className="w-72 h-72 rounded-full border-2 border-emerald-500/10 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-emerald-500/20" />
          </div>
        </div>

        {/* Live Watermark & Camera Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-950/80 text-white border border-slate-700/80 flex items-center gap-1.5 backdrop-blur-md">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            {activeAngle === 'MAIN_STAND'
              ? 'Main Broadcast Cam (16:9)'
              : activeAngle === 'GOAL_NORTH'
              ? 'North Goal-Line Cam'
              : 'Overhead Tactical Drone'}
          </span>
        </div>

        {/* Resolution / FPS Pill */}
        <div className="absolute top-4 right-4 z-10">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-black/60 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
            AI TRACKING ON • 60 FPS
          </span>
        </div>

        {/* Center Play Button Overlay */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="relative z-10 w-16 h-16 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/30 transition-transform transform hover:scale-105 active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
        </button>

        {/* Bottom Video Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 z-10">
          {/* Timeline Scrubber */}
          <div className="w-full h-1.5 bg-slate-700/80 rounded-full overflow-hidden cursor-pointer relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
              style={{ width: `${(currentPlaySecs / 5400) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">{formatTime(currentPlaySecs)}</span>
              <span className="text-slate-500">/ 90:00</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-cyan-400">Match Clip Active</span>
              <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Multi-Angle Camera Switcher Bar ──────────────────────────────── */}
      <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          Camera Angles:
        </span>

        <div className="flex items-center gap-2">
          {[
            { id: 'MAIN_STAND', label: 'Main Broadcast' },
            { id: 'GOAL_NORTH', label: 'Goal Line Cam' },
            { id: 'TACTICAL_DRONE', label: 'Tactical Drone' },
          ].map((cam) => (
            <button
              key={cam.id}
              onClick={() => setActiveAngle(cam.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeAngle === cam.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/60'
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Highlight Clips Reel & Export Section ────────────────────────── */}
      <div className="p-6 md:p-7 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              AI Detected Match Moments
            </h4>
            <span className="text-[11px] text-slate-500">Auto-clipped by Pitch AI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HIGHLIGHT_CLIPS.map((clip) => {
              const isSelected = selectedClipId === clip.id;
              return (
                <div
                  key={clip.id}
                  onClick={() => handleSelectClip(clip)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/25 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{clip.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{clip.title}</span>
                        <span className="text-[10px] font-mono text-cyan-400">({clip.minute}')</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {clip.player} • {clip.team}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800">
                    {clip.duration}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Social Reel Export & Download Bar ────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300">Export Aspect:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setExportFormat('REEL_9_16')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  exportFormat === 'REEL_9_16'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                9:16 Vertical Reel
              </button>
              <button
                onClick={() => setExportFormat('WIDE_16_9')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  exportFormat === 'WIDE_16_9'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                16:9 Broadcast Wide
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-md"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Clip'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloadingClip}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {downloadingClip ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadingClip ? 'Preparing MP4...' : 'Download HD Clip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

MatchVideoReplayViewer.propTypes = {
  fixtureId: PropTypes.string,
  matchTitle: PropTypes.string,
  pitchName: PropTypes.string,
  recordedDate: PropTypes.string,
  storageDaysRemaining: PropTypes.number,
  className: PropTypes.string,
};
