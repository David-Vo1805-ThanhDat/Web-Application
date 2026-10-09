<?php
declare(strict_types=1);

/** API người dùng đã đăng nhập:  POST backend/api/user/index.php?action=state.get | state.save | reviews.create */
require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Controllers\UserController as UserApi;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Router;
use App\Core\Session;

(new Router([
    'state.get' => [UserApi::class, 'stateGet'],
    'state.save' => [UserApi::class, 'stateSave'],
    'profile.update' => [UserApi::class, 'profileUpdate'],
    'reviews.create' => [UserApi::class, 'reviewCreate'],
], static function (string $action): void {
    if (Session::user() === null) {
        throw new HttpException(401, 'Bạn chưa đăng nhập');
    }
}))->run(new Request());
