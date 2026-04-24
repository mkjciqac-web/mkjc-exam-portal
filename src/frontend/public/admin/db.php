<?php
/**
 * db.php — MKJC Scholarship Exam Portal MySQL Backend
 *
 * Drop-in PDO class. No Composer required. Works on any PHP 7.4+ host.
 * Tables are created automatically on first run.
 *
 * Usage:
 *   require_once __DIR__ . '/db.php';
 *   $db = new MKJCDB();
 *
 * Environment variable overrides (set in .htaccess or host control panel):
 *   DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT
 */

// ---------------------------------------------------------------------------
// DEFAULTS (override via env vars or constructor args)
// ---------------------------------------------------------------------------

define('MKJC_DB_HOST',    getenv('DB_HOST') ?: 'localhost');
define('MKJC_DB_NAME',    getenv('DB_NAME') ?: 'mkjc_exam');
define('MKJC_DB_USER',    getenv('DB_USER') ?: 'root');
define('MKJC_DB_PASS',    getenv('DB_PASS') ?: '');
define('MKJC_DB_PORT',    getenv('DB_PORT') ?: '3306');
define('MKJC_DB_CHARSET', 'utf8mb4');

// ---------------------------------------------------------------------------
// MAIN CLASS
// ---------------------------------------------------------------------------

class MKJCDB
{
    private PDO $pdo;

    // -----------------------------------------------------------------------
    // CONSTRUCTOR
    // -----------------------------------------------------------------------

    public function __construct(
        string $host     = MKJC_DB_HOST,
        string $dbname   = MKJC_DB_NAME,
        string $user     = MKJC_DB_USER,
        string $password = MKJC_DB_PASS,
        string $port     = MKJC_DB_PORT
    ) {
        // Env vars take precedence over constructor args when defined
        $host     = getenv('DB_HOST') ?: $host;
        $dbname   = getenv('DB_NAME') ?: $dbname;
        $user     = getenv('DB_USER') ?: $user;
        $password = getenv('DB_PASS') ?: $password;
        $port     = getenv('DB_PORT') ?: $port;

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $password, $options);
        } catch (PDOException $e) {
            // Return JSON error and die gracefully
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
            exit;
        }

        $this->createTables();
    }

    public function getPDO(): PDO { return $this->pdo; }

    // -----------------------------------------------------------------------
    // SEQUENTIAL ID GENERATOR
    // -----------------------------------------------------------------------

    private function nextSequentialId(string $table, string $column, string $prefix, int $pad = 3): string
    {
        $stmt = $this->pdo->prepare("SELECT {$column} FROM {$table} WHERE {$column} LIKE ? ORDER BY {$column} DESC LIMIT 1");
        $stmt->execute([$prefix . '%']);
        $last = $stmt->fetchColumn();

        $next = 1;
        if ($last !== false) {
            $numeric = (int) ltrim(substr($last, strlen($prefix)), '0');
            $next    = $numeric + 1;
        }

        return $prefix . str_pad((string) $next, $pad, '0', STR_PAD_LEFT);
    }

    // -----------------------------------------------------------------------
    // TABLE CREATION
    // -----------------------------------------------------------------------

    public function createTables(): void
    {
        // custom_exams
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS custom_exams (
                id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
                exam_id       VARCHAR(20)     NOT NULL,
                exam_name     VARCHAR(255)    NOT NULL,
                exam_date     DATE            NULL,
                exam_time     TIME            NULL,
                duration      INT             NOT NULL DEFAULT 60   COMMENT 'minutes',
                num_questions INT             NOT NULL DEFAULT 10,
                created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_exam_id (exam_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // questions
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS questions (
                id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
                exam_id        VARCHAR(20)     NOT NULL DEFAULT 'Test1',
                question_en    TEXT            NOT NULL,
                question_ta    TEXT            NULL,
                option_a_en    VARCHAR(500)    NOT NULL DEFAULT '',
                option_b_en    VARCHAR(500)    NOT NULL DEFAULT '',
                option_c_en    VARCHAR(500)    NOT NULL DEFAULT '',
                option_d_en    VARCHAR(500)    NOT NULL DEFAULT '',
                option_a_ta    VARCHAR(500)    NULL,
                option_b_ta    VARCHAR(500)    NULL,
                option_c_ta    VARCHAR(500)    NULL,
                option_d_ta    VARCHAR(500)    NULL,
                correct_answer CHAR(1)         NOT NULL DEFAULT 'A',
                type           ENUM('text','image') NOT NULL DEFAULT 'text',
                image_url      VARCHAR(500)    NULL,
                question_order INT UNSIGNED    NOT NULL DEFAULT 0,
                created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // registrations (with user_id / password_hash / plain_password)
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS registrations (
                id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
                student_name   VARCHAR(255)    NOT NULL,
                school_name    VARCHAR(255)    NOT NULL DEFAULT '',
                group_studied  VARCHAR(100)    NULL,
                contact        VARCHAR(20)     NOT NULL DEFAULT '',
                whatsapp       VARCHAR(20)     NULL,
                exam_id        VARCHAR(20)     NOT NULL DEFAULT '',
                exam_name      VARCHAR(255)    NULL,
                user_id        VARCHAR(20)     NOT NULL,
                password_hash  VARCHAR(255)    NOT NULL,
                plain_password VARCHAR(20)     NOT NULL DEFAULT '',
                sms_sent       TINYINT(1)      NOT NULL DEFAULT 0,
                registered_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // quiz_responses (bulk insert per submission)
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS quiz_responses (
                id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
                registration_id  INT             NOT NULL DEFAULT 0,
                student_name     VARCHAR(255)    NULL,
                exam_id          VARCHAR(20)     NOT NULL,
                exam_name        VARCHAR(255)    NULL,
                answers          JSON            NULL,
                score            INT             NOT NULL DEFAULT 0,
                total_questions  INT             NOT NULL DEFAULT 0,
                submitted_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_reg_id  (registration_id),
                KEY idx_exam_id (exam_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // settings
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS settings (
                setting_key   VARCHAR(100) NOT NULL,
                setting_value TEXT         NULL,
                updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (setting_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Seed default settings (ignore duplicates)
        $this->pdo->exec("
            INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
                ('fast2sms_api_key', ''),
                ('sms_sent_count',   '0'),
                ('sms_failed_count', '0'),
                ('admin_username',   'admin'),
                ('admin_password',   'staff@318')
        ");
    }

    // -----------------------------------------------------------------------
    // EXAMS
    // -----------------------------------------------------------------------

    public function getExams(): array
    {
        return $this->pdo->query('SELECT * FROM custom_exams ORDER BY created_at DESC')->fetchAll();
    }

    public function getExamById(string $examId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM custom_exams WHERE exam_id = ? LIMIT 1');
        $stmt->execute([$examId]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    /** Creates a new exam; returns the generated exam_id string. */
    public function createExam(array $data): string
    {
        $examId = $this->nextSequentialId('custom_exams', 'exam_id', 'EXAM-', 3);

        $stmt = $this->pdo->prepare("
            INSERT INTO custom_exams (exam_id, exam_name, exam_date, exam_time, duration, num_questions)
            VALUES (:eid, :ename, :edate, :etime, :dur, :nq)
        ");
        $stmt->execute([
            ':eid'   => $examId,
            ':ename' => $data['exam_name'],
            ':edate' => $data['exam_date']     ?? null,
            ':etime' => $data['exam_time']     ?? null,
            ':dur'   => (int) ($data['duration']      ?? 60),
            ':nq'    => (int) ($data['num_questions'] ?? 10),
        ]);

        return $examId;
    }

    public function deleteExam(string $examId): bool
    {
        $this->pdo->prepare('DELETE FROM questions WHERE exam_id = ?')->execute([$examId]);
        $stmt = $this->pdo->prepare('DELETE FROM custom_exams WHERE exam_id = ?');
        $stmt->execute([$examId]);
        return $stmt->rowCount() > 0;
    }

    // -----------------------------------------------------------------------
    // QUESTIONS
    // -----------------------------------------------------------------------

    public function getQuestions(?string $examId = null): array
    {
        if ($examId !== null) {
            $stmt = $this->pdo->prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY question_order, id');
            $stmt->execute([$examId]);
        } else {
            $stmt = $this->pdo->query('SELECT * FROM questions ORDER BY exam_id, question_order, id');
        }
        return $stmt->fetchAll();
    }

    /**
     * Returns a randomised subset of questions for a live exam.
     * Respects num_questions from the exam config if available.
     */
    public function getActiveQuestions(string $examId): array
    {
        $exam = $this->getExamById($examId);
        $limit = $exam ? (int) $exam['num_questions'] : 10;
        if ($limit < 1) $limit = 10;

        $stmt = $this->pdo->prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY RAND() LIMIT ' . $limit);
        $stmt->execute([$examId]);
        return $stmt->fetchAll();
    }

    public function addQuestion(array $data): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO questions
                (exam_id, question_en, question_ta,
                 option_a_en, option_b_en, option_c_en, option_d_en,
                 option_a_ta, option_b_ta, option_c_ta, option_d_ta,
                 correct_answer, type, image_url, question_order)
            VALUES
                (:exam_id, :qen, :qta,
                 :aen, :ben, :cen, :den,
                 :ata, :bta, :cta, :dta,
                 :ca, :type, :img, :ord)
        ");
        $stmt->execute([
            ':exam_id' => $data['exam_id']      ?? 'Test1',
            ':qen'     => $data['question_en'],
            ':qta'     => $data['question_ta']  ?? null,
            ':aen'     => $data['option_a_en']  ?? '',
            ':ben'     => $data['option_b_en']  ?? '',
            ':cen'     => $data['option_c_en']  ?? '',
            ':den'     => $data['option_d_en']  ?? '',
            ':ata'     => $data['option_a_ta']  ?? null,
            ':bta'     => $data['option_b_ta']  ?? null,
            ':cta'     => $data['option_c_ta']  ?? null,
            ':dta'     => $data['option_d_ta']  ?? null,
            ':ca'      => strtoupper($data['correct_answer'] ?? 'A'),
            ':type'    => $data['type']         ?? 'text',
            ':img'     => $data['image_url']    ?? null,
            ':ord'     => (int) ($data['question_order'] ?? 0),
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateQuestion(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE questions SET
                exam_id        = :exam_id,
                question_en    = :qen,
                question_ta    = :qta,
                option_a_en    = :aen,
                option_b_en    = :ben,
                option_c_en    = :cen,
                option_d_en    = :den,
                option_a_ta    = :ata,
                option_b_ta    = :bta,
                option_c_ta    = :cta,
                option_d_ta    = :dta,
                correct_answer = :ca,
                type           = :type,
                image_url      = :img,
                question_order = :ord
            WHERE id = :id
        ");
        $stmt->execute([
            ':exam_id' => $data['exam_id']      ?? 'Test1',
            ':qen'     => $data['question_en'],
            ':qta'     => $data['question_ta']  ?? null,
            ':aen'     => $data['option_a_en']  ?? '',
            ':ben'     => $data['option_b_en']  ?? '',
            ':cen'     => $data['option_c_en']  ?? '',
            ':den'     => $data['option_d_en']  ?? '',
            ':ata'     => $data['option_a_ta']  ?? null,
            ':bta'     => $data['option_b_ta']  ?? null,
            ':cta'     => $data['option_c_ta']  ?? null,
            ':dta'     => $data['option_d_ta']  ?? null,
            ':ca'      => strtoupper($data['correct_answer'] ?? 'A'),
            ':type'    => $data['type']         ?? 'text',
            ':img'     => $data['image_url']    ?? null,
            ':ord'     => (int) ($data['question_order'] ?? 0),
            ':id'      => $id,
        ]);
        return $stmt->rowCount() > 0;
    }

    public function deleteQuestion(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM questions WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    // -----------------------------------------------------------------------
    // REGISTRATIONS
    // -----------------------------------------------------------------------

    /**
     * Filters: search (LIKE on student_name / school_name / contact), exam_id.
     */
    public function getRegistrations(array $filters = []): array
    {
        $where  = [];
        $params = [];

        if (!empty($filters['search'])) {
            $like = '%' . $filters['search'] . '%';
            $where[]  = '(student_name LIKE :s1 OR school_name LIKE :s2 OR contact LIKE :s3)';
            $params[':s1'] = $like;
            $params[':s2'] = $like;
            $params[':s3'] = $like;
        }
        if (!empty($filters['exam_id'])) {
            $where[]  = 'exam_id = :exam_id';
            $params[':exam_id'] = $filters['exam_id'];
        }

        $sql = 'SELECT * FROM registrations';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY registered_at DESC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Registers a new student.
     * Returns ['id' => int, 'user_id' => string, 'password' => string]
     */
    public function registerStudent(array $data): array
    {
        $userId = $this->nextSequentialId('registrations', 'user_id', 'STU', 6);

        // Exclude ambiguous chars: 0, O, I, 1, l
        $chars    = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        $password = '';
        for ($i = 0; $i < 8; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        // Resolve exam name
        $examName = $data['exam_name'] ?? '';
        if (empty($examName) && !empty($data['exam_id'])) {
            $exam = $this->getExamById($data['exam_id']);
            $examName = $exam ? $exam['exam_name'] : $data['exam_id'];
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO registrations
                (student_name, school_name, group_studied, contact, whatsapp,
                 exam_id, exam_name, user_id, password_hash, plain_password)
            VALUES
                (:sname, :school, :group, :contact, :whatsapp,
                 :exam_id, :exam_name, :user_id, :phash, :plain)
        ");
        $stmt->execute([
            ':sname'     => $data['student_name'],
            ':school'    => $data['school_name']  ?? '',
            ':group'     => $data['group_studied'] ?? null,
            ':contact'   => $data['contact']       ?? '',
            ':whatsapp'  => $data['whatsapp']      ?? null,
            ':exam_id'   => $data['exam_id']       ?? '',
            ':exam_name' => $examName,
            ':user_id'   => $userId,
            ':phash'     => $hash,
            ':plain'     => $password,
        ]);

        return [
            'id'       => (int) $this->pdo->lastInsertId(),
            'user_id'  => $userId,
            'password' => $password,
        ];
    }

    /**
     * Verifies student credentials. Returns registration row or null.
     */
    public function getStudentByCredentials(string $userId, string $password): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM registrations WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if ($row === false) return null;

        // Support both hashed passwords and legacy plain_password (migration safety)
        $valid = password_verify($password, $row['password_hash'])
              || $password === $row['plain_password'];

        return $valid ? $row : null;
    }

    // -----------------------------------------------------------------------
    // QUIZ RESPONSES
    // -----------------------------------------------------------------------

    /**
     * Saves a completed quiz submission.
     * $answers is an associative array: [question_id => 'A'|'B'|'C'|'D']
     * Returns the new quiz_responses.id
     */
    public function submitQuizResponse(int $registrationId, string $examId, array $answers, int $score, int $total): int
    {
        $reg = null;
        if ($registrationId > 0) {
            $stmt = $this->pdo->prepare('SELECT student_name, exam_name FROM registrations WHERE id = ? LIMIT 1');
            $stmt->execute([$registrationId]);
            $reg = $stmt->fetch();
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO quiz_responses
                (registration_id, student_name, exam_id, exam_name, answers, score, total_questions)
            VALUES
                (:rid, :sname, :eid, :ename, :answers, :score, :total)
        ");
        $stmt->execute([
            ':rid'     => $registrationId,
            ':sname'   => $reg['student_name'] ?? '',
            ':eid'     => $examId,
            ':ename'   => $reg['exam_name']    ?? '',
            ':answers' => json_encode($answers, JSON_UNESCAPED_UNICODE),
            ':score'   => $score,
            ':total'   => $total,
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Filters: search (LIKE on student_name / exam_name), exam_id.
     */
    public function getResults(array $filters = []): array
    {
        $where  = [];
        $params = [];

        if (!empty($filters['search'])) {
            $like = '%' . $filters['search'] . '%';
            $where[]  = '(student_name LIKE :s1 OR exam_name LIKE :s2)';
            $params[':s1'] = $like;
            $params[':s2'] = $like;
        }
        if (!empty($filters['exam_id'])) {
            $where[]  = 'exam_id = :exam_id';
            $params[':exam_id'] = $filters['exam_id'];
        }

        $sql = 'SELECT * FROM quiz_responses';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY submitted_at DESC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    // -----------------------------------------------------------------------
    // SETTINGS
    // -----------------------------------------------------------------------

    public function getSetting(string $key): string
    {
        $stmt = $this->pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1');
        $stmt->execute([$key]);
        $val = $stmt->fetchColumn();
        return $val !== false ? (string) $val : '';
    }

    public function setSetting(string $key, string $value): void
    {
        $this->pdo->prepare("
            INSERT INTO settings (setting_key, setting_value)
            VALUES (:k, :v)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ")->execute([':k' => $key, ':v' => $value]);
    }

    public function incrementSmsSent(bool $success = true): void
    {
        $key     = $success ? 'sms_sent_count' : 'sms_failed_count';
        $current = (int) $this->getSetting($key);
        $this->setSetting($key, (string) ($current + 1));
    }

    // -----------------------------------------------------------------------
    // SMS
    // -----------------------------------------------------------------------

    /**
     * Sends SMS via Fast2SMS bulkV2. Uses file_get_contents (no cURL needed).
     */
    public function sendSms(string $mobile, string $message): bool
    {
        $apiKey = $this->getSetting('fast2sms_api_key');
        if (empty($apiKey)) {
            $this->incrementSmsSent(false);
            return false;
        }

        $postData = http_build_query([
            'route'    => 'q',
            'message'  => $message,
            'language' => 'english',
            'flash'    => 0,
            'numbers'  => $mobile,
        ]);

        $context = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => "authorization: {$apiKey}\r\nContent-Type: application/x-www-form-urlencoded\r\nCache-Control: no-cache",
                'content'       => $postData,
                'timeout'       => 15,
                'ignore_errors' => true,
            ],
        ]);

        $success = false;
        try {
            $raw = @file_get_contents('https://www.fast2sms.com/dev/bulkV2', false, $context);
            if ($raw !== false) {
                $json    = json_decode($raw, true);
                $success = isset($json['return']) && $json['return'] === true;
            }
        } catch (\Throwable $e) {
            $success = false;
        }

        $this->incrementSmsSent($success);
        return $success;
    }

    // -----------------------------------------------------------------------
    // ADMIN AUTH
    // -----------------------------------------------------------------------

    /**
     * Compares credentials against admin_username / admin_password settings.
     * Falls back to hardcoded defaults if settings table is empty.
     */
    public function checkAdminLogin(string $username, string $password): bool
    {
        $storedUser = $this->getSetting('admin_username') ?: 'admin';
        $storedPass = $this->getSetting('admin_password') ?: 'staff@318';
        return hash_equals($storedUser, $username) && hash_equals($storedPass, $password);
    }

    // -----------------------------------------------------------------------
    // LEGACY COMPATIBILITY (used by existing admin pages)
    // -----------------------------------------------------------------------

    public function getExamOptions(): array
    {
        $stmt = $this->pdo->query('SELECT exam_id, exam_name FROM custom_exams ORDER BY created_at ASC');
        return $stmt->fetchAll();
    }

    public function exportQuestionsCSV(?string $examId = null): string
    {
        $rows    = $this->getQuestions($examId);
        $columns = ['exam_id','question_en','question_ta','option_a_en','option_b_en','option_c_en','option_d_en','option_a_ta','option_b_ta','option_c_ta','option_d_ta','correct_answer','type','image_url','question_order'];

        $output = "\xEF\xBB\xBF";
        $output .= implode(',', array_map(fn($c) => '"'.$c.'"', $columns)) . "\r\n";
        foreach ($rows as $row) {
            $cells = [];
            foreach ($columns as $col) {
                $cells[] = '"' . str_replace('"', '""', (string)($row[$col] ?? '')) . '"';
            }
            $output .= implode(',', $cells) . "\r\n";
        }
        return $output;
    }

    public function getSmsStats(): array
    {
        $sent   = (int) $this->getSetting('sms_sent_count');
        $failed = (int) $this->getSetting('sms_failed_count');
        return [
            'total'  => $sent + $failed,
            'sent'   => $sent,
            'failed' => $failed,
            'cost'   => round($sent * 0.18, 2),
        ];
    }

    public function getFast2SmsKey(): string { return $this->getSetting('fast2sms_api_key'); }
    public function setFast2SmsKey(string $k): void { $this->setSetting('fast2sms_api_key', $k); }
}

// ---------------------------------------------------------------------------
// STANDALONE HELPERS (used by admin pages)
// ---------------------------------------------------------------------------

function requireAdminLogin(string $loginPage = 'index.php'): void
{
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['admin_logged_in'])) {
        header('Location: ' . $loginPage);
        exit;
    }
}

function adminLogin(string $username, string $password): bool
{
    if (session_status() === PHP_SESSION_NONE) session_start();

    // Use DB check if possible; fall back to constants
    $valid = false;
    try {
        $db    = new MKJCDB();
        $valid = $db->checkAdminLogin($username, $password);
    } catch (\Throwable $e) {
        $valid = ($username === 'admin' && $password === 'staff@318');
    }

    if ($valid) {
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
    }
    return $valid;
}

function adminLogout(): void
{
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function jsonResponse(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
