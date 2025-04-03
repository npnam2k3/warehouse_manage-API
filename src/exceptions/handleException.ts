import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { ERROR_MESSAGE } from 'src/constants/exception.message';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  // catch(exception: any, host: ArgumentsHost) {
  //   const ctx = host.switchToHttp();
  //   const response = ctx.getResponse();
  //   const request = ctx.getRequest();
  //   // console.log(`check exception: ${JSON.stringify(exception)}`);
  //   console.error('Exception:', exception);

  //   const status =
  //     exception instanceof HttpException
  //       ? exception.getStatus()
  //       : HttpStatus.INTERNAL_SERVER_ERROR;

  //   response.status(status).json({
  //     status: false,
  //     statusCode: status,
  //     error:
  //       exception instanceof HttpException
  //         ? exception.name
  //         : 'Internal Server Error',
  //     detail: exception?.getResponse()?.errors,
  //     message: exception.message || 'Something went wrong',
  //     timestamp: new Date().toISOString(),
  //     path: request.url,
  //   });
  // }
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();

    console.error('Exception:', exception);

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'Something went wrong';
    let detail = null;

    // Xử lý lỗi từ Multer
    if (exception instanceof MulterError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Multer Error';
      switch (exception.code) {
        case 'LIMIT_FILE_SIZE':
          message = ERROR_MESSAGE.FILE_SIZE;
          break;
        default:
          message = exception.message || ERROR_MESSAGE.UPLOAD_FILE_FAILED;
      }
    }
    // Xử lý lỗi HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = exception.name;
      detail = (exception.getResponse() as any)?.errors || null;

      // Custom lỗi PayloadTooLargeException
      if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
        message = ERROR_MESSAGE.FILE_SIZE;
        status = HttpStatus.BAD_REQUEST;
      } else {
        message = exception.message;
      }
    }
    // Các lỗi khác
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Something went wrong';
    }

    response.status(status).json({
      status: false,
      statusCode: status,
      error,
      detail,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
