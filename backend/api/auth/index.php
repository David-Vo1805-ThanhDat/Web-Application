<?php
declare(strict_types=1);

/** API đăng nhập dùng chung:  POST backend/api/auth/index.php?action=login|register|me|logout|ping  →  { data } hoặc { error } */
require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Controllers\AuthController as Auth;
use App\Core\Request;
use App\Core\Router;

(new Router([
    'login' => [Auth::class, 'login'],
    'register' => [Auth::class, 'register'],
    'ping' => [Auth::class, 'ping'],
    'me' => [Auth::class, 'me'],
    'logout' => [Auth::class, 'logout'],
]))->run(new Request());
