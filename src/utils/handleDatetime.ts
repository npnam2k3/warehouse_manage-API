import * as moment from 'moment';

export function normalizeDate(dateString: any): any {
  return moment(dateString).format('YYYY-MM-DD');
}

export function isDateValidString(dateStr: string): boolean {
  const inputDate = new Date(dateStr);
  const today = new Date();

  // Đưa "today" về 00:00:00 để so sánh đúng theo ngày
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  return inputDate > today;
}

// lấy ngày thứ N trước ngày hiện tại
export function getDateNDaysAgo(days: number, currentDate: string): string {
  return moment(currentDate)
    .subtract(days, 'days')
    .startOf('day')
    .format('YYYY-MM-DD');
}
