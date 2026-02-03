import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Human-friendly byte formatter
export function formatBytes(bytes: number | undefined | null): string {
  if (bytes == null || isNaN(Number(bytes))) return '0 B';
  const b = Number(bytes);
  if (b === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  const value = parseFloat((b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2));
  return `${value} ${units[i]}`;
}

// Simple duration formatter (seconds -> H:MM:SS or M:SS)
export function formatDuration(secondsInput: number | undefined | null): string {
  const s = Number(secondsInput) || 0;
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Map server load (0-100) to text color classes
export function getServerLoadColor(load: number | undefined | null): string {
  const l = Number(load) || 0;
  if (l < 30) return 'text-emerald-700';
  if (l < 70) return 'text-amber-600';
  return 'text-red-600';
}

// Map server load to background color classes for small bars
export function getServerLoadBgColor(load: number | undefined | null): string {
  const l = Number(load) || 0;
  if (l < 30) return 'bg-emerald-100';
  if (l < 70) return 'bg-amber-100';
  return 'bg-red-100';
}

// Format date to readable string
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return 'Invalid date';
  }
}
