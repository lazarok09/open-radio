export type ApiErrorContext = { requestId: string; method: string; path: string; status: number; error: unknown };

const printable = (value: string) => value.replace(/[\r\n\t"]/g, " ").slice(0, 500);
export function formatApiError(context: ApiErrorContext) {
  const message = context.error instanceof Error ? context.error.message : "unknown error";
  return `[api.error] requestId="${printable(context.requestId)}" method="${printable(context.method)}" path="${printable(context.path)}" status=${context.status} error="${printable(message)}"`;
}

export function logApiError(context: ApiErrorContext) {
  const line = formatApiError(context);
  console.error(line, context.error instanceof Error ? context.error.stack : context.error);
}
