// LOCAL BUILD: analytics removed completely.
//
// Upstream this module constructed the Segment client (insomnia-analytics) at
// module-load time and forwarded events (plus Sentry exception reports). In this
// cloud-free build every entry point is a no-op: no client is constructed, no
// network request is made. The exports are kept so the many call sites (IPC
// handlers, git/MCP services, routes) compile unchanged. The AnalyticsEvent enum
// is re-exported from insomnia-analytics (plain enum, no SDK side effects).

export { AnalyticsEvent } from 'insomnia-analytics';

export function setCurrentOrganizationId(_id: string | undefined): void {
  // no-op
}

export function trackAnalyticsEvent(_event: string, _properties?: Record<string, any>): void {
  // no-op
}

export function trackPageView(_name: string): void {
  // no-op
}
