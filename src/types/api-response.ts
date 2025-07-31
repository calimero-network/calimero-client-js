export type ResponseData<D> =
  | {
      data: D;
      error?: null;
      headers?: Record<string, string>;
    }
  | {
      data?: null;
      error: ErrorResponse;
      headers?: Record<string, string>;
    };

export type ErrorResponse = {
  code?: number;
  message: string;
};

export interface SuccessResponse {
  success: boolean;
}

export type ApiResponse<T> = Promise<ResponseData<T>>;
