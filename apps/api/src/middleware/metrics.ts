import { Request, Response, NextFunction } from 'express';
import { METRICS_WINDOW_MS, METRICS_BUFFER_SIZE } from '@egx/shared';

interface Measurement {
  durationMs: number;
  timestamp: number;
  statusCode: number;
}

/** Circular buffer for fixed-size measurement storage. */
class CircularBuffer {
  private buffer: Measurement[];
  private index = 0;
  private size = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: Measurement): void {
    this.buffer[this.index] = item;
    this.index = (this.index + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  }

  getRecent(windowMs: number): Measurement[] {
    const cutoff = Date.now() - windowMs;
    const result: Measurement[] = [];
    for (let i = 0; i < this.size; i++) {
      const idx = (this.index - 1 - i + this.capacity) % this.capacity;
      const item = this.buffer[idx];
      if (item.timestamp >= cutoff) {
        result.push(item);
      }
    }
    return result;
  }
}

// Map<normalizedRoute, CircularBuffer>
const routeMetrics = new Map<string, CircularBuffer>();

/**
 * Normalizes route path by replacing UUID/numeric params with :param.
 * E.g., /api/accounts/abc-123/meters → /api/accounts/:id/meters
 */
function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on('finish', () => {
    const route = `${req.method} ${normalizeRoute(req.path)}`;
    const durationMs = Date.now() - start;

    if (!routeMetrics.has(route)) {
      routeMetrics.set(route, new CircularBuffer(METRICS_BUFFER_SIZE));
    }

    routeMetrics.get(route)!.push({
      durationMs,
      timestamp: Date.now(),
      statusCode: res.statusCode,
    });
  });

  next();
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export interface RouteMetric {
  route: string;
  requestCount: number;
  errorRate: number;
  p50: number;
  p95: number;
  p99: number;
}

export function getMetrics(): RouteMetric[] {
  const results: RouteMetric[] = [];

  for (const [route, buffer] of routeMetrics.entries()) {
    const recent = buffer.getRecent(METRICS_WINDOW_MS);
    if (recent.length === 0) continue;

    const durations = recent.map((m) => m.durationMs).sort((a, b) => a - b);
    const errors = recent.filter((m) => m.statusCode >= 500).length;

    results.push({
      route,
      requestCount: recent.length,
      errorRate: Math.round((errors / recent.length) * 100) / 100,
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      p99: percentile(durations, 99),
    });
  }

  return results.sort((a, b) => b.requestCount - a.requestCount);
}
