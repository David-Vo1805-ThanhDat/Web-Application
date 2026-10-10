<?php
declare(strict_types=1);

// Only read chatbot settings; do not export .env values to unrelated services.
$local = [];
$envFile = dirname(__DIR__) . '/.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (!preg_match('/^\s*(?:export\s+)?(GEMINI_API_KEY|API_KEY|GEMINI_MODEL)\s*=\s*(.*)$/', $line, $match)) continue;
        $value = trim($match[2]);
        if (strlen($value) >= 2 && in_array($value[0], ['"', "'"], true) && substr($value, -1) === $value[0]) {
            $value = substr($value, 1, -1);
        } else {
            $value = trim(preg_replace('/\s+#.*$/', '', $value) ?? '');
        }
        $local[$match[1]] = $value;
    }
}

// Environment values take precedence, including an explicitly empty key.
$setting = static function (array $keys, string $default = '') use ($local): string {
    foreach ($keys as $key) {
        $value = getenv($key);
        if ($value !== false) return trim($value);
    }
    foreach ($keys as $key) {
        if (isset($local[$key])) return $local[$key];
    }
    return $default;
};

return [
    'api_key' => $setting(['GEMINI_API_KEY', 'API_KEY']),
    'model' => $setting(['GEMINI_MODEL'], 'gemini-3.5-flash-lite'),
    'prompt_file' => dirname(__DIR__) . '/prompts/foodbot.txt',
    'base_url' => 'https://generativelanguage.googleapis.com/v1beta',
    'timeout' => 45,
];
