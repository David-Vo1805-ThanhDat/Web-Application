<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;

/** users.* */
final class UsersController
{
    public function stats(): array { return (new UserService())->stats(); }
    public function list(array $p): array { return (new UserService())->list($p); }
    public function get(array $p): array { return (new UserService())->get((int) ($p['id'] ?? 0)); }
    public function setStatus(array $p): array { return (new UserService())->setStatus((int) ($p['id'] ?? 0), (string) ($p['status'] ?? '')); }
}
