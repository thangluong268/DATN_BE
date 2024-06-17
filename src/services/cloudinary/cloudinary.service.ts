/* eslint-disable @typescript-eslint/no-var-requires */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PICPURIFY_API_KEY } from 'app.config';
import axios from 'axios';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { PICPURIFY_CONTENT } from 'shared/constants/picpurify.constant';
import { CloudinaryDestroyType, CloudinaryFolder } from 'shared/enums/cloudinary.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { isBlank } from 'shared/validators/query.validator';
const FormData = require('form-data');
const streamifier = require('streamifier');
const picpurifyUrl = 'https://www.picpurify.com/analyse/1.1';
const path = require('path');
const fs = require('fs');

// const multer = require('multer');
// const storage = multer.diskStorage({
//   destination: 'uploads/', // Thư mục tạm thời
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });
// multer({ storage: storage });

export type File = Express.Multer.File;
export type CloudinaryResponse = UploadApiResponse | UploadApiErrorResponse;

@Injectable()
export class CloudinaryService {
  async scanImageUrls(urls: string[]) {
    await Promise.all(
      urls.map(async (url) => {
        const form = new FormData();
        form.append('url_image', url);
        form.append('API_KEY', PICPURIFY_API_KEY);
        form.append('task', 'porn_moderation,suggestive_nudity_moderation,gore_moderation,weapon_moderation,drug_moderation');
        const res = await axios({ url: picpurifyUrl, method: 'post', data: form });
        const data = res.data;
        if (data.status === 'success' && data.final_decision === 'KO' && data.reject_criteria.length > 0) {
          const reasons = data.reject_criteria.map((criteria) => PICPURIFY_CONTENT[criteria]).join(', ');
          throw new BadRequestException(`Hình ảnh vi phạm chính sách!\nLý do:\n${reasons}`);
        }
      }),
    );
    return BaseResponse.withMessage({}, 'Hình ảnh hợp lệ');
  }

  async scanImageFiles(files: File[], uid: string) {
    const rejectCriterias = await Promise.all(
      files.map(async (file, index) => {
        const tempFilePath = path.join('uploads', `${uid}-${file.originalname}-${index}`);
        fs.writeFileSync(tempFilePath, file.buffer);
        const form = new FormData();
        const stats = fs.statSync(tempFilePath);
        const fileStream = fs.createReadStream(tempFilePath);
        form.append('file_image', fileStream, { knownLength: stats.size });
        form.append('API_KEY', PICPURIFY_API_KEY);
        form.append('task', 'porn_moderation,suggestive_nudity_moderation,gore_moderation,weapon_moderation,drug_moderation');
        const res = await axios({ url: picpurifyUrl, method: 'post', data: form });
        const data = res.data;
        fs.unlinkSync(tempFilePath);
        if (data.status === 'success' && data.final_decision === 'KO' && data.reject_criteria.length > 0) {
          return data.reject_criteria.map((criteria) => criteria);
        }
      }),
    );
    const leanRejectCriterias = rejectCriterias.filter((criteria) => !isBlank(criteria));
    if (leanRejectCriterias.length === 0) return BaseResponse.withMessage({}, 'Hình ảnh hợp lệ');
    const reasons = Array.from(new Set(leanRejectCriterias.flat()))
      .map((criteria) => PICPURIFY_CONTENT[criteria])
      .join(', ')
      .trimEnd();
    throw new BadRequestException(`Hình ảnh vi phạm chính sách!\nLý do: ${reasons}`);
  }

  uploadFile(file: File) {
    const res = new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: CloudinaryFolder.DATN2024 }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
    return res;
  }

  async uploadVideo(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async getThumbnail(publicId: string) {
    const thumbnailUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        {
          width: 300,
          height: 300,
          crop: 'fill',
        },
      ],
      format: 'png',
    });
    return thumbnailUrl;
  }

  async streamVideo(publicId: string) {
    const videoUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'mp4',
      flags: 'streaming_attachment',
    });
    return videoUrl;
  }

  destroyFile(publicId: string, resourceType: CloudinaryDestroyType) {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  async getPublicIdsInFolder(prefix: CloudinaryFolder) {
    const data = await cloudinary.api.resources({ type: 'upload', prefix, max_results: 500 });
    const publicIds = data.resources.map((resource) => resource.public_id);
    return publicIds;
  }

  extractPublicIdFromURLs(urls: string[], prefix: CloudinaryFolder) {
    const publicIds = urls.map((url) => {
      const id = url.split('/').pop().split('.')[0];
      const publicId = `${prefix}/${id}`;
      return publicId;
    });
    const uniquePublicIds = Array.from(new Set(publicIds));
    return uniquePublicIds;
  }
}
