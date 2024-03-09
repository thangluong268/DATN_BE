import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { CategoryCreateREQ } from './request/category-create.request';
import { GetCategoryREQ } from './request/category-get.request';
import { CategoryUpdateREQ } from './request/category-update.request';
import { Category } from './schema/category.schema';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  async create(body: CategoryCreateREQ) {
    this.logger.log(`Create: ${body.name}`);
    const newCategory = await this.categoryModel.create(body);
    return BaseResponse.withMessage<Category>(toDocModel(newCategory), 'Tạo danh mục thành công!');
  }

  async getCategories(query: GetCategoryREQ) {
    this.logger.log(`Get Categories: ${JSON.stringify(query)}`);
    const condition = GetCategoryREQ.toQueryCondition(query);
    const categories = await this.categoryModel.find({ ...condition }, { name: 1, url: 1, status: 1 }, { lean: true });
    return BaseResponse.withMessage<Category[]>(categories, 'Lấy danh sách danh mục thành công!');
  }

  async findById(id: string) {
    this.logger.log(`Find By Id: ${id}`);
    const category = await this.categoryModel.findById(id, { createdAt: 0, updatedAt: 0, status: 0 }, { lean: true });
    return BaseResponse.withMessage<Category>(category, 'Lấy thông tin danh mục thành công!');
  }

  async findOne(id: string) {
    this.logger.log(`Find One: ${id}`);
    return await this.categoryModel.findById(id, {}, { lean: true });
  }

  async update(id: string, body: CategoryUpdateREQ) {
    this.logger.log(`Update: ${id}`);
    const updatedPolicy = await this.categoryModel.findByIdAndUpdate({ _id: id }, { ...body }, { new: true, lean: true });
    return BaseResponse.withMessage<Category>(updatedPolicy, 'Cập nhật danh mục thành công!');
  }
}
