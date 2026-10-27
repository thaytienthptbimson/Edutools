# Edutools

Trang web tập hợp công cụ dạy và học: có trang chủ cho người xem và trang quản trị để đưa đường link, ảnh minh họa, mô tả và thông báo lên.

Trang chạy hoàn toàn bằng HTML, CSS và JavaScript thuần, không cần máy chủ riêng, không cần cài đặt gì. Có thể đặt lên GitHub Pages, Netlify, Cloudflare Pages hoặc hosting bất kỳ.

## Cấu trúc thư mục

```
edutools/
├── index.html        Trang chủ
├── admin.html        Trang quản trị
├── data.json         Dữ liệu đang xuất bản (công cụ, danh mục, thông báo, thông tin trang)
├── README.md
└── assets/
    ├── style.css     Giao diện dùng chung
    ├── admin.css     Giao diện riêng của trang quản trị
    ├── common.js     Lõi dữ liệu, đăng nhập, xử lý ảnh
    ├── app.js        Mã của trang chủ
    └── admin.js      Mã của trang quản trị
```

## Đưa trang lên GitHub Pages

1. Tạo một kho (repository) mới trên GitHub, ví dụ `edutools`.
2. Tải toàn bộ tệp trong thư mục này lên kho, giữ nguyên cấu trúc.
3. Vào Settings, chọn Pages, ở mục Source chọn nhánh `main` và thư mục `/ (root)`, rồi bấm Save.
4. Sau vài phút, trang chủ có địa chỉ `https://<tên-tài-khoản>.github.io/edutools/` và trang quản trị ở `.../admin.html`.

## Dùng trang quản trị

Mở `admin.html`. **Mật khẩu mặc định là `admin123`**, hãy đổi ngay ở mục Bảo mật.

| Mục | Làm được gì |
| --- | --- |
| Công cụ | Thêm, sửa, xóa, nhân đôi, sắp xếp công cụ. Mỗi công cụ có tên, link, mô tả, hướng dẫn, từ khóa, ảnh minh họa, đánh dấu nổi bật, ẩn hoặc hiện |
| Danh mục | Nhóm công cụ, chọn biểu tượng và màu cho từng nhóm |
| Thông báo | Tin ngắn hiện ở đầu trang chủ, có thể ghim |
| Thông tin trang | Tên trang, tiêu đề, giới thiệu, logo, email, Zalo, Facebook |
| Xuất bản và sao lưu | Đưa thay đổi lên trang, tải hoặc nạp dữ liệu, làm trống, khôi phục dữ liệu mẫu |
| Bảo mật | Đổi mật khẩu |

Ảnh chọn từ máy được tự thu nhỏ (tối đa 800 px) và lưu ngay trong `data.json`, nên không cần quản lý thư mục ảnh. Cũng có thể dán link ảnh có sẵn trên mạng.

### Cách cập nhật trang

Mọi thay đổi trong trang quản trị trước hết được lưu thành **bản nháp** ngay trong trình duyệt. Bấm **Xem thử trang chủ** để xem bản nháp. Khi ưng ý, xuất bản bằng một trong hai cách:

**Cách 1. Đăng thẳng lên GitHub (khuyên dùng).** Ở mục Xuất bản và sao lưu, nhập tên tài khoản, tên kho và token, rồi bấm *Xuất bản lên GitHub*. Sau 1 đến 2 phút, mọi người sẽ thấy thay đổi.

Cách tạo token (làm một lần):
1. GitHub, Settings, Developer settings, Personal access tokens, Fine-grained tokens, Generate new token.
2. Repository access: chọn *Only select repositories* và chọn kho của trang.
3. Permissions: đặt **Contents** thành **Read and write**. Tạo token rồi dán vào trang quản trị.

Token chỉ được lưu trong trình duyệt đang dùng, không nằm trong `data.json`.

**Cách 2. Tải về rồi tự tải lên.** Bấm *Tải data.json về máy*, rồi tải tệp này lên thay tệp `data.json` cũ ở thư mục gốc của trang (trên GitHub dùng nút Add file, Upload files).

## Về bảo mật

Trang chạy trên trình duyệt nên mật khẩu quản trị chỉ có tác dụng **che trang quản trị**, không phải rào chắn thật sự. Điều thực sự bảo vệ nội dung trang công khai là quyền ghi vào kho GitHub (token) hoặc quyền tải tệp lên hosting. Vì vậy:

- Giữ kín token, không dùng máy chung để lưu token.
- Nếu nghi ngờ lộ token, vào GitHub thu hồi token rồi tạo token mới.
- Nội dung nhập vào luôn được xử lý an toàn khi hiển thị, và chỉ chấp nhận liên kết dạng `http`, `https`, `mailto`, `tel` hoặc đường dẫn trong trang.

## Chạy thử trên máy

Có thể mở thẳng `index.html` và `admin.html` bằng trình duyệt. Khi đó trang chủ dùng bản nháp (hoặc dữ liệu mẫu) vì trình duyệt không cho đọc `data.json` từ tệp. Để chạy đúng như khi đã đưa lên mạng, chạy một máy chủ tĩnh trong thư mục này:

```
python3 -m http.server 8000
```

rồi mở `http://localhost:8000`.

## Tùy biến

- Màu sắc, kiểu chữ, khoảng cách: sửa các biến ở đầu `assets/style.css` (khối `:root`).
- Phông chữ lấy từ Google Fonts (Be Vietnam Pro và Mali). Nếu không có mạng, trình duyệt tự dùng phông hệ thống.
- Mật khẩu mặc định: hằng số `DEFAULT_PASSWORD` trong `assets/common.js`.

---

Bản quyền thuộc về Thầy Tiến - GV Trường THPT Bỉm Sơn- Thanh Hóa
