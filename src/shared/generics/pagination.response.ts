import { Nullable } from '../helpers/type.helper';

export class PaginationResponse<T> {
  message: string;
  metadata: { data: Nullable<T | null>; total: any };
  private constructor(data: Nullable<T>, total: number, message?: string) {
    this.message = message;
    this.metadata = { data, total };
  }

  public static of<T>(data: T[]): PaginationResponse<T[]> {
    return new PaginationResponse(data, data.length);
  }

  public static ofWithTotal<T>(
    data: T[],
    total: number,
  ): PaginationResponse<T[]> {
    return new PaginationResponse(data, total);
  }

  public static ofWithTotalAndMessage<T>(
    data: T[],
    total: number,
    message: string,
  ): PaginationResponse<T[]> {
    return new PaginationResponse(data, total, message);
  }

  public static ok<T>(): PaginationResponse<T[]> {
    return new PaginationResponse(null, null);
  }
}
