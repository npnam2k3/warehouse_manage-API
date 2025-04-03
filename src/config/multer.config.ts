import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { ERROR_MESSAGE } from 'src/constants/exception.message';

export const multerOptions: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new BadRequestException(ERROR_MESSAGE.FILE_TYPE), false);
    }
    callback(null, true);
  },
};
