export const ERROR_MESSAGE = {
  USERNAME_EXISTS: 'Tên đăng nhập đã tồn tại.',

  EMAIL_EXISTS: 'Email đã tồn tại.',

  USERNAME_EMAIL_EXISTS: 'Tên đăng nhập và email đã tồn tại.',

  INVALID_INPUT_UPDATE: 'Dữ liệu cập nhật không hợp lệ',

  INVALID_INPUT: 'Dữ liệu không hợp lệ',

  NO_DATA_CHANGE: 'Dữ liệu không thay đổi, hãy nhập lại.',

  INTERNAL_ERROR_SERVER: 'Hệ thống bận, vui lòng thử lại.',

  INVALID_CREDENTIALS: 'Thông tin không chính xác, vui lòng thử lại',

  UNAUTHENTICATED: 'Bạn chưa đăng nhập!',

  FORBIDDEN: 'Bạn không có quyền truy cập!',

  INVALID_CONFIRM_PASSWORD: 'Mật khẩu xác thực phải trùng với mật khẩu mới.',

  DUPLICATE_PASSWORD: 'Mật khẩu mới phải khác mật khẩu hiện tại',

  WRONG_PASSWORD: 'Mật khẩu không chính xác!',

  BLOCKED: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để khôi phục.',

  FILE_TYPE: 'Chỉ chấp nhận file có dạng jpeg hoặc png',

  FILE_SIZE: 'Chỉ chấp nhận file có kích thước nhỏ hơn 5MB',

  UPLOAD_FILE_FAILED: 'Lỗi upload file',

  DELETE_FAILED: (entity1: string, entity2: string) =>
    `Không thể xóa ${entity1} do đã tồn tại ${entity2} bên trong`,

  NOT_FOUND: (entity: string) => `${entity} không được tìm thấy.`,

  ALREADY_EXISTS: (entity: string) => `${entity} đã tồn tại`,
};
