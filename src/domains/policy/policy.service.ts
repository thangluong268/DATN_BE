import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { PolicyCreateREQ } from './request/policy-create.request';
import { PolicyFindAllByObjectREQ } from './request/policy-find-all-by-object.request';
import { PolicyUpdateREQ } from './request/policy-update.request';
import { Policy } from './schema/policy.schema';

@Injectable()
export class PolicyService {
  constructor(
    @InjectModel(Policy.name)
    private readonly policyModel: Model<Policy>,
  ) {}

  async create(body: PolicyCreateREQ) {
    const newPolicy = await this.policyModel.create(body);
    return BaseResponse.withMessage<Policy>(
      Policy.toDocModel(newPolicy),
      'Tạo chính sách thành công!',
    );
  }

  async findAllByObject(query: PolicyFindAllByObjectREQ) {
    const policies = await this.policyModel.find(
      { policyObject: query.policyObject },
      { _id: 1, name: 1, content: 1, policyObject: 1 },
      { lean: true },
    );
    return BaseResponse.withMessage<Policy[]>(
      policies,
      'Lấy danh sách chính sách thành công!',
    );
  }

  async update(id: string, body: PolicyUpdateREQ) {
    const updatedPolicy = await this.policyModel.findByIdAndUpdate(
      { _id: id },
      { ...body },
      { new: true, lean: true },
    );
    return BaseResponse.withMessage<Policy>(
      updatedPolicy,
      'Cập nhật chính sách thành công!',
    );
  }

  async delete(id: string) {
    await this.policyModel.findByIdAndDelete(id);
    return BaseResponse.withMessage({}, 'Xóa chính sách thành công!');
  }
}
