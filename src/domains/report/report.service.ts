import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReportDto } from './dto/report.dto';
import { Report } from './schema/report.schema';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
  ) {}

  async create(createReportData: CreateReportDto, userId: string): Promise<Report> {
    const newReport = await this.reportModel.create(createReportData);
    newReport.status = false;
    newReport.userId = userId;
    newReport.type = newReport.type.toUpperCase();
    await newReport.save();
    return newReport;
  }

  async getAllBySearch(
    pageQuery: number = 1,
    limitQuery: number = 5,
    searchQuery: string,
    type: string,
    status: boolean,
  ): Promise<{ total: number; reports: Report[] }> {
    const search = searchQuery
      ? {
          $or: [{ content: { $regex: searchQuery, $options: 'i' } }],
        }
      : {};
    const skip = Number(limitQuery) * (Number(pageQuery) - 1);
    const total = await this.reportModel.countDocuments({ ...search, type: type.toUpperCase(), status });
    const reports = await this.reportModel
      .find({ ...search, type: type.toUpperCase(), status })
      .sort({ createdAt: -1 })
      .limit(Number(limitQuery))
      .skip(skip);

    return { total, reports };
  }

  async getById(id: string): Promise<Report> {
    const report = await this.reportModel.findOne({ _id: id.toString(), status: false }, { __v: 0, status: 0 });
    return report;
  }

  async getByProductIdAndUserId(subjectId: string, userId: string): Promise<Report> {
    const report = await this.reportModel.findOne({ subjectId: subjectId.toString(), userId: userId.toString() });
    return report;
  }

  async updateStatus(id: string): Promise<void> {
    await this.reportModel.updateOne({ _id: id.toString() }, { status: true });
  }

  async countByProductId(subjectId: string): Promise<number> {
    const total = await this.reportModel.countDocuments({ subjectId: subjectId.toString(), status: true });
    return total;
  }

  async delete(id: string): Promise<void> {
    await this.reportModel.deleteOne({ _id: id.toString() });
  }
}
