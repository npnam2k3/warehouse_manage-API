import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'warehouse-manager' },
        (error, result: UploadApiResponse) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        },
      );
      const fileStream = Readable.from(file.buffer); // Stream từ buffer
      fileStream.pipe(uploadStream);
    });
  }

  async deleteFile(imageUrl: string): Promise<void> {
    const publicId = this.getPublicIdFromUrl(imageUrl);
    await cloudinary.uploader.destroy(publicId);
  }

  private getPublicIdFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1].split('.')[0];
  }
}
