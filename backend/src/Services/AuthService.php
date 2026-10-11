<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;
use App\Core\Session;
use App\Repositories\SettingsRepository;
use App\Repositories\UserRepository;

/**
 * Đăng nhập / đăng ký / đăng xuất dùng chung cho web người dùng và admin.
 * Tài khoản quản trị nằm trong settings.admins (role 'admin'); người dùng thường nằm trong bảng users (role 'user').
 */
final class AuthService
{
    private UserRepository $users;
    private SettingsRepository $settings;

    public function __construct(?UserRepository $users = null, ?SettingsRepository $settings = null)
    {
        $this->users = $users ?? new UserRepository();
        $this->settings = $settings ?? new SettingsRepository();
    }

    /** @return array{email:string,name:string,role:string} */
    public function login(string $email, string $password): array
    {
        $email = mb_strtolower(trim($email));
        if ($email === '' || $password === '') {
            throw new HttpException(422, 'Vui lòng nhập email và mật khẩu');
        }
        $fail = new HttpException(401, 'Email hoặc mật khẩu không đúng');

        foreach ($this->settings->get()['admins'] as $a) {
            if (mb_strtolower($a['email']) === $email) {
                if (!password_verify($password, (string) ($a['passwordHash'] ?? ''))) throw $fail;
                return $this->open('admin-' . $a['id'], $a['email'], $a['name'], 'admin');
            }
        }
        $u = $this->users->findByEmail($email);
        if ($u === null || !password_verify($password, (string) ($u['passwordHash'] ?? ''))) {
            throw $fail;
        }
        if ($u['status'] === 'locked') {
            throw new HttpException(403, 'Tài khoản đã bị tạm khoá. Vui lòng liên hệ quản trị viên.');
        }
        $u['lastActiveAt'] = AuditService::nowMs();
        $this->users->update($u);
        return $this->open($u['id'], $u['email'], $u['name'], 'user');
    }

    /** @return array{email:string,name:string,role:string} */
    public function register(string $name, string $email, string $password): array
    {
        $name = trim($name);
        $email = mb_strtolower(trim($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new HttpException(422, 'Email không hợp lệ');
        if (mb_strlen($password) < 6) throw new HttpException(422, 'Mật khẩu cần ít nhất 6 ký tự');
        if ($name === '') $name = explode('@', $email)[0];
        $isAdmin = array_filter($this->settings->get()['admins'], static fn (array $a): bool => mb_strtolower($a['email']) === $email);
        if ($isAdmin || $this->users->findByEmail($email)) throw new HttpException(409, 'Email này đã được đăng ký');

        $rows = $this->users->all();
        $id = $this->users->nextId();
        array_unshift($rows, [
            'id' => $id, 'name' => mb_substr($name, 0, 80), 'email' => $email, 'joinedAt' => AuditService::nowMs(), 'favorites' => 0,
            'hasHealthProfile' => false, 'role' => 'member', 'status' => 'active',
            'passwordHash' => password_hash($password, PASSWORD_DEFAULT), 'lastActiveAt' => AuditService::nowMs(),
        ]);
        $this->users->replaceAll($rows);
        (new AuditService())->log('user', 'người dùng mới đăng ký: ' . $email, 'Hệ thống');
        return $this->open($id, $email, $name, 'user');
    }

    /**
     * Đăng nhập bằng Google (email đã được Google xác minh). Thứ tự tìm: tài khoản đã liên kết googleId → tài khoản cùng email
     * (liên kết luôn) → tạo tài khoản mới (mật khẩu ngẫu nhiên không ai biết; muốn dùng mật khẩu thì sau này "đặt lại mật khẩu").
     * Email trùng tài khoản QUẢN TRỊ thì từ chối: admin chỉ đăng nhập bằng mật khẩu.
     * @return array{email:string,name:string,role:string}
     */
    public function loginWithGoogle(string $googleId, string $email, string $name): array
    {
        $email = mb_strtolower(trim($email));
        if ($googleId === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) throw new HttpException(422, 'Google không trả về email hợp lệ');
        foreach ($this->settings->get()['admins'] as $a) {
            if (mb_strtolower($a['email']) === $email) {
                throw new HttpException(403, 'Tài khoản quản trị vui lòng đăng nhập bằng email và mật khẩu.');
            }
        }
        $u = $this->users->findByGoogleId($googleId) ?? $this->users->findByEmail($email);
        if ($u !== null) {
            if ($u['status'] === 'locked') throw new HttpException(403, 'Tài khoản đã bị tạm khoá. Vui lòng liên hệ quản trị viên.');
            if (($u['googleId'] ?? null) === null) {
                (new AuditService())->log('user', 'liên kết Google cho tài khoản ' . $u['email'], 'Hệ thống');
            }
            $u['googleId'] = $googleId;
            $u['lastActiveAt'] = AuditService::nowMs();
            $this->users->update($u);
            return $this->open($u['id'], $u['email'], $u['name'], 'user');
        }

        $name = trim($name) !== '' ? trim($name) : explode('@', $email)[0];
        $rows = $this->users->all();
        $id = $this->users->nextId();
        array_unshift($rows, [
            'id' => $id, 'name' => mb_substr($name, 0, 80), 'email' => $email, 'joinedAt' => AuditService::nowMs(), 'favorites' => 0,
            'hasHealthProfile' => false, 'role' => 'member', 'status' => 'active',
            'passwordHash' => password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT), 'googleId' => $googleId,
            'lastActiveAt' => AuditService::nowMs(),
        ]);
        $this->users->replaceAll($rows);
        (new AuditService())->log('user', 'người dùng mới đăng ký bằng Google: ' . $email, 'Hệ thống');
        return $this->open($id, $email, mb_substr($name, 0, 80), 'user');
    }

    /** @return array{email:string,name:string,role:string} */
    public function me(): array
    {
        $u = Session::user();
        if ($u === null) throw new HttpException(401, 'Bạn chưa đăng nhập');
        return ['email' => $u['email'], 'name' => $u['name'], 'role' => $u['role']];
    }

    public function logout(): void
    {
        Session::logout();
    }

    /** @return array{email:string,name:string,role:string} */
    private function open(int|string $id, string $email, string $name, string $role): array
    {
        Session::login(['id' => $id, 'email' => $email, 'name' => $name, 'role' => $role]);
        if ($role === 'admin') {
            (new AuditService())->log('login', 'đã đăng nhập vào bảng quản trị', $name);
        }
        return ['email' => $email, 'name' => $name, 'role' => $role];
    }
}
