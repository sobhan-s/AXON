export class ApiError extends Error {
  public statusCode: number;
  public errors: any[];
  public data: null;
  public success: boolean;

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: any[] = [],
    stack?: string,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;
    this.data = null;
    this.success = false;

    Object.setPrototypeOf(this, ApiError.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}
