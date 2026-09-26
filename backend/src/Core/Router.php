<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Điều phối: nhận Request, tìm hành động trong bảng route, gọi Controller, trả JSON { data } hoặc { error }.
 * routes: 'foods.list' => [FoodsController::class, 'list']
 */
final class Router
{
    /** @param array<string,array{0:class-string,1:string}> $routes */
    public function __construct(private array $routes, private ?\Closure $guard = null)
    {
    }

    public function run(Request $request): never
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        try {
            if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
                throw new HttpException(405, 'Chỉ chấp nhận phương thức POST');
            }
            $route = $this->routes[$request->action] ?? null;
            if ($route === null) {
                throw new HttpException(404, 'Hành động không tồn tại: ' . $request->action);
            }
            if ($this->guard !== null) {
                ($this->guard)($request->action);
            }
            [$class, $method] = $route;
            $data = (new $class())->$method($request->params, $request);
            self::send(200, ['data' => $data]);
        } catch (HttpException $e) {
            self::send($e->status, ['error' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('[backend] ' . $e);
            self::send(500, ['error' => App::config('debug') ? $e->getMessage() : 'Lỗi máy chủ, vui lòng thử lại']);
        }
    }

    private static function send(int $status, array $payload): never
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
        exit;
    }
}
