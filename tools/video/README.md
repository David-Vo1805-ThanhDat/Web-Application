# Video giới thiệu (`frontend/video/gioi-thieu.mp4`)

Video 38 giây ở trang giới thiệu (`index.html`, khối "Bụng bạn đã chọn được món chưa?"). Video **không dùng hình AI**: giao diện trong video là ảnh chụp và quay màn hình thật của web. Nhạc nền và hiệu ứng âm thanh tự tổng hợp bằng code nên không vướng bản quyền. Giọng đọc do nhóm tự thu.

Thư mục này chỉ giữ **script**. Ảnh chụp, clip, khung hình và file âm thanh đều tạo lại được, và đã nằm trong `.gitignore`.

## Các file

| File | Việc |
|---|---|
| `capture.js` | Chụp giao diện thật ở chế độ điện thoại vào `shots/`, dùng database tạm `hnag_test_*` (không đụng dữ liệu thật) |
| `record-box-d.js` | Quay màn hình trò "Hộp bí ẩn" (bản máy tính) vào `rec-d/` |
| `video.html` | Kịch bản dựng hình 1280×720. Hàm `render(t)` vẽ khung hình tại giây `t`. Mở `video.html?play` để xem chạy thử trong trình duyệt |
| `render.js` | Xuất từng khung hình (30 khung/giây) vào `frames/`. Chạy `node render.js preview` để xuất vài khung xem trước |
| `audio.py` | Tổng hợp nhạc nền marimba và hiệu ứng, ghép giọng nhóm (`voice/clean.wav`), cho nhạc nhỏ lại khi có giọng → `soundtrack.wav` |
| `asr.py` | Whisper chạy trên máy, lấy mốc thời gian từng chữ của file ghi âm để biết cắt và ghép câu ở đâu |

## Làm lại video (chạy trong thư mục này, cần XAMPP MySQL đang chạy và có ffmpeg)

```bash
node capture.js                 # 1. chụp giao diện → shots/
node record-box-d.js            # 2. quay trò hộp quà → rec-d/*.webm
# 3. cắt ảnh vào assets/: pho.jpg, wheel.png, wheel-nhom.png, nhom-view.jpg (lấy từ shots/), logo-256.png,
#    chat-bot-192.png (lấy từ frontend/image/), box-clip-d.mp4 (cắt từ rec-d/, xem lệnh ffmpeg bên dưới)
# 4. giọng: lọc file ghi âm của nhóm thành voice/clean.wav (mono 44,1 kHz)
ffmpeg -i "<file ghi âm>" -af "highpass=f=85,lowpass=f=12000,afftdn=nf=-28,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-18:TP=-2" -ar 44100 -ac 1 voice/clean.wav
python audio.py                 # 5. → soundtrack.wav (mốc đặt từng câu ở mảng VOICE)
node render.js                  # 6. → frames/0000.jpg ...
ffmpeg -framerate 30 -i frames/%04d.jpg -i soundtrack.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -ac 2 -shortest -movflags +faststart ../../frontend/video/gioi-thieu.mp4
```

Clip hộp quà: `ffmpeg -ss <giây trước lúc bấm khoảng 1,6 s> -i rec-d/<file>.webm -t 4.8 -vf "crop=1040:570:150:110" -an -c:v libx264 -g 1 -crf 16 -pix_fmt yuv420p assets/box-clip-d.mp4`. Sau đó đo lại mốc "súng bắn" và "nổ" trong clip rồi sửa phần `# cảnh 5` của `audio.py`.

## Ghi chú

- **Không dùng `frontend/audio/nhac-nen.mp3` cho video.** Đó là bài "Ăn Sáng Nha" (ERIK ft. Suni Hạ Linh), có bản quyền, đăng mạng dễ bị đánh bản quyền.
- Phụ đề: `frontend/video/gioi-thieu.vtt`. Sửa lời hoặc mốc thời gian thì sửa luôn file này.
- Món kết quả trong video là Phở Bò Hà Nội, vì nhiều món khác đang dùng ảnh sai (xem `backend/HANDOFF.md`).
