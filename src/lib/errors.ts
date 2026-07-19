export class AppError extends Error {
  constructor(
    message: string,
    public readonly code = "UNKNOWN",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  return error instanceof Error && error.message ? error.message : fallback;
}
