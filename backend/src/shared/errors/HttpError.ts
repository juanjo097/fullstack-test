type ApiFieldErrors = Record<string, string[]>;
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly fieldErrors?: ApiFieldErrors;
  public readonly expose: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    opts?: { fieldErrors?: ApiFieldErrors; expose?: boolean },
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = opts?.fieldErrors;
    this.expose = opts?.expose ?? true;
  }
}

export const unauthorized = (msg = "Unauthorized") =>
  new HttpError(401, "Unauthorized", msg);

export const forbidden = (msg = "Forbidden") =>
  new HttpError(403, "Forbidden", msg);

export const notFound = (msg = "NotFound") =>
  new HttpError(404, "NotFound", msg);

export const badRequest = (msg = "Bad request") =>
  new HttpError(400, "BadRequest", msg);

export const invalidCredentials = (msg = "Invalid credentials") =>
  new HttpError(401, "InvalidCredentials", msg);
