<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;

/**
 * "Đăng nhập bằng Google" (OAuth 2.0 Authorization Code + PKCE). Dùng ở backend/api/auth/google.php (bắt đầu) và
 * google-callback.php (Google gọi về). Phiên PHP phải được mở trước (Session::user()) vì state/PKCE lưu trong $_SESSION.
 * Tạo/liên kết tài khoản do AuthService::loginWithGoogle() làm.
 */
final class GoogleAuthService
{
    private const SESSION_KEY = 'google_oauth';
    private const MAX_AGE = 600;   // giây: quá 10 phút từ lúc bấm nút mới quay về thì bắt làm lại

    private array $config;

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? require dirname(__DIR__, 2) . '/config/google.php';
    }

    public function configured(): bool
    {
        return $this->config['client_id'] !== '' && $this->config['client_secret'] !== '' && extension_loaded('curl');
    }

    /** Địa chỉ Google gọi về: lấy từ cấu hình, hoặc tự tính từ địa chỉ đang chạy. */
    public function callbackUrl(): string
    {
        if ($this->config['redirect_uri'] !== '') return $this->config['redirect_uri'];
        $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
        $dir = rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/backend/api/auth/google.php'))), '/');
        return ($https ? 'https' : 'http') . '://' . $host . $dir . '/google-callback.php';
    }

    /** Chỉ cho quay về một trang .html của web người dùng (chặn chuyển hướng sang trang lạ). */
    public static function safeNext(string $next): string
    {
        return preg_match('/^[a-z0-9-]+\.html(\?[A-Za-z0-9_=&%.-]*)?$/', $next) ? $next : 'trang-chu.html';
    }

    /** Bước 1: lưu state + PKCE + trang quay về vào phiên, trả địa chỉ trang chọn tài khoản của Google. */
    public function start(string $next): string
    {
        $state = bin2hex(random_bytes(16));
        $verifier = self::base64url(random_bytes(48));
        $redirect = $this->callbackUrl();
        $_SESSION[self::SESSION_KEY] = ['state' => $state, 'verifier' => $verifier, 'next' => self::safeNext($next), 'redirect' => $redirect, 'at' => time()];
        return $this->config['auth_url'] . '?' . http_build_query([
            'client_id' => $this->config['client_id'],
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'code_challenge' => self::base64url(hash('sha256', $verifier, true)),
            'code_challenge_method' => 'S256',
            'prompt' => 'select_account',
        ]);
    }

    /**
     * Bước 2 (Google gọi về): kiểm tra state, đổi `code` lấy access token, đọc thông tin tài khoản.
     * @return array{sub:string,email:string,name:string,next:string}
     */
    public function finish(string $code, string $state): array
    {
        $saved = $_SESSION[self::SESSION_KEY] ?? null;
        unset($_SESSION[self::SESSION_KEY]);   // mỗi lần bắt đầu chỉ dùng được một lần
        if (!is_array($saved) || $state === '' || !hash_equals((string) $saved['state'], $state) || time() - (int) $saved['at'] > self::MAX_AGE) {
            throw new HttpException(400, 'Phiên đăng nhập Google đã hết hạn, vui lòng thử lại.');
        }
        if ($code === '') throw new HttpException(400, 'Google không trả về mã đăng nhập.');

        $token = $this->request($this->config['token_url'], [
            'code' => $code,
            'client_id' => $this->config['client_id'],
            'client_secret' => $this->config['client_secret'],
            'redirect_uri' => $saved['redirect'],
            'grant_type' => 'authorization_code',
            'code_verifier' => $saved['verifier'],
        ]);
        $access = (string) ($token['access_token'] ?? '');
        if ($access === '') throw new HttpException(502, 'Không nhận được xác nhận từ Google, vui lòng thử lại.');

        $info = $this->request($this->config['userinfo_url'], null, $access);
        $verified = ($info['email_verified'] ?? false) === true || ($info['email_verified'] ?? '') === 'true';
        if (empty($info['sub']) || empty($info['email']) || !$verified) {
            throw new HttpException(403, 'Email Google của bạn chưa được xác minh.');
        }
        return ['sub' => (string) $info['sub'], 'email' => (string) $info['email'], 'name' => (string) ($info['name'] ?? ''), 'next' => (string) $saved['next']];
    }

    /** POST form (khi có $form) hoặc GET kèm Bearer token; trả JSON đã giải mã. */
    private function request(string $url, ?array $form, string $bearer = ''): array
    {
        $curl = curl_init($url);
        if ($curl === false) throw new HttpException(502, 'Không kết nối được Google, vui lòng thử lại.');
        $headers = ['Accept: application/json'];
        if ($bearer !== '') $headers[] = 'Authorization: Bearer ' . $bearer;
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => (int) $this->config['timeout'],
            CURLOPT_HTTPHEADER => $headers,
        ]);
        if ($form !== null) {
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($form));
        }
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        $data = is_string($body) ? json_decode($body, true) : null;
        if ($status !== 200 || !is_array($data)) {
            error_log('[google-login] ' . $url . ' -> HTTP ' . $status);   // không ghi nội dung (có thể chứa token)
            throw new HttpException(502, 'Không kết nối được Google, vui lòng thử lại.');
        }
        return $data;
    }

    private static function base64url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }
}
