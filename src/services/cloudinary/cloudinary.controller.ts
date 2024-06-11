import { Controller, Get, Param, Post, Query, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, File } from '../cloudinary/cloudinary.service';
import { CloudinaryDestroyType, CloudinaryFolder } from 'shared/enums/cloudinary.enum';

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Get()
  GetAll() {
    return this.cloudinaryService.getPublicIdsInFolder(CloudinaryFolder.DATN2024);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: File) {
    return this.cloudinaryService.uploadFile(file);
  }

  @Post('destroy-image')
  destroyImage(@Query('publicId') publicId: string) {
    return this.cloudinaryService.destroyFile(publicId, CloudinaryDestroyType.IMAGE);
  }

  @Post('scan')
  @UseInterceptors(FilesInterceptor('files'))
  scanImages(@UploadedFiles() files: File[]) {
    return this.cloudinaryService.scanImageFiles(files);
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
