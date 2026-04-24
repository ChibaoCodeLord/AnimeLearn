# AnimeLearn
## thư viện 
pip install fastapi uvicorn pydantic
## Cách chạy dự án
- chạy frontend
    - cd vào frontend rồi bấm "npm run dev"
- chạy backend
    - cd vào backend rồi bấm "npm run dev"
    - cd vào sripts rồi bấm "py server_AI.py"
# AnimeLearn/frontend
# backend

## Cấu hình gửi email
Backend đang dùng `nodemailer` + SMTP để gửi mail khi admin từ chối video hoặc khi bạn cần thêm luồng email khác.

1. Tạo file `backend/.env`.
2. Điền các biến SMTP sau:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM="AnimeLearn <your_email@gmail.com>"
```

3. Nếu dùng Gmail, hãy bật 2-step verification và tạo App Password. Không dùng mật khẩu đăng nhập thường.
4. Khởi động lại backend sau khi đổi env.

### Ý nghĩa các biến
- `SMTP_HOST`: máy chủ SMTP của nhà cung cấp mail.
- `SMTP_PORT`: thường là `587` với TLS hoặc `465` với SSL.
- `SMTP_SECURE`: để `false` cho cổng `587`, `true` cho cổng `465`.
- `SMTP_USER`: địa chỉ email dùng để gửi.
- `SMTP_PASS`: mật khẩu ứng dụng hoặc password SMTP.
- `SMTP_FROM`: tên người gửi hiển thị trên email.

### Cách test nhanh
- Vào admin, từ chối một video và nhập lý do.
- Nếu SMTP cấu hình đúng, user sẽ nhận email ngay sau khi trạng thái chuyển sang `rejected`.
- Nếu thiếu SMTP env, backend sẽ vẫn cập nhật trạng thái nhưng chỉ log cảnh báo và bỏ qua mail.

