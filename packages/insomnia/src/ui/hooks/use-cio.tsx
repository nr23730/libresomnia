// LOCAL BUILD: Customer.io telemetry removed completely.
// The upstream module loaded the @customerio/cdp-analytics-browser SDK, identified
// users and sent product events + in-app messages. All entry points are no-ops
// here; the exports are kept so call sites compile unchanged.

export function trackCioEvent(_event: string, _properties?: Record<string, unknown>): void {
  // no-op
}

export function useCio(): void {
  // no-op
}
