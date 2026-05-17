/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Music, 
  Upload, 
  Play, 
  Pause, 
  Settings, 
  Layout, 
  Loader2,
  Video,
  Disc,
  Palette,
  Share2,
  Sliders
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";

// --- Types ---
type VisualizerStyle = 'MINIMAL_PULSE' | 'BARS' | 'PARTICLES' | 'RADIAL' | 'KINETIC' | 'ENVIRONMENT' | 'GEOMETRIC' | 'ATMOSPHERIC' | 'AURA' | 'ORBITAL' | 'HORIZON_RIPPLE' | 'CORNER_BRACKETS' | 'BREATHING_VIGNETTE' | 'FLOATING_DOT';
type VisualPlacement = 'FILL' | 'BOTTOM' | 'CORNER';

interface VisualSettings {
  styles: VisualizerStyle[];
  placement: VisualPlacement;
  bgColor: string;
  waveColor: string;
  glowAmount: number; // 0 to 1
  sensitivity: number; // 0.5 to 2
  intensity: number; 
  bgImage: string | null;
  bgDim: number;
  barWidth: number;
  barGap: number;
  smoothing: number;
  fftSize: number;
}

export default function App() {
  // --- Audio State ---
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  
  // --- Visual State ---
  const [settings, setSettings] = useState<VisualSettings>({
    styles: ['MINIMAL_PULSE'],
    placement: 'FILL',
    bgColor: '#0c0d10',
    waveColor: '#2dd4bf',
    glowAmount: 0.6,
    sensitivity: 1,
    intensity: 1.5,
    bgImage: null,
    bgDim: 0.4,
    barWidth: 8,
    barGap: 4,
    smoothing: 0.85,
    fftSize: 2048,
  });
  
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  
  // --- System State ---
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  // --- Audio Engine ---
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      if (audioRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setSongTitle(file.name.replace(/\.[^/.]+$/, ""));
      initAudio();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgImageFile(file);
      const url = URL.createObjectURL(file);
      setSettings(p => ({ ...p, bgImage: url }));
      
      const img = new Image();
      img.src = url;
      img.onload = () => {
        bgImgRef.current = img;
      };
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        initAudio();
        audioContextRef.current?.resume();
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const [smoothedData, setSmoothedData] = useState<number[]>([]);
  const prevDataRef = useRef<number[]>([]);

  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = settings.fftSize;
    }
  }, [settings.fftSize]);

  // --- Rendering Engines ---
  const drawMinimalPulse = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const bass = data[0] / 255;
    const time = Date.now() / 1000;
    
    ctx.shadowBlur = s.glowAmount * 20;
    ctx.shadowColor = s.waveColor;
    ctx.strokeStyle = s.waveColor;
    ctx.lineWidth = 2;

    // Single delicate line structure
    ctx.beginPath();
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? 1 : -1;
      ctx.moveTo(centerX, centerY - 100);
      
      const p1x = centerX + side * (100 + bass * 50);
      const p1y = centerY;
      const p2x = centerX;
      const p2y = centerY + 100;
      
      ctx.bezierCurveTo(p1x, p1y - 50, p1x, p1y + 50, p2x, p2y);
    }
    ctx.stroke();

    // Subtle breathing geometric expansion
    const side = 60 + bass * 40 * s.sensitivity;
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(centerX - side/2, centerY - side/2, side, side);
    ctx.globalAlpha = 1;
  };

  const drawBars = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const spacing = s.barWidth + s.barGap;
    const barsCount = Math.floor(width / spacing);
    const startX = (width - (barsCount * spacing)) / 2;
    const centerY = height / 2;
    
    ctx.shadowBlur = s.glowAmount * 40;
    ctx.shadowColor = s.waveColor;

    for (let i = 0; i < barsCount; i++) {
       // Logarithmic-skewed sampling
       const dataIdx = Math.floor(Math.pow(i / barsCount, 1.5) * data.length * 0.8);
       const val = data[dataIdx] || 0;
       const barHeight = (val / 255) * height * 0.4 * s.intensity;
       const x = startX + (i * spacing);
       
       const gradient = ctx.createLinearGradient(0, centerY - barHeight/2, 0, centerY + barHeight/2);
       gradient.addColorStop(0, `${s.waveColor}00`);
       gradient.addColorStop(0.5, s.waveColor);
       gradient.addColorStop(1, `${s.waveColor}00`);
       
       ctx.fillStyle = gradient;
       ctx.beginPath();
       if (ctx.roundRect) ctx.roundRect(x, centerY - barHeight/2, s.barWidth, barHeight, s.barWidth/2);
       else ctx.fillRect(x, centerY - barHeight/2, s.barWidth, barHeight);
       ctx.fill();
    }
  };

  const drawRadial = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const bass = (data[0] + data[1] + data[2]) / 3 / 255;
    const pulse = bass * 50 * s.sensitivity;

    // Halos
    ctx.shadowBlur = s.glowAmount * 60;
    ctx.shadowColor = s.waveColor;
    
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `${s.waveColor}${i === 0 ? '22' : '44'}`;
      ctx.lineWidth = 2;
      ctx.arc(centerX, centerY, radius + pulse + (i * 30), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial Bars
    const barsCount = 120;
    for (let i = 0; i < barsCount; i++) {
      const angle = (i / barsCount) * Math.PI * 2;
      const dataIdx = Math.floor((i / barsCount) * data.length * 0.5);
      const val = data[dataIdx] || 0;
      const h = (val / 255) * 120 * s.intensity;
      
      const x1 = centerX + Math.cos(angle) * (radius + pulse);
      const y1 = centerY + Math.sin(angle) * (radius + pulse);
      const x2 = centerX + Math.cos(angle) * (radius + pulse + h);
      const y2 = centerY + Math.sin(angle) * (radius + pulse + h);

      ctx.strokeStyle = s.waveColor;
      ctx.lineWidth = (radius * 2 * Math.PI) / barsCount * 0.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const drawKinetic = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings, title: string) => {
    if (!title) return;
    const centerX = width / 2;
    const centerY = height / 2;
    const bass = data[0] / 255;
    
    // Perspective Text
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    const scale = 1 + bass * 0.2 * s.intensity;
    ctx.scale(scale, scale);
    
    // Ghost echoes (Subtle)
    for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.08 / (i + 1);
        ctx.fillStyle = s.waveColor;
        const offset = (i + 1) * bass * 25;
        ctx.font = `900 ${100 + i*15}px "Space Grotesk"`;
        ctx.fillText(title.toUpperCase(), 0, offset);
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = s.glowAmount * 50;
    ctx.shadowColor = s.waveColor;
    ctx.font = `900 110px "Space Grotesk"`;
    ctx.fillStyle = 'white';
    
    // Triple layer shadow for ultra-crispness
    ctx.shadowBlur = s.glowAmount * 40;
    ctx.fillText(title.toUpperCase(), 0, 0);
    
    // Sharp high-contrast outline for large screens
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeText(title.toUpperCase(), 0, 0);
    
    // Reactive Underline
    ctx.lineWidth = 6;
    ctx.strokeStyle = s.waveColor;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-width * 0.25 * (1 + bass * 0.1), 30);
    ctx.lineTo(width * 0.25 * (1 + bass * 0.1), 30);
    ctx.stroke();
    
    ctx.restore();
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const bass = data[0] / 255;
    const horizonY = height * 0.6;
    
    // Rippling Water / Surface
    ctx.strokeStyle = s.waveColor;
    for (let i = 0; i < 15; i++) {
      const y = horizonY + (Math.pow(i/15, 2.5) * (height - horizonY));
      const amp = (data[i * 2] || 0) / 255 * 30 * s.intensity;
      ctx.globalAlpha = (i / 15) * 0.6;
      ctx.lineWidth = (i / 15) * 3;
      
      ctx.beginPath();
      for (let x = 0; x < width; x += 20) {
        const ripple = Math.sin(x * 0.01 + Date.now() * 0.002) * amp;
        if (x === 0) ctx.moveTo(x, y + ripple);
        else ctx.lineTo(x, y + ripple);
      }
      ctx.stroke();
    }
    
    // Sky Lightning / Light changes
    const energy = bass * 0.4;
    const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
    grad.addColorStop(0, `${s.waveColor}${Math.floor(energy*255).toString(16).padStart(2,'0')}`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, horizonY);
  };

  const drawGeometric = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const bass = data[0] / 255;
    const time = Date.now() / 2000;
    
    ctx.strokeStyle = s.waveColor;
    ctx.shadowBlur = s.glowAmount * 30;
    ctx.lineWidth = 2;

    const points: [number, number][] = [];
    const count = 30;
    const radius = 150 + bass * 100 * s.sensitivity;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + time;
      const noise = (data[i % data.length] / 255) * 50;
      const x = centerX + Math.cos(angle) * (radius + noise);
      const y = centerY + Math.sin(angle) * (radius + noise);
      points.push([x, y]);
    }

    // Connect points prowire-frame style
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]);
        if (d < 150) {
          ctx.globalAlpha = (1 - (d / 150)) * 0.5;
          ctx.beginPath();
          ctx.moveTo(points[i][0], points[i][1]);
          ctx.lineTo(points[j][0], points[j][1]);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const drawAtmospheric = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const bass = data[0] / 255;
    const mid = data[Math.floor(data.length/4)] / 255;
    const time = Date.now() / 3000;

    // Fog / Cloud layer
    for (let i = 0; i < 5; i++) {
      const x = width * (0.2 + 0.6 * Math.sin(time + i));
      const y = height * (0.3 + 0.4 * Math.cos(time * 0.8 + i));
      const radius = 200 + bass * 300;
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `${s.waveColor}${Math.floor(0.2 * 255).toString(16).padStart(2,'0')}`);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Atmospheric "dust" particles
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
      const x = (Math.sin(i * 1.5 + time) * 0.5 + 0.5) * width;
      const y = (Math.cos(i * 0.7 + time * 1.2) * 0.5 + 0.5) * height;
      const dist = (data[i % data.length] / 255) * 5 * s.intensity;
      
      ctx.globalAlpha = 0.1 + (mid * 0.3);
      ctx.beginPath();
      ctx.arc(x, y, 1 + dist, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const drawAura = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const bass = data[0] / 255;
    const mid = data[Math.floor(data.length/4)] / 255;
    
    const grad = ctx.createRadialGradient(
      width/2, height/2, 0,
      width/2, height/2, 300 + bass * 200
    );
    grad.addColorStop(0, `${s.waveColor}88`);
    grad.addColorStop(0.5, `${s.waveColor}22`);
    grad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(width/2, height/2, 400 + mid * 100, 0, Math.PI * 2);
    ctx.fill();
    
    // Orbiting light blobs
    for (let i = 0; i < 3; i++) {
      const angle = (Date.now() / 2000) + (i * Math.PI / 1.5);
      const x = width/2 + Math.cos(angle) * (150 + bass * 50);
      const y = height/2 + Math.sin(angle) * (150 + bass * 50);
      
      const bGrad = ctx.createRadialGradient(x, y, 0, x, y, 100);
      bGrad.addColorStop(0, `${s.waveColor}44`);
      bGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(x, y, 100, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawOrbital = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const bass = data[0] / 255;
    const time = Date.now() / 1000;
    
    // Core
    ctx.shadowBlur = s.glowAmount * 100;
    ctx.shadowColor = s.waveColor;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20 + bass * 40, 0, Math.PI * 2);
    ctx.fill();

    // Orbits
    for (let layer = 1; layer <= 3; layer++) {
      const radius = layer * 150 + bass * 50;
      const speed = (4 - layer) * 0.5;
      
      ctx.strokeStyle = `${s.waveColor}33`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Satellite particles on orbit
      const count = 5 + layer * 2;
      for (let i = 0; i < count; i++) {
        const angle = (time * speed) + (i / count) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const amp = (data[(i * layer) % data.length] / 255) * 10 * s.intensity;
        
        ctx.fillStyle = s.waveColor;
        ctx.beginPath();
        ctx.arc(x, y, 4 + amp, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawHorizonRipple = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const bass = data[0] / 255;
    const horizonY = height - 40;
    
    ctx.strokeStyle = s.waveColor;
    ctx.lineWidth = 1;
    ctx.shadowBlur = s.glowAmount * 25;
    ctx.shadowColor = s.waveColor;

    ctx.beginPath();
    for (let x = 0; x < width; x += 4) {
      const dataIdx = Math.floor((x / width) * 50);
      const val = (data[dataIdx] || 0) / 255;
      const ripple = Math.sin(x * 0.1 + Date.now() * 0.02) * (val * 20 * s.intensity * bass);
      
      if (x === 0) ctx.moveTo(x, horizonY + ripple);
      else ctx.lineTo(x, horizonY + ripple);
    }
    ctx.stroke();
  };

  const drawCornerBrackets = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const bass = data[0] / 255;
    const padding = 60;
    const size = 40;
    
    ctx.strokeStyle = s.waveColor;
    ctx.lineWidth = 1 + (bass * 3 * s.intensity);
    ctx.shadowBlur = s.glowAmount * 30 * bass;
    ctx.shadowColor = s.waveColor;

    const drawBracket = (x: number, y: number, h: number, v: number) => {
      ctx.beginPath();
      ctx.moveTo(x + h * size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + v * size);
      ctx.stroke();
    };

    drawBracket(padding, padding, 1, 1); // Top Left
    drawBracket(width - padding, padding, -1, 1); // Top Right
    drawBracket(padding, height - padding, 1, -1); // Bottom Left
    drawBracket(width - padding, height - padding, -1, -1); // Bottom Right
  };

  const drawBreathingVignette = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
    const intensity = 0.5 + (avg * 0.5 * s.intensity);
    
    const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.8);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(0,0,0,${0.8 * intensity})`);
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  };

  const drawFloatingDot = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const bass = data[0] / 255;
    const mid = data[Math.floor(data.length/4)] / 255;
    const time = Date.now() / 1000;
    
    const centerX = width * 0.2;
    const centerY = height * 0.5;
    
    const x = centerX + Math.cos(time * 2) * 20 + (bass * 5);
    const y = centerY + Math.sin(time * 3) * 20 + (mid * 5);

    // Faint trailing ghost
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = s.waveColor;
    ctx.beginPath();
    ctx.arc(x - (bass * 10), y - (mid * 10), 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.shadowBlur = s.glowAmount * 20;
    ctx.shadowColor = 'white';
    ctx.beginPath();
    ctx.arc(x, y, 3 + (bass * 2), 0, Math.PI * 2);
    ctx.fill();
  };

  const drawParticlesPro = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, s: VisualSettings) => {
    const bass = data[0] / 255;
    const time = Date.now() / 1000;
    
    ctx.shadowBlur = s.glowAmount * 20;
    ctx.shadowColor = s.waveColor;

    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 2 + time * 0.2;
      const dist = (i * 10) % (width * 0.4) + (bass * 100);
      const x = (width / 2) + Math.cos(angle) * dist;
      const y = (height / 2) + Math.sin(angle) * dist;
      
      const amp = data[i % data.length] || 0;
      const size = (amp / 255) * 8 * s.intensity;
      
      ctx.globalAlpha = 1 - (dist / (width * 0.4));
      ctx.fillStyle = s.waveColor;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const animate = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rawData = new Uint8Array(analyserRef.current.frequencyBinCount);
    // Use the first style to determine domain if necessary (mostly frequency for everything here)
    analyserRef.current.getByteFrequencyData(rawData);

    // --- High-End Smoothing Engine ---
    // Smooth the data over time to prevent flickering
    const smoothFactor = settings.smoothing; // Lower = more reactive, Higher = smoother
    const data = Array.from(rawData).map((val, i) => {
      const prev = prevDataRef.current[i] || val;
      const smoothed = prev * smoothFactor + val * (1 - smoothFactor);
      prevDataRef.current[i] = smoothed;
      return smoothed;
    });

    // Clear canvas or draw background image
    if (bgImgRef.current) {
      // Draw background image (Cover mode)
      const img = bgImgRef.current;
      const canvasAspect = canvas.width / canvas.height;
      const imgAspect = img.width / img.height;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawH = canvas.height;
        drawW = canvas.height * imgAspect;
        drawX = (canvas.width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = canvas.width;
        drawH = canvas.width / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawH) / 2;
      }
      
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      
      // Apply dim layer
      ctx.fillStyle = settings.bgColor;
      ctx.globalAlpha = settings.bgDim;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = settings.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Vignette
    const gradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/1.2
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Placement Logic ---
    ctx.save();
    let drawW = canvas.width;
    let drawH = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (settings.placement === 'BOTTOM') {
      drawH = canvas.height * 0.3;
      offsetY = canvas.height - drawH - (canvas.height * 0.05);
    } else if (settings.placement === 'CORNER') {
      drawW = canvas.width * 0.3;
      drawH = canvas.width * 0.3;
      offsetX = canvas.width - drawW - (canvas.width * 0.05);
      offsetY = canvas.height - drawH - (canvas.height * 0.05);
      
      // Add subtle background for corner mode
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(offsetX - 10, offsetY - 10, drawW + 20, drawH + 20, 20);
      else ctx.rect(offsetX - 10, offsetY - 10, drawW + 20, drawH + 20);
      ctx.fill();
    }

    ctx.translate(offsetX, offsetY);

    // Draw Multiple Styles (Layers)
    settings.styles.forEach(style => {
      switch (style) {
        case 'MINIMAL_PULSE': drawMinimalPulse(ctx, data, drawW, drawH, settings); break;
        case 'BARS': drawBars(ctx, data, drawW, drawH, settings); break;
        case 'PARTICLES': drawParticlesPro(ctx, data, drawW, drawH, settings); break;
        case 'RADIAL': drawRadial(ctx, data, drawW, drawH, settings); break;
        case 'KINETIC': drawKinetic(ctx, data, drawW, drawH, settings, songTitle); break;
        case 'ENVIRONMENT': drawEnvironment(ctx, data, drawW, drawH, settings); break;
        case 'GEOMETRIC': drawGeometric(ctx, data, drawW, drawH, settings); break;
        case 'ATMOSPHERIC': drawAtmospheric(ctx, data, drawW, drawH, settings); break;
        case 'AURA': drawAura(ctx, data, drawW, drawH, settings); break;
        case 'ORBITAL': drawOrbital(ctx, data, drawW, drawH, settings); break;
        case 'HORIZON_RIPPLE': drawHorizonRipple(ctx, data, drawW, drawH, settings); break;
        case 'CORNER_BRACKETS': drawCornerBrackets(ctx, data, drawW, drawH, settings); break;
        case 'BREATHING_VIGNETTE': drawBreathingVignette(ctx, data, drawW, drawH, settings); break;
        case 'FLOATING_DOT': drawFloatingDot(ctx, data, drawW, drawH, settings); break;
      }
    });

    ctx.restore();

    // --- Text Overlay Rendering (Higher Quality) ---
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const marginX = 80;
    const marginY = 80;
    
    if (songTitle) {
      // Bold, high-tracking title
      ctx.font = `900 72px "Space Grotesk"`;
      ctx.fillText(songTitle.toUpperCase(), marginX, marginY);
    }
    
    if (artistName) {
      // Medium weight, slightly smaller artist label
      ctx.font = `400 32px "Inter"`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(artistName, marginX, marginY + 90);
    }
    ctx.restore();

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [settings, songTitle, artistName]);

  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, animate]);

  // --- Export Logic ---
  const startExport = () => {
    if (!canvasRef.current || !audioRef.current || !audioContextRef.current) return;

    setIsExporting(true);
    setExportProgress(0);
    chunksRef.current = [];

    const stream = canvasRef.current.captureStream(60); // 60 FPS
    
    // Mix in the audio
    const audioDestination = audioContextRef.current.createMediaStreamDestination();
    sourceRef.current?.connect(audioDestination);
    
    const combinedStream = new MediaStream([
      ...stream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soniccanvas_${songTitle.toLowerCase().replace(/\s+/g, '_')}.webm`;
      a.click();
      setIsExporting(false);
    };

    // Restart audio for full recording
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
    recorder.start();

    // Auto stop at end of audio
    const checkEnd = setInterval(() => {
      if (audioRef.current?.ended) {
        recorder.stop();
        clearInterval(checkEnd);
      }
      if (audioRef.current) {
        setExportProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
    }, 100);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0d10] font-sans selection:bg-teal-500/20">
      <div className="scanline" />
      
      {/* Sidebar Controls */}
      <aside className="w-80 border-r border-white/5 glass-panel flex flex-col z-20">
        <header className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.4)]">
              <Disc className="w-6 h-6 text-black animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">SonicCanvas</h1>
              <p className="mono-label">Audio-to-Video Engine</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* File Upload / Info */}
          <section className="space-y-4 text-center">
             <label className="block w-full cursor-pointer group">
              <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 hover:border-teal-500/50 transition-all bg-zinc-900/40 group-hover:bg-teal-500/5">
                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3 group-hover:text-teal-400 group-hover:scale-110 transition-all" />
                <p className="text-sm font-medium text-zinc-400 mb-1">
                  {audioFile ? audioFile.name : 'Upload Track'}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">MP3 / WAV</p>
              </div>
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </label>

            {audioFile && (
              <div className="space-y-3 pt-4 text-left border-t border-white/5">
                <div>
                   <label className="mono-label">Song Title</label>
                   <input 
                    type="text" 
                    value={songTitle} 
                    placeholder="Enter song title..."
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2 text-sm focus:outline-none focus:border-teal-500" 
                  />
                </div>
                <div>
                   <label className="mono-label">Artist Name</label>
                   <input 
                    type="text" 
                    value={artistName} 
                    placeholder="Enter artist name..."
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2 text-sm focus:outline-none focus:border-teal-500" 
                  />
                </div>
              </div>
            )}
          </section>

          {/* Background Branding */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <Share2 className="w-3 h-3" /> Branding
            </h3>
            
            <label className="block w-full cursor-pointer group">
              <div className="border border-white/5 rounded-xl p-4 bg-zinc-900/40 hover:bg-zinc-800 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {settings.bgImage ? (
                    <img src={settings.bgImage} className="w-full h-full object-cover" alt="Background" />
                  ) : (
                    <Palette className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Background Image</p>
                  <p className="text-[9px] text-zinc-500 truncate">{bgImageFile ? bgImageFile.name : 'Choose JPG/PNG'}</p>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            {settings.bgImage && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="mono-label">Image Opacity</span>
                    <span className="text-[10px] text-teal-500 font-mono">{Math.round((1 - settings.bgDim) * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={1 - settings.bgDim} 
                    onChange={(e) => setSettings(p => ({ ...p, bgDim: 1 - parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                  />
                </div>
                <button 
                  onClick={() => {
                    setSettings(p => ({ ...p, bgImage: null }));
                    setBgImageFile(null);
                    bgImgRef.current = null;
                  }}
                  className="w-full py-2 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                  Remove Image
                </button>
              </div>
            )}
          </section>

          {/* Visualization Style */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <Layout className="w-3 h-3" /> Visual Tier
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(['MINIMAL_PULSE', 'BARS', 'PARTICLES', 'RADIAL', 'KINETIC', 'ENVIRONMENT', 'GEOMETRIC', 'ATMOSPHERIC', 'AURA', 'ORBITAL', 'HORIZON_RIPPLE', 'CORNER_BRACKETS', 'BREATHING_VIGNETTE', 'FLOATING_DOT'] as VisualizerStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setSettings(p => {
                    const exists = p.styles.includes(style);
                    const newStyles = exists 
                      ? p.styles.filter(s => s !== style) 
                      : [...p.styles, style];
                    // Ensure at least one style is always selected
                    return { ...p, styles: newStyles.length > 0 ? newStyles : [style] };
                  })}
                  className={`p-3 rounded-xl border text-[9px] font-black tracking-widest uppercase transition-all ${
                    settings.styles.includes(style) 
                    ? 'bg-teal-500 text-black border-teal-500 shadow-[0_0_15px_rgba(45,212,191,0.3)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  {style.replace('_', ' ')}
                </button>
              ))}
            </div>
          </section>

          {/* Placement */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <Layout className="w-3 h-3" /> Area Placement
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(['FILL', 'BOTTOM', 'CORNER'] as VisualPlacement[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSettings(prev => ({ ...prev, placement: p }))}
                  className={`py-2 rounded-lg border text-[9px] font-bold tracking-widest uppercase transition-all ${
                    settings.placement === p 
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/50' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Customization Sliders */}
          <section className="space-y-6">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <Sliders className="w-3 h-3" /> Engine Tuning
            </h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="mono-label">Bar Width</span>
                  <span className="text-[10px] text-teal-500 font-mono">{settings.barWidth}</span>
                </div>
                <input 
                  type="range" min="2" max="50" step="1" 
                  value={settings.barWidth} 
                  onChange={(e) => setSettings(p => ({ ...p, barWidth: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="mono-label">Gap</span>
                  <span className="text-[10px] text-teal-500 font-mono">{settings.barGap}</span>
                </div>
                <input 
                  type="range" min="0" max="50" step="1" 
                  value={settings.barGap} 
                  onChange={(e) => setSettings(p => ({ ...p, barGap: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="mono-label">Sensitivity</span>
                  <span className="text-[10px] text-teal-500 font-mono">{settings.sensitivity.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="2" step="0.1" 
                  value={settings.sensitivity} 
                  onChange={(e) => setSettings(p => ({ ...p, sensitivity: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="mono-label">Smoothing</span>
                  <span className="text-[10px] text-teal-500 font-mono">{settings.smoothing.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0.1" max="0.99" step="0.01" 
                  value={settings.smoothing} 
                  onChange={(e) => setSettings(p => ({ ...p, smoothing: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="mono-label">Detail (FFT)</span>
                  <span className="text-[10px] text-teal-500 font-mono">{settings.fftSize}</span>
                </div>
                <input 
                  type="range" min="5" max="13" step="1" 
                  value={Math.log2(settings.fftSize)} 
                  onChange={(e) => setSettings(p => ({ ...p, fftSize: Math.pow(2, parseInt(e.target.value)) }))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="mono-label">Visual Response</span>
                  <span className="text-[10px] text-teal-500 font-mono">{settings.intensity}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="3" step="0.1" 
                  value={settings.intensity} 
                  onChange={(e) => setSettings(p => ({ ...p, intensity: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="mono-label">Neon Glow</span>
                  <span className="text-[10px] text-teal-500 font-mono">{Math.round(settings.glowAmount * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={settings.glowAmount} 
                  onChange={(e) => setSettings(p => ({ ...p, glowAmount: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <span className="mono-label">Base Colors</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-[9px] text-zinc-500 w-10 shrink-0 self-center">Wave</span>
                    {['#2dd4bf', '#ec4899', '#a855f7', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ffffff'].map((c) => (
                      <button 
                        key={c}
                        onClick={() => setSettings(p => ({ ...p, waveColor: c }))}
                        className={`w-full h-6 rounded-md border-2 transition-all ${settings.waveColor === c ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[9px] text-zinc-500 w-10 shrink-0 self-center">Back</span>
                    {['#0c0d10', '#17171e', '#1e1b4b', '#2a0c0c', '#064e3b', '#1a1a1a'].map((c) => (
                      <button 
                        key={c}
                        onClick={() => setSettings(p => ({ ...p, bgColor: c }))}
                        className={`w-full h-6 rounded-md border-2 transition-all ${settings.bgColor === c ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer / Support */}
        <footer className="p-6 border-t border-white/5 space-y-4">
          <button 
            disabled={!audioFile || isExporting}
            onClick={startExport}
            className="w-full h-14 bg-white text-black font-display font-bold uppercase tracking-tight flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all rounded-xl disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting {Math.round(exportProgress)}%
              </>
            ) : (
              <>
                <Video className="w-5 h-5 group-hover:scale-110 transition-all" />
                Export as MP4
              </>
            )}
          </button>
        </footer>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.05),transparent)] pointer-events-none" />
        
        {/* Playback Progress Overlay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-30">
          <motion.div 
            className="h-full bg-teal-500 shadow-[0_0_15px_rgba(45,212,191,0.8)]"
            animate={{ width: `${(currentTime / duration) * 100}%` }}
            transition={{ type: 'tween', ease: 'linear' }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-full max-w-5xl relative group">
            {/* Resolution indicator */}
            <div className="absolute -top-12 left-0 flex items-center gap-4">
              <div className="px-3 py-1 bg-zinc-900 border border-white/10 rounded-full flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${audioFile ? 'bg-teal-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="mono-label text-zinc-100">{audioFile ? 'Engine Ready' : 'Awaiting Track'}</span>
              </div>
              <span className="mono-label">Resolution: 1920 x 1080 (HD)</span>
            </div>

            {/* The Visualizer Stage */}
            <div className="relative rounded-3xl overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,0.8)] border-4 border-zinc-900">
               <canvas 
                ref={canvasRef}
                width={1920}
                height={1080}
                className="w-full h-auto bg-black"
              />
              
              {!audioFile && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-10">
                   <div className="relative w-24 h-24 mb-6">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-teal-500 rounded-full blur-3xl"
                      />
                      <Music className="w-16 h-16 text-teal-400 absolute inset-0 m-auto" />
                   </div>
                   <h2 className="font-display font-bold text-2xl mb-2">Import Audio to Begin</h2>
                   <p className="text-zinc-500 text-sm max-w-xs text-center leading-relaxed">
                     Supported formats: MP3, WAV, OGG. Maximum file size: 50MB.
                   </p>
                </div>
              )}
            </div>

            {/* Playback Controls */}
            {audioFile && (
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-8 z-20">
                <div className="flex items-center gap-4 bg-zinc-900/80 backdrop-blur-xl border border-white/5 p-4 rounded-3xl shadow-2xl">
                   <button 
                    onClick={togglePlayback}
                    className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-lg"
                   >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                   </button>
                   
                   <div className="flex flex-col pr-4 min-w-[120px]">
                      <span className="mono-label text-zinc-100 line-clamp-1">{songTitle}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-500">{formatTime(currentTime)}</span>
                        <div className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="font-mono text-[10px] text-zinc-500">{formatTime(duration)}</span>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Hidden Element */}
        <audio 
          ref={audioRef}
          src={audioUrl || undefined}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Global HUD elements */}
        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2">
          <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 flex items-center gap-3">
             <div className="space-y-1">
                <div className="flex gap-1 h-3 items-end">
                   {[...Array(4)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={isPlaying ? { height: [4, 12, 4] } : { height: 4 }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-teal-500 rounded-full"
                    />
                   ))}
                </div>
             </div>
             <span className="mono-label text-[8px] text-teal-500">Live Preview</span>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center"
          >
             <div className="max-w-md w-full p-12 text-center space-y-8">
                <div className="relative w-32 h-32 mx-auto">
                   <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border-4 border-dashed border-teal-500/20 rounded-full"
                   />
                   <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                   >
                     <Video className="w-12 h-12 text-teal-400" />
                   </motion.div>
                </div>

                <div className="space-y-2">
                   <h2 className="font-display font-bold text-3xl">Recording Session</h2>
                   <p className="text-zinc-500 text-sm">We are rendering each frame in real-time. Please keep this tab active for the best quality.</p>
                </div>

                <div className="space-y-4">
                   <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                        className="h-full bg-teal-500 shadow-[0_0_20px_rgba(45,212,191,0.5)]"
                      />
                   </div>
                   <div className="flex justify-between items-center mono-label">
                      <span>Frame Sequence</span>
                      <span className="text-zinc-100">{Math.round(exportProgress)}%</span>
                   </div>
                </div>

                <button 
                  onClick={() => {
                    mediaRecorderRef.current?.stop();
                    setIsExporting(false);
                    audioRef.current?.pause();
                  }}
                  className="px-8 py-3 bg-zinc-900 border border-white/10 rounded-full mono-label text-red-400 hover:bg-red-500/10 transition-all"
                >
                  Cancel Export
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
