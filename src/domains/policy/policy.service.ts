import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { PolicyCreateREQ } from './request/policy-create.request';
import { PolicyFindAllByObjectREQ } from './request/policy-find-all-by-object.request';
import { PolicyUpdateREQ } from './request/policy-update.request';
import { Policy } from './schema/policy.schema';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);
  constructor(
    @InjectModel(Policy.name)
    private readonly policyModel: Model<Policy>,
  ) {}

  async create(body: PolicyCreateREQ) {
    this.logger.log(`create policy: ${JSON.stringify(body)}`);
    const policy = await this.policyModel.findOne({ name: body.name });
    if (policy) throw new ConflictException(`Chính sách: ${body.name} đã tồn tại!`);
    const newPolicy = await this.policyModel.create(body);
    return BaseResponse.withMessage(toDocModel(newPolicy), 'Tạo chính sách thành công!');
  }

  async findAllByObject(query: PolicyFindAllByObjectREQ) {
    this.logger.log(`find all policy by object: ${JSON.stringify(query)}`);
    const conditions = PolicyFindAllByObjectREQ.toQueryCondition(query);
    const policies = await this.policyModel
      .find(conditions, { _id: 1, name: 1, content: 1 }, { lean: true })
      .sort({ createdAt: -1 });
    return BaseResponse.withMessage(policies, 'Lấy danh sách chính sách thành công!');
  }

  async update(id: string, body: PolicyUpdateREQ) {
    this.logger.log(`update policy: ${id}, ${JSON.stringify(body)}`);
    const policy = await this.policyModel.findById(id);
    if (!policy) throw new NotFoundException('Không tìm thấy chính sách!');
    const updatedPolicy = await this.policyModel.findByIdAndUpdate({ _id: id }, { ...body }, { new: true, lean: true });
    return BaseResponse.withMessage(updatedPolicy, 'Cập nhật chính sách thành công!');
  }

  async delete(id: string) {
    this.logger.log(`delete policy: ${id}`);
    const policy = await this.policyModel.findById(id);
    if (!policy) throw new NotFoundException('Không tìm thấy chính sách!');
    await this.policyModel.findByIdAndDelete(id);
    return BaseResponse.withMessage({}, 'Xóa chính sách thành công!');
  }
}
