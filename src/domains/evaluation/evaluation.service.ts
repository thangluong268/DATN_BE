import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../product/schema/product.schema';
import { EmojiDto, HadEvaluation } from './dto/evaluation.dto';
import { Evaluation } from './schema/evaluation.schema';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<Evaluation>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(productId: string): Promise<Evaluation> {
    const newEvaluation = await this.evaluationModel.create({ productId });
    return newEvaluation;
  }

  async update(userId: string, productId: string, name: string): Promise<boolean> {
    const evaluation = await this.evaluationModel.findOne({ productId });
    if (!evaluation) {
      return false;
    }

    const index = evaluation.hadEvaluation.findIndex((had) => had.userId.toString() === userId.toString());
    const newHadEvaluation = new HadEvaluation();
    newHadEvaluation.userId = userId;
    newHadEvaluation.isHad = true;
    if (index == -1) {
      evaluation.hadEvaluation.push(newHadEvaluation);
    }

    return await this.updateEmoji(userId, name, evaluation);
  }

  async updateEmoji(userId: string, name: string, evaluation: Evaluation): Promise<boolean> {
    const index = evaluation.emojis.findIndex((emoji) => emoji.userId.toString() === userId.toString());
    const newEmoji = new EmojiDto();
    newEmoji.userId = userId;
    newEmoji.name = name;
    if (index == -1) {
      evaluation.emojis.push(newEmoji);
    } else {
      if (evaluation.emojis[index].name == name) {
        evaluation.emojis.splice(index, 1);
      } else {
        evaluation.emojis[index] = newEmoji;
      }
    }
    await evaluation.save();
    return true;
  }

  async getByProductId(productId: string): Promise<Evaluation> {
    const evaluation = await this.evaluationModel.findOne({ productId });
    if (!evaluation) {
      return null;
    }
    return evaluation;
  }

  async checkEvaluationByUserIdAndProductId(userId: string, productId: string): Promise<boolean> {
    const evaluation = await this.evaluationModel.findOne({
      productId,
      'hadEvaluation.userId': userId,
      'hadEvaluation.isHad': true,
    });
    return evaluation ? true : false;
  }

  async getProductsLoveByUserId(
    page: number = 1,
    limit: number = 5,
    search: string,
    userId: string,
  ): Promise<{ total: number; data: Product[] }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await this.productModel.find(query).select('_id');

    const productIds = products.map((product) => product._id);

    const total: number = await this.evaluationModel.countDocuments({
      'emojis.userId': userId,
      productId: { $in: productIds },
    });

    const evaluations: Evaluation[] = await this.evaluationModel
      .find({ 'emojis.userId': userId, productId: { $in: productIds } })
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const evaluatedProducts: Product[] = await Promise.all(
      evaluations.map(async (evaluation) => {
        const product = await this.productModel.findById(evaluation.productId);
        return product;
      }),
    );

    return { total, data: evaluatedProducts };
  }
}
