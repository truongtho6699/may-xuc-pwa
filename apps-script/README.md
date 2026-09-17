# Dịch vụ lưu ảnh Google Drive – Nhật ký máy Nghi Sơn

Mục tiêu: dữ liệu nghiệp vụ lưu ở Supabase; ảnh lưu Google Drive; Supabase chỉ lưu File ID/URL/metadata.

## Thư mục Drive đã tạo

- Tên: `Nghi Sơn - Ảnh nhật ký máy`
- Folder ID: `1k7GwdI63ABzziT0KuK7Wx3ZRUXmZL6g5`

## Công bố Apps Script Web App

1. Tạo một dự án Google Apps Script mới bằng đúng tài khoản sở hữu thư mục Drive trên.
2. Dán nội dung file `DriveUpload.gs` vào `Code.gs`.
3. Chọn **Triển khai → Lần triển khai mới → Ứng dụng web**.
4. Thực thi với tư cách: **Tôi**.
5. Quyền truy cập: chọn phạm vi phù hợp với tổ chức; ứng dụng tự kiểm tra `auth_token` Nghi Sơn với Supabase trước khi ghi ảnh.
6. Cho phép quyền Google Drive khi Google yêu cầu.
7. Sao chép URL kết thúc bằng `/exec`.
8. Mở `js/config.js`, điền URL đó vào `DRIVE_UPLOAD_URL`.

Sau khi điền URL, toàn bộ ảnh ca đầu/ca cuối, đổ dầu, sự cố, bơm mỡ tự động đi theo luồng:

`PWA/IndexedDB -> Apps Script -> Google Drive -> File ID/URL -> Supabase attachments`

Nếu `DRIVE_UPLOAD_URL` còn trống, hệ thống vẫn dùng Supabase Storage tạm thời để không làm gián đoạn vận hành.
