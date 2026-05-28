export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  errorCode?: string;
  message?: string;
}

export async function readApiData<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T> | T;

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload
  ) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

export async function readApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
      return payload.message;
    }
  } catch {
    try {
      const text = await response.text();
      if (text.trim().length > 0) {
        return text;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}
