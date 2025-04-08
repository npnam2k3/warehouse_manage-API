import { plainToInstance } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  validateSync,
} from 'class-validator';
import { OrderPaymentDto } from './order-payment.dto';
export function IsValidOrderArray(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidOrderArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if value is an array
          if (!Array.isArray(value)) {
            return false;
          }

          if (value.length === 0) return false;

          // Transform each item to OrderPaymentDto and validate
          const orderInstance = plainToInstance(OrderPaymentDto, value);
          for (const order of orderInstance) {
            const errors = validateSync(order);
            if (errors.length > 0) {
              return false; // If any order fails validation, return false
            }
          }
          return true;
        },
      },
    });
  };
}
