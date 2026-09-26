<?php
declare(strict_types=1);

namespace App\Support;

/** Xử lý chuỗi tiếng Việt: bỏ dấu để tìm kiếm/sắp xếp, tạo slug. */
final class Str
{
    private const FROM = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
    private const TO   = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';

    public static function norm(mixed $s): string
    {
        $s = mb_strtolower((string) $s);
        return strtr($s, array_combine(mb_str_split(self::FROM), mb_str_split(self::TO)));
    }

    public static function slug(string $s): string
    {
        return trim((string) preg_replace('/[^a-z0-9]+/', '-', self::norm($s)), '-');
    }

    public static function contains(string $haystack, string $needle): bool
    {
        return $needle === '' || str_contains(self::norm($haystack), $needle);
    }
}
