export type Nullable<T> = T | null;
export type ExcelSheetValue<T> = { [key in keyof T]: { name: string; width?: number } };
