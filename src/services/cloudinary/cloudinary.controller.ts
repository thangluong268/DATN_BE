import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, File } from '../cloudinary/cloudinary.service';
import { Express } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: File) {
    return this.cloudinaryService.uploadFile(file);
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: File) {
    return this.cloudinaryService.uploadVideo(file);
  }

  @Get(':publicId/thumbnail')
  async getThumbnail(@Param('publicId') publicId: string) {
    return await this.cloudinaryService.getThumbnail(publicId);
  }

  @Get(':publicId/stream')
  async streamVideo(@Param('publicId') publicId: string) {
    return await this.cloudinaryService.streamVideo(publicId);
  }
}
