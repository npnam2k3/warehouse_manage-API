import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get<string>(ENTITIES_MESSAGE.CLOUDINARY_NAME),
      api_key: configService.get<string>(ENTITIES_MESSAGE.API_KEY),
      api_secret: configService.get<string>(ENTITIES_MESSAGE.API_SECRET),
    });
  },
  inject: [ConfigService],
};
