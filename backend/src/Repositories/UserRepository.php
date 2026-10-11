<?php
declare(strict_types=1);

namespace App\Repositories;

/** Bảng `users`. */
final class UserRepository extends Repository
{
    protected const TABLE = 'users';

    /** @return array<string,mixed>|null */
    public function findByEmail(string $email): ?array
    {
        $email = mb_strtolower(trim($email));
        foreach ($this->all() as $u) {
            if (mb_strtolower((string) $u['email']) === $email) {
                return $u;
            }
        }
        return null;
    }

    /** Tài khoản đã liên kết Google (cột google_id = "sub" của Google). @return array<string,mixed>|null */
    public function findByGoogleId(string $googleId): ?array
    {
        if ($googleId === '') return null;
        foreach ($this->all() as $u) {
            if (($u['googleId'] ?? null) === $googleId) {
                return $u;
            }
        }
        return null;
    }
}
