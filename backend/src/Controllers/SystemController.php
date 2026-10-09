<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Session;
use App\Services\AuditService;
use App\Services\SettingsService;
use App\Services\StatsService;

/** ping, me, counts, search, dashboard, stats, settings.*, audit.list */
final class SystemController
{
    public function ping(): array { return ['ok' => true]; }
    public function me(): array { $u = Session::user(); return ['name' => $u['name'], 'email' => $u['email'], 'role' => $u['role']]; }
    public function counts(): array { return (new StatsService())->counts(); }
    public function search(array $p): array { return (new StatsService())->search($p); }
    public function dashboard(array $p): array { return (new StatsService())->dashboard($p); }
    public function stats(array $p): array { return (new StatsService())->stats($p); }

    public function settingsGet(): array { return (new SettingsService())->get(); }
    public function settingsSave(array $p): array { return (new SettingsService())->save($p); }
    public function settingsBackup(): array { return (new SettingsService())->backup(); }

    public function auditList(array $p): array { return (new AuditService())->list($p); }
}
