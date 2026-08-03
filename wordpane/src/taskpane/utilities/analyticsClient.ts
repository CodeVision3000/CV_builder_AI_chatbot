const analyticsClient = {
  init: (...args: unknown[]) => {
    void args;
  },
  identify: (...args: unknown[]) => {
    void args;
  },
  capture: (...args: unknown[]) => {
    void args;
  },
  register: (...args: unknown[]) => {
    void args;
  },
  get_distinct_id: () => "anonymous",
};

export default analyticsClient;
