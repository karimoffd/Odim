// Utility functions for formatting stage durations and timestamps in Uzbek

/**
 * Format duration in seconds to a friendly human-readable Uzbek string.
 * @param seconds Duration in seconds
 * @param compact If true, returns compact format like '2s 15d', '1k 4s'
 */
export function formatDurationUz(seconds: number | undefined | null, compact = false): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return compact ? '0d' : '0 daqiqa';
  }

  const sec = Math.floor(seconds);

  if (sec < 60) {
    return compact ? `${sec} son` : `${sec} soniya`;
  }

  const minutes = Math.floor(sec / 60);
  const remainingSec = sec % 60;

  if (minutes < 60) {
    if (compact) {
      return remainingSec > 0 ? `${minutes}d ${remainingSec}s` : `${minutes} daq`;
    }
    return remainingSec > 0 ? `${minutes} daqiqa ${remainingSec} soniya` : `${minutes} daqiqa`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    if (compact) {
      return remainingMinutes > 0 ? `${hours}s ${remainingMinutes}d` : `${hours} soat`;
    }
    return remainingMinutes > 0 ? `${hours} soat ${remainingMinutes} daqiqa` : `${hours} soat`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (compact) {
    return remainingHours > 0 ? `${days}k ${remainingHours}s` : `${days} kun`;
  }
  return remainingHours > 0 
    ? `${days} kun ${remainingHours} soat ${remainingMinutes > 0 ? `${remainingMinutes} daqiqa` : ''}`.trim()
    : `${days} kun`;
}

/**
 * Calculate elapsed seconds from an ISO timestamp until now
 */
export function getElapsedSeconds(isoString?: string | null): number {
  if (!isoString) return 0;
  try {
    const start = new Date(isoString).getTime();
    if (isNaN(start)) return 0;
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / 1000));
  } catch {
    return 0;
  }
}

/**
 * Format ISO date string into readable Uzbek format like '21-Sen, 11:45'
 */
export function formatDateTimeUz(isoString?: string | null): string {
  if (!isoString) return 'Noma\'lum';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Noma\'lum';

    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}-${month}, ${hours}:${minutes}`;
  } catch {
    return 'Noma\'lum';
  }
}
