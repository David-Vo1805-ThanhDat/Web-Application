<?php
declare(strict_types=1);

namespace App\Core;

/** Phiên đăng nhập PHP (cookie HttpOnly, SameSite=Lax). Lưu: id, email, name, role ('admin' | 'user'). */
final class Session
{
    private static bool $started = false;

    private static function start(): void
    {
        if (self::$started) {
            return;
        }
        session_name((string) App::config('session_name', 'HNAGSESSID'));
        session_set_cookie_params([
            'lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
            'secure' => !empty($_SERVER['HTTPS']),
        ]);
        session_start();
        self::$started = true;
    }

    /** @return array{id:int|string,email:string,name:string,role:string}|null */
    public static function user(): ?array
    {
        self::start();
        $u = $_SESSION['user'] ?? null;
        if (!$u) {
            return null;
        }
        if (time() - (int) ($_SESSION['at'] ?? 0) > (int) App::config('session_lifetime', 28800)) {
            self::logout();
            return null;
        }
        return $u;
    }

    /** @param array{id:int|string,email:string,name:string,role:string} $user */
    public static function login(array $user): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION['user'] = $user;
        $_SESSION['at'] = time();
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        self::$started = false;
    }

    public static function actorName(): string
    {
        return self::user()['name'] ?? 'Hệ thống';
    }
}
