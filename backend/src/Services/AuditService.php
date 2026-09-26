<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Session;
use App\Repositories\AuditRepository;
use App\Support\Paginator;
use App\Support\Str;

/** Nhật ký hoạt động: các Service khác gọi log() sau mỗi thao tác quan trọng; trang "Nhật ký" gọi list(). */
final class AuditService
{
    private AuditRepository $repo;

    public function __construct(?AuditRepository $repo = null)
    {
        $this->repo = $repo ?? new AuditRepository();
    }

    /** type: edit | approve | user | lock | add | reply | delete | login */
    public function log(string $type, string $text, ?string $actor = null): void
    {
        $this->repo->prepend([
            'id' => $this->repo->nextId(), 'type' => $type, 'actor' => $actor ?? Session::actorName(), 'text' => $text,
            'ip' => (string) ($_SERVER['REMOTE_ADDR'] ?? ''), 'ts' => self::nowMs(),
        ]);
    }

    /** @return list<array<string,mixed>> */
    public function recent(int $n): array
    {
        return array_slice($this->repo->all(), 0, $n);
    }

    /** @param array<string,mixed> $p q, type, actor, days, page, pageSize */
    public function list(array $p): array
    {
        $q = Str::norm($p['q'] ?? '');
        $since = !empty($p['days']) ? self::nowMs() - (int) $p['days'] * 86400000 : 0;
        $all = $this->repo->all();
        $rows = array_values(array_filter($all, static function (array $e) use ($q, $p, $since): bool {
            if ($q !== '' && !str_contains(Str::norm($e['actor'] . ' ' . $e['text']), $q)) return false;
            if (($p['type'] ?? 'all') !== 'all' && $e['type'] !== $p['type']) return false;
            if (($p['actor'] ?? 'all') !== 'all' && $e['actor'] !== $p['actor']) return false;
            return !($since && $e['ts'] < $since);
        }));
        usort($rows, static fn (array $a, array $b): int => $b['ts'] <=> $a['ts']);
        $out = Paginator::paginate($rows, $p);
        $out['actors'] = array_values(array_unique(array_column($all, 'actor')));
        $out['all'] = count($all);
        return $out;
    }

    public static function nowMs(): int
    {
        return (int) round(microtime(true) * 1000);
    }
}
