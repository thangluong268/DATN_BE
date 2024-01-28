import { Nullable } from '../helpers/type.helper';

export class BaseResponse<T> {
  data: Nullable<T | null>;
  message: string;

  private constructor(data: Nullable<T>, message: string) {
    this.data = data;
    this.message = message;
  }

  public static of<T>(data: T): BaseResponse<T> {
    return new BaseResponse(data, 'OK');
  }

  public static error<T>(error: any): BaseResponse<Nullable<T>> {
    return new BaseResponse(null, error);
  }

  public static ok<T>(): BaseResponse<Nullable<T>> {
    return new BaseResponse(null, 'OK');
  }
}
