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
}
