<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;

/** auth.* — dùng chung cho web người dùng và admin. */
final class AuthController
{
    public function login(array $p): array { return (new AuthService())->login((string) ($p['email'] ?? ''), (string) ($p['password'] ?? '')); }
    public function register(array $p): array { return (new AuthService())->register((string) ($p['name'] ?? ''), (string) ($p['email'] ?? ''), (string) ($p['password'] ?? '')); }
    public function ping(): array { return ['ok' => true]; }
    public function me(): array { return (new AuthService())->me(); }
    public function logout(): array { (new AuthService())->logout(); return ['ok' => true]; }
}
