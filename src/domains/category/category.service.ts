import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from 'src/shared/generics/base.response';
import { GetCategoriesREQ } from './request/categories-get.request';
import { Category } from './schema/category.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  async getCategories(query: GetCategoriesREQ) {
    const condition = GetCategoriesREQ.toQueryCondition(query);
    const categories = await this.categoryModel.find(
      condition,
      { createdAt: 0, updatedAt: 0, status: 0 },
      { lean: true },
    );
    return BaseResponse.withMessage<Category[]>(
      categories,
      'Lấy danh sách danh mục thành công!',
    );
  }

  async findById(id: string) {
    return await this.categoryModel.findById(
      id,
      {
        createdAt: 0,
        updatedAt: 0,
        status: 0,
      },
      { lean: true },
    );
  }
}
