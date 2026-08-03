type AnalyticsProperties = Record<string, unknown>;

const analyticsClient = {
  init: (_key?: string, _options?: AnalyticsProperties) => undefined,
  identify: (_id: string, _properties?: AnalyticsProperties) => undefined,
  capture: (_event: string, _properties?: AnalyticsProperties) => undefined,
  register: (_properties: AnalyticsProperties) => undefined,
  get_distinct_id: () => "anonymous"
};

export default analyticsClient;
