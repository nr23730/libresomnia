// LOCAL BUILD: the Segment SDK (@segment/analytics-node) has been removed from this
// package entirely. InsomniaAnalytics remains as a no-op stub so existing call sites
// keep compiling; nothing is sent anywhere.

export interface AppContext {
  appName: string;
  appVersion: string;
  osVersion: string | (() => string);
  platform: 'app' | 'cli';
}

export interface TrackOptions {
  event: string;
  properties?: Record<string, unknown>;
  anonymousId: string;
  userId?: string;
}

export interface PageOptions {
  name: string;
  anonymousId: string;
  userId?: string;
}

export interface InsomniaAnalyticsOptions {
  writeKey: string;
  app: AppContext;
  settings?: unknown;
  onError?: (error: unknown) => void;
}

export function getNormalizedOsName(platform: NodeJS.Platform | string): string {
  switch (platform) {
    case 'darwin': {
      return 'mac';
    }
    case 'win32': {
      return 'windows';
    }
    default: {
      return platform;
    }
  }
}

// No-op stub: telemetry is removed in the local build. The class shape is kept
// so call sites compile unchanged; no client is constructed and nothing is sent.
export class InsomniaAnalytics {
  constructor(_options: InsomniaAnalyticsOptions) {
    // no-op
  }

  track(_options: TrackOptions): void {
    // no-op
  }

  page(_options: PageOptions): void {
    // no-op
  }

  async closeAndFlush(_timeoutMs = 5000): Promise<void> {
    // no-op
  }
}
