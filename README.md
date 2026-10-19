# Ứng Dụng Luyện Phản Xạ 1500 Câu Tiếng Anh Chuẩn 4 Phần

Ứng dụng web học tiếng Anh phản xạ toàn diện gồm 50 Units (1500 câu giao tiếp thực tế) chia làm 4 chế độ học tập chuyên sâu:

1. **Phần 1 - Viết hoàn thiện câu (như sách/PDF)**: Đọc đề bài tiếng Việt, gợi ý từ khóa và điền hoàn chỉnh câu.
2. **Phần 2 - Nghe đáp án bản xứ**: Nghe phát âm giọng đọc chuẩn bản xứ với các chế độ tốc độ (1x, 0.75x chậm), xem phiên âm IPA và giải thích từ vựng.
3. **Phần 3 - Luyện nghe và tự viết lại câu chấm bằng AI**: Nghe âm thanh câu tiếng Anh (ẩn chữ hoặc làm mờ), gõ lại câu và được AI chấm điểm chi tiết từng từ.
4. **Phần 4 - Luyện phát âm chấm bằng AI**: Đọc to vào Microphone, nhận diện giọng nói thời gian thực và được AI phân tích phát âm theo thang điểm 100%, tô màu từng từ chuẩn xác/cần sửa cùng mẹo phát âm chi tiết.

---

## 🚀 Hướng Dẫn Đưa Lên GitHub & Kích Hoạt GitHub Pages (Miễn Phí)

### Cách 1: Sử dụng Git trên máy tính (Khuyên dùng)

1. **Tạo Repository mới trên GitHub**:
   - Truy cập [https://github.com/new](https://github.com/new)
   - Đặt tên Repository (ví dụ: `luyen-1500-cau-tieng-anh`)
   - Để chế độ **Public** và bấm **Create repository**.

2. **Chạy các lệnh sau trong thư mục mã nguồn**:
   ```bash
   # Khởi tạo git (nếu chưa có)
   git init

   # Thêm toàn bộ mã nguồn
   git add .

   # Commit
   git commit -m "feat: Ứng dụng Luyện 1500 câu tiếng Anh 4 phần"

   # Đổi tên nhánh chính thành main
   git branch -M main

   # Liên kết với GitHub repo của bạn (thay username và repo-name)
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git

   # Đẩy code lên GitHub
   git push -u origin main
   ```

3. **Kích hoạt GitHub Pages để xem web**:
   - Vào GitHub Repo của bạn trên trình duyệt.
   - Nhấn vào tab **Settings** (Cài đặt) ở trên cùng.
   - Chọn mục **Pages** ở thanh menu bên trái.
   - Tại phần **Build and deployment** -> **Source**, chọn: **GitHub Actions**.
   - Repo đã có sẵn file `.github/workflows/deploy.yml`, GitHub sẽ tự động build và cung cấp đường link website dạng: `https://<your-username>.github.io/<your-repo-name>/` sau 1-2 phút!

---

### Cách 2: Tải lên trực tiếp trên giao diện web GitHub (Không cần cài Git)

1. Vào [https://github.com/new](https://github.com/new) và tạo một repo mới.
2. Bấm vào nút **Upload files** (hoặc kéo thả toàn bộ thư mục dự án vào trình duyệt).
3. Bấm **Commit changes**.
4. Vào **Settings** -> **Pages** -> chọn Source là **GitHub Actions**.

---

## 🎙️ Vì Sao Microphone / Đọc Lại Không Thấy Chấm Điểm? Cách Khắc Phục:

Nếu bạn bấm vào nút Micro mà không thấy chấm hoặc màn hình đứng yên, nguyên nhân phổ biến nhất là:

1. **Chưa Cho Phép Quyền Microphone**:
   - Khi bấm Micro lần đầu, trình duyệt sẽ hiện thông báo hỏi *"Cho phép sử dụng Micro"*.
   - Nếu bạn vô tình bấm "Chặn" (Block), hãy bấm vào **biểu tượng Ổ Khóa hoặc Micro** ở góc trái thanh địa chỉ URL của trình duyệt -> Bật **Microphone: Cho phép (Allow)** -> Tải lại trang (F5).

2. **Môi trường Trình Duyệt**:
   - Tính năng nhận diện giọng nói (Web Speech API) hoạt động tốt nhất trên: **Google Chrome, Microsoft Edge, Safari iOS 14.5+**.
   - Nếu dùng Firefox hoặc trình duyệt nhúng (in-app browser của Zalo/Facebook), hãy mở liên kết web bằng ứng dụng Google Chrome hoặc Safari.

3. **Tính Năng Chấm Điểm Thay Thế (Không cần Micro)**:
   - Trong màn hình Phần 4, luôn có nút **"⚡ Thử câu đọc mẫu (100%)"**, **"⚠️ Thử câu thiếu từ"**, hoặc bạn có thể **gõ trực tiếp câu đọc vào ô nhập** rồi bấm **"🎯 Chấm Điểm Phát Âm Ngay"** để kiểm tra ngay lập tức mà không cần dùng đến micro.

---

## 🔑 Cấu Hình AI Nâng Cao (Tùy chọn)

- Ứng dụng đã được tích hợp sẵn công cụ chấm điểm offline client-side thông minh (so sánh Levenshtein, tách từ, nhận diện lỗi ending sounds /s/, /ed/, /θ/...).
- Nếu bạn muốn trải nghiệm AI phản hồi chuyên sâu bằng tiếng Việt từ Gemini 2.5/Flash, bạn chỉ cần bấm vào **biểu tượng Chiếc Chìa Khóa 🔑** trên thanh điều hướng góc phải và nhập Google Gemini API Key miễn phí (lấy tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey)). Key được lưu an toàn trong trình duyệt cá nhân của bạn.
