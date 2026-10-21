export function formatError(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  if (typeof err === 'object') {
    const anyErr = err as Record<string, any>;

    // Handle Axios error structure: err.response.data
    const data = anyErr.response?.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      if (typeof data.error === 'string') return data.error;
      if (data.error && typeof data.error === 'object') {
        if (typeof data.error.message === 'string') return data.error.message;
      }
      if (typeof data.message === 'string') return data.message;
    }

    // Direct object with message or error
    if (typeof anyErr.message === 'string') return anyErr.message;
    if (typeof anyErr.error === 'string') return anyErr.error;

    try {
      const json = JSON.stringify(err);
      if (json && json !== '{}') return json;
    } catch {
      // Ignore serialization issues
    }
  }

  return fallback;
}
