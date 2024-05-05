import { BadRequestException } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { Response } from 'express';
import * as xlsx from 'xlsx';
import { ExcelSheetValue } from './type.helper';

export const parseXLSX = async (file) => {
  if (!file) {
    throw new BadRequestException('No file provided');
  }

  const workbook = xlsx.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return data;
};

export async function parseExcelResponse(response: Response, book: Workbook, name?: string) {
  response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  response.setHeader('Access-Control-Expose-Headers', `Content-Disposition`);
  response.setHeader('Content-Disposition', 'attachment; filename=' + `${name}.xlsx`);
  await book.xlsx.write(response);
  response.end();
}

export async function createExcelFile<T>(sheetName: string, headers: ExcelSheetValue<T>, dataRows: T[]) {
  const book = new Workbook();
  const sheet = book.addWorksheet(sheetName, {
    headerFooter: { firstHeader: 'Hello Exceljs', firstFooter: 'Hello World' },
  });
  sheet.columns = Object.keys(headers).map((key) => ({
    header: headers[key].name,
    key,
    width: headers[key].width,
  }));
  // sheet.getRow(1).outlineLevel = 1;
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0099FF' }, bgColor: { argb: '0099FF' } };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
  });
  dataRows.forEach((dataRow) => {
    const row = sheet.addRow(dataRow);
    row.eachCell((cell) => (cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' }));
  });
  return book;
}
