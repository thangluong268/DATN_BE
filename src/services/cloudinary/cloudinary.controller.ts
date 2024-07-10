import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { CloudinaryDestroyType, CloudinaryFolder } from 'shared/enums/cloudinary.enum';
import { v4 as uuid } from 'uuid';
import { CloudinaryService, File } from '../cloudinary/cloudinary.service';

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
  @UseInterceptors(
    FilesInterceptor('files', null, {
      fileFilter: (req: any, file: File, cb: any) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|mp4)$/)) {
          // Allow storage of file.
          cb(null, true);
        } else {
          cb(new BadRequestException(`Không hỗ trợ loại file ${extname(file.originalname)}`));
        }
      },
      storage: memoryStorage(),
    }),
  )
  async scanImages(@UploadedFiles() files: File[]) {
    const uid = uuid();
    const uploadPath = 'uploads/';
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    // Save each file to the upload directory
    await Promise.all(
      files.map((file, index) => {
        const filePath = `${uploadPath}${uid}-${file.originalname}-${index}`;
        writeFileSync(filePath, file.buffer);
      }),
    );

    return this.cloudinaryService.scanImageFiles(files, uid);
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
