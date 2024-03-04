import { IsNotEmpty, IsString } from 'class-validator';

export class ReportDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}

export class CreateReportDto extends ReportDto {}
