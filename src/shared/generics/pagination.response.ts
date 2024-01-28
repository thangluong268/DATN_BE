import { Nullable } from '../helpers/type.helper';

export class PaginationResponse<T> {
  data: Nullable<T | null>;
  total: any;

  private constructor(data: Nullable<T>, total: number) {
    this.data = data;
    this.total = total;
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

  public static ok<T>(): PaginationResponse<T[]> {
    return new PaginationResponse(null, null);
  }
}
