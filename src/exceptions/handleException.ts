import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    console.log(`check exception: ${JSON.stringify(exception)}`);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      status: false,
      statusCode: status,
      error:
        exception instanceof HttpException
          ? exception.name
          : 'Internal Server Error',
      detail: exception?.getResponse()?.errors,
      message: exception.message || 'Something went wrong',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
