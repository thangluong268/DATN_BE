import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosHeaders } from 'axios';
import { Evaluation } from 'domains/evaluation/schema/evaluation.schema';
import { Store } from 'domains/store/schema/store.schema';
import { Model } from 'mongoose';
import { Product } from '../schema/product.schema';

@Injectable()
export class ProductScraping {
  constructor(
    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<Evaluation>,
  ) {}

  // Đồ gia dụng, nội thất, cây cảnh
  async scraping_DoGiaDung_NoiThat_CayCanh() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad3c';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000,
        newPrice: dataResDetail.price,
        description: dataResDetail.body,
        categoryId,
        keywords: ['do gia dung', 'noi that', 'cay canh', 'cay kieng', 'cay phong thuy', 'cay trong nha', 'cay trong van phong'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Đồ điện tử
  async scraping_Do_Dien_Tu() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad3b';
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

        const newProduct = await this.productModel.create({
          avatar: dataResDetail.images,
          quantity: Math.floor(Math.random() * 20) + 2,
          name: dataResDetail.subject,
          oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 10000,
          newPrice: dataResDetail.price,
          description: dataResDetail.body,
          categoryId,
          storeId: storeIds[index % 10],
        });
        await this.evaluationModel.create({ productId: newProduct._id.toString() });
      }
    }
  }

  // Đồ Chơi - Mẹ & Bé
  async scraping_Do_Choi_Me_Be() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad3a';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 100,
        newPrice: dataResDetail.price,
        description: dataResDetail.body,
        categoryId,
        keywords: ['me va be', 'do choi', 'tre em'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Xe cộ
  async scraping_Xe_Co() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad3f';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 500,
        newPrice: dataResDetail.price,
        description: dataResDetail.body,
        categoryId,
        keywords: ['xe', 'xe may', 'o to', 'xe dap', 'xe dap dien', 'xe may dien', 'xe cu', 'xe moi'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Điện lạnh
  async scraping_Dien_Lanh() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad40';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000,
        newPrice: dataResDetail.price,
        description: dataResDetail.body,
        categoryId,
        keywords: ['dien lanh', 'tu lanh', 'may lanh', 'dieu hoa', 'quat', 'quat dieu hoa', 'quat may lanh'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Giải trí, thể thao, sở thích
  async scraping_GiaiTri_TheThao_SoThich() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad41';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000,
        newPrice: dataResDetail.price,
        description: dataResDetail.body,
        categoryId,
        keywords: ['giai tri', 'the thao', 'so thich'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Thú cưng
  async scraping_ThuCung() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad42';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000,
        newPrice: dataResDetail.price,
        description: dataResDetail.body,
        categoryId,
        keywords: ['thu cung', 'cho', 'meo'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Cho tặng
  async scraping_Give() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad43';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: 0,
        newPrice: 0,
        description: dataResDetail.body,
        categoryId,
        keywords: ['cho tang', 'tang', 'mien phi'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Thời trang, đồ dùng cá nhân
  async scraping_Thoi_Trang_Do_Dung_Ca_Nhan() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad3d';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000,
        newPrice: dataResDetail.price,
        description: dataResDetail.body,
        categoryId,
        keywords: ['thoi trang', 'do dung ca nhan', 'quan ao', 'giay dep', 'tui xach', 'phu kien'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }

  // Đồ dùng văn phòng
  async scraping_Do_Dung_Van_Phong() {
    const storeIds = (await this.storeModel.find({}, { _id: 1 }).lean()).map((store) => store._id.toString());
    const categoryId = '65d20668b91436a3f359ad3e';
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

      const newProduct = await this.productModel.create({
        avatar: dataResDetail.images,
        quantity: Math.floor(Math.random() * 20) + 2,
        name: dataResDetail.subject,
        oldPrice: dataResDetail.price + Math.floor(Math.random() * 151 + 100) * 1000,
        newPrice: dataResDetail.price,
        description: dataResDetail.body,
        categoryId,
        keywords: ['do dung van phong', 'may tinh', 'may in', 'may fax', 'may photocopy', 'may chieu', 'may quet', 'may scan'],
        storeId: storeIds[index % 10],
      });
      await this.evaluationModel.create({ productId: newProduct._id.toString() });
    }
  }
}
