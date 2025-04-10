export const ERROR_MESSAGE = {
  USERNAME_EXISTS: 'Tên đăng nhập đã tồn tại.',

  EMAIL_EXISTS: 'Email đã tồn tại.',

  PHONE_EXISTS: 'Số điện thoại đã tồn tại.',

  USERNAME_EMAIL_EXISTS: 'Tên đăng nhập và email đã tồn tại.',

  EMAIL_PHONE_EXISTS: 'Email và số điện thoại đã tồn tại.',

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

  LIST_PRODUCT_EMPTY: 'Danh sách sản phẩm trống',

  LIST_PRODUCT_NOT_FOUND: 'Có vài sản phẩm trong danh sách không tồn tại',

  INVALID_LIST_PRODUCT: 'Nhà cung cấp không có những sản phẩm này',

  CANNOT_UPDATE_IMPORT_ORDER: 'Không thể cập nhật hóa đơn vì xung đột số lượng',

  REQUIRED_PAYMENT_DUE_DATE: 'Ngày gia hạn thanh toán là bắt buộc',

  INVALID_PAYMENT_DUE_DATE: 'Ngày gia hạn phải sau ngày hôm nay',

  INVALID_PAYMENT_AMOUNT:
    'Số tiền thanh toán phải bằng số tiền đang nợ trong hóa đơn',

  SOMETHING_WRONG: 'Đã có lỗi gì đó xảy ra, vui lòng thử lại sau.',

  INVALID_QUANTITY: (
    productName: string,
    quantityInStock: number,
    requestedQuantity: number,
  ) =>
    `Sản phẩm "${productName}" hiện chỉ còn ${quantityInStock} trong kho, không đủ để đáp ứng yêu cầu số lượng ${requestedQuantity}. Vui lòng điều chỉnh số lượng hoặc chọn sản phẩm khác.`,

  CANNOT_DELETE_SUPPLIER_CUSTOMER: (entity) =>
    `Không thể xóa ${entity} vì còn công nợ.`,

  DELETE_FAILED: (entity1: string, entity2: string) =>
    `Không thể xóa ${entity1} do đã tồn tại ${entity2} bên trong`,

  NOT_FOUND: (entity: string) => `${entity} không được tìm thấy.`,

  ALREADY_EXISTS: (entity: string) => `${entity} đã tồn tại`,
};
