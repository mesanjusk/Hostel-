export async function register() {
  // no-op; onRequestError below is the part we need
}

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string; renderSource?: string },
) {
  console.error(
    "[onRequestError]",
    request.method,
    request.path,
    "route:",
    context.routePath,
    "type:",
    context.routeType,
    "source:",
    context.renderSource,
    "\n",
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
}
