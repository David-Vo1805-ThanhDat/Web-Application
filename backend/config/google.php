<?php
declare(strict_types=1);

// Cấu hình "Đăng nhập bằng Google" (OAuth 2.0). Chỉ đọc các khoá GOOGLE_* trong backend/.env; biến môi trường được ưu tiên.
// Cách lấy Client ID / Secret: xem mục "Đăng nhập bằng Google" trong backend/README.md.
$local = [];
$envFile = dirname(__DIR__) . '/.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (!preg_match('/^\s*(?:export\s+)?(GOOGLE_[A-Z_]+)\s*=\s*(.*)$/', $line, $match)) continue;
        $value = trim($match[2]);
        if (strlen($value) >= 2 && in_array($value[0], ['"', "'"], true) && substr($value, -1) === $value[0]) {
            $value = substr($value, 1, -1);
        } else {
            $value = trim(preg_replace('/\s+#.*$/', '', $value) ?? '');
        }
        $local[$match[1]] = $value;
    }
}
$setting = static function (string $key, string $default = '') use ($local): string {
    $value = getenv($key);
    if ($value !== false) return trim($value);
    return $local[$key] ?? $default;
};

return [
    'client_id' => $setting('GOOGLE_CLIENT_ID'),
    'client_secret' => $setting('GOOGLE_CLIENT_SECRET'),
    // Địa chỉ Google gọi về sau khi người dùng đồng ý — phải TRÙNG KHỚP với "Authorized redirect URIs" đã khai ở Google Cloud.
    // Để trống: tự tính từ địa chỉ đang chạy (vd. http://localhost:8080/backend/api/auth/google-callback.php).
    'redirect_uri' => $setting('GOOGLE_REDIRECT_URI'),
    // Địa chỉ dịch vụ Google (chỉ đổi khi chạy test với Google giả lập).
    'auth_url' => $setting('GOOGLE_AUTH_URL', 'https://accounts.google.com/o/oauth2/v2/auth'),
    'token_url' => $setting('GOOGLE_TOKEN_URL', 'https://oauth2.googleapis.com/token'),
    'userinfo_url' => $setting('GOOGLE_USERINFO_URL', 'https://openidconnect.googleapis.com/v1/userinfo'),
    'timeout' => 15,
];
