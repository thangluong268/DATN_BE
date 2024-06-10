/* eslint-disable @typescript-eslint/no-var-requires */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PICPURIFY_API_KEY } from 'app.config';
import axios from 'axios';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { PICPURIFY_CONTENT } from 'shared/constants/picpurify.constant';
import { BaseResponse } from 'shared/generics/base.response';
const FormData = require('form-data');
const streamifier = require('streamifier');
const picpurifyUrl = 'https://www.picpurify.com/analyse/1.1';

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

  async scanImageFiles(files: File[]) {
    for (const file of files) {
      const form = new FormData();
      form.append('file_image', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        knownLength: file.size,
      });
      form.append('API_KEY', PICPURIFY_API_KEY);
      form.append('task', 'porn_moderation,suggestive_nudity_moderation,gore_moderation,weapon_moderation,drug_moderation');
      const res = await axios({ url: picpurifyUrl, method: 'post', data: form });
      const data = res.data;
      if (data.status === 'success' && data.final_decision === 'KO' && data.reject_criteria.length > 0) {
        const reasons = data.reject_criteria.map((criteria) => PICPURIFY_CONTENT[criteria]).join(', ');
        throw new BadRequestException(`Hình ảnh vi phạm chính sách!\nLý do: ${reasons}`);
      }
    }
    return BaseResponse.withMessage({}, 'Hình ảnh hợp lệ');
  }

  uploadFile(file: File) {
    const res = new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: 'DATN2024' }, (error, result) => {
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
}
