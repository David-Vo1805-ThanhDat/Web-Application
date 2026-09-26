<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;
use App\Repositories\FeedbackRepository;

/** Nhận góp ý từ form "Liên hệ & Góp ý" của web người dùng (không cần đăng nhập). */
final class FeedbackService
{
    public const SUBJECTS = ['gop-y' => 'Góp ý chung', 'de-xuat-mon' => 'Đề xuất món mới', 'bao-loi' => 'Báo lỗi', 'hop-tac' => 'Hợp tác'];
    private const MAX_PER_HOUR = 5;   // mỗi địa chỉ IP

    private FeedbackRepository $repo;

    public function __construct()
    {
        $this->repo = new FeedbackRepository();
    }

    /** @param array<string,mixed> $p name, email, subject, message */
    public function create(array $p): array
    {
        $name = trim((string) ($p['name'] ?? ''));
        $email = mb_strtolower(trim((string) ($p['email'] ?? '')));
        $subject = (string) ($p['subject'] ?? '');
        $message = trim((string) ($p['message'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new HttpException(422, 'Vui lòng nhập email liên hệ hợp lệ');
        if (!isset(self::SUBJECTS[$subject])) throw new HttpException(422, 'Chủ đề không hợp lệ');
        if (mb_strlen($message) < 5) throw new HttpException(422, 'Nội dung cần ít nhất 5 ký tự');

        $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
        $since = AuditService::nowMs() - 3600000;
        $recent = count(array_filter($this->repo->all(), static fn ($f) => ($f['ip'] ?? null) === $ip && $ip !== '' && $f['createdAt'] >= $since));
        if ($recent >= self::MAX_PER_HOUR) throw new HttpException(429, 'Bạn gửi hơi nhiều, vui lòng thử lại sau ít phút');

        $rows = $this->repo->all();
        $row = ['id' => $this->repo->nextId(), 'name' => mb_substr($name !== '' ? $name : 'Ẩn danh', 0, 80), 'email' => $email, 'subject' => $subject,
            'subjectLabel' => self::SUBJECTS[$subject], 'message' => mb_substr($message, 0, 2000), 'createdAt' => AuditService::nowMs(),
            'status' => 'new', 'reply' => '', 'ip' => $ip];
        $rows[] = $row;
        $this->repo->replaceAll($rows);
        (new AuditService())->log('reply', 'góp ý mới #' . $row['id'] . ' từ ' . $email, 'Hệ thống');
        return ['id' => $row['id']];
    }
}
