// Origin backend, lấy từ biến môi trường (.env: VITE_API_URL)
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Chuẩn hóa link ảnh: giữ nguyên nếu là URL tuyệt đối, còn lại ghép với origin backend.
// Trả về null khi không có ảnh để component tự xử lý placeholder.
export const toImg = (url) =>
  !url ? null : url.startsWith('http') ? url : `${SERVER_URL}${url}`;

export default toImg;
