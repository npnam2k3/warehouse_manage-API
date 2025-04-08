import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  validateSync,
} from 'class-validator';
import { PaymentStatus } from '../enum';
import { ImportProductDTO } from './product-import.dto';
import { plainToInstance } from 'class-transformer';

export function IsRequiredDueDate(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isRequiredDueDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const paymentStatus = (args.object as any).payment_status;

          if (
            paymentStatus === PaymentStatus.UNPAID ||
            paymentStatus === PaymentStatus.PARTIALLY_PAID
          ) {
            // Trường hợp 1: Thiếu hoặc null
            if (value === undefined || value === null) {
              (args.object as any).__errorType = 'missing';
              return false;
            }

            // Trường hợp 2: Không phải Date hợp lệ
            if (!(value instanceof Date) || isNaN(value.getTime())) {
              (args.object as any).__errorType = 'invalid';
              return false;
            }

            // Trường hợp 3: Ngày trước ngày hiện tại
            const inputDate = new Date(value);
            inputDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (inputDate < today) {
              (args.object as any).__errorType = 'beforeToday';
              return false;
            }

            delete (args.object as any).__errorType; // Xóa nếu hợp lệ
            return true;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          const errorType = (args.object as any).__errorType;

          switch (errorType) {
            case 'missing':
              return 'Ngày gia hạn thanh toán là bắt buộc';
            case 'invalid':
              return 'Ngày gia hạn thanh toán phải là một ngày hợp lệ';
            case 'beforeToday':
              return 'Ngày gia hạn thanh toán không được nhỏ hơn ngày hôm nay';
            default:
              return 'Ngày gia hạn thanh toán không hợp lệ';
          }
        },
      },
    });
  };
}

export function IsValidProductArray(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidProductArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if value is an array
          if (!Array.isArray(value)) {
            return false;
          }

          // Transform each item to ImportProductDTO and validate
          const productInstances = plainToInstance(ImportProductDTO, value);
          for (const product of productInstances) {
            const errors = validateSync(product);
            if (errors.length > 0) {
              return false; // If any product fails validation, return false
            }
          }
          return true;
        },
      },
    });
  };
}
