<?php
declare(strict_types=1);

/**
 * API bảng quản trị:  POST backend/api/admin/index.php?action=<hành động>   (thân JSON)  →  { data } hoặc { error }
 * Tên hành động khớp 1-1 với frontend/admin/js/mock/handlers.js. Mọi hành động (trừ ping) yêu cầu đăng nhập bằng tài khoản quản trị.
 */
require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Controllers\FoodsController as Foods;
use App\Controllers\RestaurantsController as Restaurants;
use App\Controllers\ReviewsController as Reviews;
use App\Controllers\SystemController as System;
use App\Controllers\UsersController as Users;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Router;
use App\Core\Session;

$routes = [
    'ping' => [System::class, 'ping'],
    'me' => [System::class, 'me'],
    'counts' => [System::class, 'counts'],
    'search' => [System::class, 'search'],
    'dashboard' => [System::class, 'dashboard'],
    'stats' => [System::class, 'stats'],

    'foods.filterOptions' => [Foods::class, 'filterOptions'],
    'foods.list' => [Foods::class, 'list'],
    'foods.get' => [Foods::class, 'get'],
    'foods.save' => [Foods::class, 'save'],
    'foods.remove' => [Foods::class, 'remove'],
    'foods.bulk' => [Foods::class, 'bulk'],
    'taxonomy.get' => [Foods::class, 'taxonomyGet'],
    'taxonomy.save' => [Foods::class, 'taxonomySave'],
    'taxonomy.remove' => [Foods::class, 'taxonomyRemove'],

    'restaurants.list' => [Restaurants::class, 'list'],
    'restaurants.stats' => [Restaurants::class, 'stats'],
    'restaurants.save' => [Restaurants::class, 'save'],
    'restaurants.remove' => [Restaurants::class, 'remove'],

    'users.stats' => [Users::class, 'stats'],
    'users.list' => [Users::class, 'list'],
    'users.get' => [Users::class, 'get'],
    'users.setStatus' => [Users::class, 'setStatus'],

    'reviews.stats' => [Reviews::class, 'stats'],
    'reviews.list' => [Reviews::class, 'list'],
    'reviews.setStatus' => [Reviews::class, 'setStatus'],
    'reviews.reply' => [Reviews::class, 'reply'],
    'feedback.list' => [Reviews::class, 'feedbackList'],
    'feedback.reply' => [Reviews::class, 'feedbackReply'],

    'settings.get' => [System::class, 'settingsGet'],
    'settings.save' => [System::class, 'settingsSave'],
    'settings.backup' => [System::class, 'settingsBackup'],
    'settings.resetDemo' => [System::class, 'settingsResetDemo'],
    'audit.list' => [System::class, 'auditList'],
];

(new Router($routes, static function (string $action): void {
    if ($action === 'ping') {
        return;
    }
    $u = Session::user();
    if ($u === null) {
        throw new HttpException(401, 'Bạn chưa đăng nhập');
    }
    if ($u['role'] !== 'admin') {
        throw new HttpException(403, 'Tài khoản không có quyền quản trị');
    }
}))->run(new Request());
