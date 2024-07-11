import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosHeaders } from 'axios';
import { Evaluation } from 'domains/evaluation/schema/evaluation.schema';
import { Store } from 'domains/store/schema/store.schema';
import { Model } from 'mongoose';
import { Product } from '../schema/product.schema';
import { Category } from 'domains/category/schema/category.schema';

@Injectable()
export class ProductScraping {
  constructor(
    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<Evaluation>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  // Đồ gia dụng, nội thất, cây cảnh
  async scraping_DoGiaDung_NoiThat_CayCanh() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Đồ gia dụng, nội thất, cây cảnh' }).lean();
    const scrapingId = '14000';
    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=3&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000 : 0,
        newPrice: dataResDetail.price || 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['do gia dung', 'noi that', 'cay canh', 'cay kieng', 'cay phong thuy', 'cay trong nha', 'cay trong van phong'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Đồ điện tử
  async scraping_Do_Dien_Tu() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Đồ điện tử' }).lean();
    const scrapingIds = ['5010', '5020', '5030', '5050', '5060'];
    for (const scrapingId of scrapingIds) {
      const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=4&st=s,k&limit=10&key_param_included=true`;
      const headers = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const res = await axios.get(url, { headers });
      const dataRes = res.data.ads;

      for (const [index, data] of dataRes.entries()) {
        const productOfScrapingId = data.list_id;
        const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
        const headersDetail = new AxiosHeaders();
        headers.set('Content-Type', 'application/json');
        const resDetail = await axios.get(urlDetail, { headers: headersDetail });
        const dataResDetail = resDetail.data.ad;

        const store = stores[index % 10];
        const newProduct = await this.productModel.create({
          avatar: dataResDetail.images,
          quantity: Math.floor(Math.random() * 20) + 2,
          name: dataResDetail.subject,
          oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 10000 : 0,
          newPrice: dataResDetail.price || 0,
          description: dataResDetail.body,
          categoryId: category._id.toString(),
          categoryName: category.name,
          storeId: store._id.toString(),
          storeName: store.name,
          storeAvatar: store.avatar,
        });
        await this.evaluationModel.create({ productId: newProduct._id.toString() });
      }
    }
  }

  // Đồ Chơi - Mẹ & Bé
  async scraping_Do_Choi_Me_Be() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Đồ Chơi - Mẹ & Bé' }).lean();
    const scrapingId = '11010';
    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=2&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 100 : 0,
        newPrice: dataResDetail.price || 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['me va be', 'do choi', 'tre em'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Xe cộ
  async scraping_Xe_Co() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Xe cộ' }).lean();
    const scrapingId = '2000';
    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=2&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 500 : 0,
        newPrice: dataResDetail.price || 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['xe', 'xe may', 'o to', 'xe dap', 'xe dap dien', 'xe may dien', 'xe cu', 'xe moi'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Điện lạnh
  async scraping_Dien_Lanh() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Điện lạnh' }).lean();
    const scrapingId = '9000';
    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=2&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000 : 0,
        newPrice: dataResDetail.price || 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['dien lanh', 'tu lanh', 'may lanh', 'dieu hoa', 'quat', 'quat dieu hoa', 'quat may lanh'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Giải trí, thể thao, sở thích
  async scraping_GiaiTri_TheThao_SoThich() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Giải trí, thể thao, sở thích' }).lean();
    const scrapingId = '4000';
    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=2&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000 : 0,
        newPrice: dataResDetail.price || 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['giai tri', 'the thao', 'so thich'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Thú cưng
  async scraping_ThuCung() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Thú cưng' }).lean();
    const scrapingId = '12000';
    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=2&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000 : 0,
        newPrice: dataResDetail.price || 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['thu cung', 'cho', 'meo'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Cho tặng
  async scraping_Give() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Cho tặng miễn phí' }).lean();
    const url = `https://gateway.chotot.com/v1/public/ad-listing?giveaway=true&o=20&page=2&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: 0,
        newPrice: 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['cho tang', 'tang', 'mien phi'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Thời trang, đồ dùng cá nhân
  async scraping_Thoi_Trang_Do_Dung_Ca_Nhan() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Thời trang, đồ dùng cá nhân' }).lean();
    const scrapingId = '3000';
    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=2&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000 : 0,
        newPrice: dataResDetail.price || 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['thoi trang', 'do dung ca nhan', 'quan ao', 'giay dep', 'tui xach', 'phu kien'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Đồ dùng văn phòng
  async scraping_Do_Dung_Van_Phong() {
    const stores = await this.storeModel.find({}, { _id: 1, name: 1, avatar: 1 }).lean();
    const category = await this.categoryModel.findOne({ name: 'Đồ dùng văn phòng' }).lean();
    const scrapingId = '8000';
    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=${scrapingId}&o=20&page=2&st=s,k&limit=50&key_param_included=true`;
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    const res = await axios.get(url, { headers });
    const dataRes = res.data.ads;

    for (const [index, data] of dataRes.entries()) {
      const productOfScrapingId = data.list_id;
      const urlDetail = `https://gateway.chotot.com/v2/public/ad-listing/${productOfScrapingId}?adview_position=true&tm=treatment2`;
      const headersDetail = new AxiosHeaders();
      headers.set('Content-Type', 'application/json');
      const resDetail = await axios.get(urlDetail, { headers: headersDetail });
      const dataResDetail = resDetail.data.ad;

      const store = stores[index % 10];
      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price ? dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000 : 0,
        newPrice: dataResDetail.price || 0,
        description: dataResDetail.body,
        categoryId: category._id.toString(),
        categoryName: category.name,
        keywords: ['do dung van phong', 'may tinh', 'may in', 'may fax', 'may photocopy', 'may chieu', 'may quet', 'may scan'],
        storeId: store._id.toString(),
        storeName: store.name,
        storeAvatar: store.avatar,
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }
}
