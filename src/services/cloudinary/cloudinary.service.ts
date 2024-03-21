import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const streamifier = require('streamifier');

import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export type CloudinaryResponse = UploadApiResponse | UploadApiErrorResponse;

@Injectable()
export class CloudinaryService {
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: 'DATN2024' }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
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
