<?php
session_start();

// Auth check
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// ── Data directory setup ──────────────────────────────────────────────────────
define('DATA_DIR', __DIR__ . '/data/');
define('UPLOAD_DIR', __DIR__ . '/uploads/');

if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

$dataFiles = [
    'questions'     => DATA_DIR . 'questions.json',
    'registrations' => DATA_DIR . 'registrations.json',
    'results'       => DATA_DIR . 'results.json',
    'exams'         => DATA_DIR . 'exams.json',
    'settings'      => DATA_DIR . 'settings.json',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function readJson(string $file, array $default = []): array {
    if (!file_exists($file)) return $default;
    $content = file_get_contents($file);
    if (!$content) return $default;
    $data = json_decode($content, true);
    return is_array($data) ? $data : $default;
}

function writeJson(string $file, array $data): bool {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

function ok(array $data = []): void {
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

function err(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

function generateId(array $items, string $prefix): string {
    $nums = array_map(function($i) use ($prefix) {
        if (isset($i['id']) && strpos($i['id'], $prefix) === 0) {
            return (int) substr($i['id'], strlen($prefix));
        }
        return 0;
    }, $items);
    $next = max($nums ?: [0]) + 1;
    return $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);
}

// ── Initialize sample data if fresh install ───────────────────────────────────
function initSampleData(array $dataFiles): void {
    // Exams
    if (!file_exists($dataFiles['exams'])) {
        $exams = [
            ['id' => 'EXAM-001', 'name' => 'Mathematics Test 2025', 'date' => '2025-06-15',
             'time' => '10:00', 'duration' => 60, 'num_questions' => 30, 'created_at' => date('Y-m-d H:i:s')],
            ['id' => 'EXAM-002', 'name' => 'Science Scholarship Exam', 'date' => '2025-06-20',
             'time' => '09:00', 'duration' => 90, 'num_questions' => 45, 'created_at' => date('Y-m-d H:i:s')],
            ['id' => 'EXAM-003', 'name' => 'General Knowledge Quiz', 'date' => '2025-07-01',
             'time' => '11:00', 'duration' => 45, 'num_questions' => 25, 'created_at' => date('Y-m-d H:i:s')],
        ];
        writeJson($dataFiles['exams'], $exams);
    }

    // Questions
    if (!file_exists($dataFiles['questions'])) {
        $questions = [
            ['id' => 'Q001', 'type' => 'text',
             'question_en' => 'What is the value of π (pi) to two decimal places?',
             'question_ta' => 'π (பை) இன் மதிப்பு இரண்டு தசமங்களில் என்ன?',
             'option_a_en' => '3.14', 'option_b_en' => '3.41', 'option_c_en' => '3.12', 'option_d_en' => '3.16',
             'option_a_ta' => '3.14', 'option_b_ta' => '3.41', 'option_c_ta' => '3.12', 'option_d_ta' => '3.16',
             'correct_answer' => 'A', 'exam_id' => 'EXAM-001', 'image_path' => '',
             'created_at' => date('Y-m-d H:i:s')],
            ['id' => 'Q002', 'type' => 'text',
             'question_en' => 'What is the chemical symbol for Gold?',
             'question_ta' => 'தங்கத்தின் வேதியியல் சின்னம் என்ன?',
             'option_a_en' => 'Go', 'option_b_en' => 'Gd', 'option_c_en' => 'Au', 'option_d_en' => 'Ag',
             'option_a_ta' => 'Go', 'option_b_ta' => 'Gd', 'option_c_ta' => 'Au', 'option_d_ta' => 'Ag',
             'correct_answer' => 'C', 'exam_id' => 'EXAM-002', 'image_path' => '',
             'created_at' => date('Y-m-d H:i:s')],
            ['id' => 'Q003', 'type' => 'text',
             'question_en' => 'Who is known as the Father of the Nation of India?',
             'question_ta' => 'இந்தியாவின் தேசப்பிதா என்று யார் அழைக்கப்படுகிறார்?',
             'option_a_en' => 'Nehru', 'option_b_en' => 'Gandhi', 'option_c_en' => 'Bose', 'option_d_en' => 'Patel',
             'option_a_ta' => 'நேரு', 'option_b_ta' => 'காந்தி', 'option_c_ta' => 'போஸ்', 'option_d_ta' => 'படேல்',
             'correct_answer' => 'B', 'exam_id' => 'EXAM-003', 'image_path' => '',
             'created_at' => date('Y-m-d H:i:s')],
        ];
        writeJson($dataFiles['questions'], $questions);
    }

    // Registrations
    if (!file_exists($dataFiles['registrations'])) {
        $regs = [
            ['id' => 'REG-001', 'student_name' => 'Arun Kumar', 'school' => 'St. Joseph Higher Secondary',
             'group_studied' => 'Maths-Biology', 'contact' => '9876543210', 'whatsapp' => '9876543210',
             'exam_id' => 'EXAM-001', 'exam_name' => 'Mathematics Test 2025',
             'user_id' => 'STU001001', 'password' => 'Kx92#mPq',
             'registered_at' => date('Y-m-d H:i:s', strtotime('-2 days'))],
            ['id' => 'REG-002', 'student_name' => 'Priya Lakshmi', 'school' => 'Sacred Heart Matriculation',
             'group_studied' => 'Commerce', 'contact' => '9123456780', 'whatsapp' => '9123456780',
             'exam_id' => 'EXAM-002', 'exam_name' => 'Science Scholarship Exam',
             'user_id' => 'STU002001', 'password' => 'Zt45@nWs',
             'registered_at' => date('Y-m-d H:i:s', strtotime('-1 day'))],
        ];
        writeJson($dataFiles['registrations'], $regs);
    }

    // Results
    if (!file_exists($dataFiles['results'])) {
        $results = [
            ['id' => 'RES-001', 'student_name' => 'Arun Kumar', 'user_id' => 'STU001001',
             'exam_id' => 'EXAM-001', 'exam_name' => 'Mathematics Test 2025',
             'score' => 24, 'total' => 30, 'percentage' => 80.0,
             'submitted_at' => date('Y-m-d H:i:s', strtotime('-1 day'))],
        ];
        writeJson($dataFiles['results'], $results);
    }

    // Settings
    if (!file_exists($dataFiles['settings'])) {
        $settings = [
            'fast2sms_api_key' => '',
            'sms_sent' => 0,
            'sms_failed' => 0,
            'sms_cost_per' => 0.18,
        ];
        writeJson($dataFiles['settings'], $settings);
    }
}

initSampleData($dataFiles);

// ── Route action ──────────────────────────────────────────────────────────────
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    // ── QUESTIONS ────────────────────────────────────────────────────────────
    case 'get_questions':
        $questions = readJson($dataFiles['questions']);
        $exams = readJson($dataFiles['exams']);
        $examMap = [];
        foreach ($exams as $e) $examMap[$e['id']] = $e['name'];
        foreach ($questions as &$q) {
            $q['exam_name'] = $examMap[$q['exam_id']] ?? $q['exam_id'];
        }
        ok(['questions' => $questions]);

    case 'add_question':
        $questions = readJson($dataFiles['questions']);
        $id = generateId($questions, 'Q');
        $imagePath = '';

        if (!empty($_FILES['image']['tmp_name'])) {
            $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg','jpeg','png','gif','webp'];
            if (in_array($ext, $allowed)) {
                $filename = $id . '_' . time() . '.' . $ext;
                move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . $filename);
                $imagePath = 'uploads/' . $filename;
            }
        }

        $q = [
            'id'           => $id,
            'type'         => $_POST['type'] ?? 'text',
            'question_en'  => $_POST['question_en'] ?? '',
            'question_ta'  => $_POST['question_ta'] ?? '',
            'option_a_en'  => $_POST['option_a_en'] ?? '',
            'option_b_en'  => $_POST['option_b_en'] ?? '',
            'option_c_en'  => $_POST['option_c_en'] ?? '',
            'option_d_en'  => $_POST['option_d_en'] ?? '',
            'option_a_ta'  => $_POST['option_a_ta'] ?? '',
            'option_b_ta'  => $_POST['option_b_ta'] ?? '',
            'option_c_ta'  => $_POST['option_c_ta'] ?? '',
            'option_d_ta'  => $_POST['option_d_ta'] ?? '',
            'correct_answer' => strtoupper($_POST['correct_answer'] ?? 'A'),
            'exam_id'      => $_POST['exam_id'] ?? '',
            'image_path'   => $imagePath,
            'created_at'   => date('Y-m-d H:i:s'),
        ];
        $questions[] = $q;
        writeJson($dataFiles['questions'], $questions);
        ok(['question' => $q]);

    case 'edit_question':
        $questions = readJson($dataFiles['questions']);
        $id = $_POST['id'] ?? '';
        $found = false;
        foreach ($questions as &$q) {
            if ($q['id'] === $id) {
                $found = true;
                $imagePath = $q['image_path'];
                if (!empty($_FILES['image']['tmp_name'])) {
                    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                    $allowed = ['jpg','jpeg','png','gif','webp'];
                    if (in_array($ext, $allowed)) {
                        $filename = $id . '_' . time() . '.' . $ext;
                        move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . $filename);
                        $imagePath = 'uploads/' . $filename;
                    }
                }
                $q = array_merge($q, [
                    'type'          => $_POST['type'] ?? $q['type'],
                    'question_en'   => $_POST['question_en'] ?? $q['question_en'],
                    'question_ta'   => $_POST['question_ta'] ?? $q['question_ta'],
                    'option_a_en'   => $_POST['option_a_en'] ?? $q['option_a_en'],
                    'option_b_en'   => $_POST['option_b_en'] ?? $q['option_b_en'],
                    'option_c_en'   => $_POST['option_c_en'] ?? $q['option_c_en'],
                    'option_d_en'   => $_POST['option_d_en'] ?? $q['option_d_en'],
                    'option_a_ta'   => $_POST['option_a_ta'] ?? $q['option_a_ta'],
                    'option_b_ta'   => $_POST['option_b_ta'] ?? $q['option_b_ta'],
                    'option_c_ta'   => $_POST['option_c_ta'] ?? $q['option_c_ta'],
                    'option_d_ta'   => $_POST['option_d_ta'] ?? $q['option_d_ta'],
                    'correct_answer'=> strtoupper($_POST['correct_answer'] ?? $q['correct_answer']),
                    'exam_id'       => $_POST['exam_id'] ?? $q['exam_id'],
                    'image_path'    => $imagePath,
                ]);
                break;
            }
        }
        if (!$found) err('Question not found');
        writeJson($dataFiles['questions'], $questions);
        ok();

    case 'delete_question':
        $questions = readJson($dataFiles['questions']);
        $id = $_POST['id'] ?? '';
        $questions = array_values(array_filter($questions, fn($q) => $q['id'] !== $id));
        writeJson($dataFiles['questions'], $questions);
        ok();

    case 'export_questions':
        // Return CSV as download
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="questions_' . date('Ymd') . '.csv"');
        // UTF-8 BOM for Excel Tamil support
        echo "\xEF\xBB\xBF";
        $questions = readJson($dataFiles['questions']);
        $cols = ['id','type','question_en','question_ta','option_a_en','option_b_en','option_c_en','option_d_en',
                 'option_a_ta','option_b_ta','option_c_ta','option_d_ta','correct_answer','exam_id'];
        echo implode(',', $cols) . "\n";
        foreach ($questions as $q) {
            $row = [];
            foreach ($cols as $col) {
                $val = str_replace('"','""', $q[$col] ?? '');
                $row[] = '"' . $val . '"';
            }
            echo implode(',', $row) . "\n";
        }
        exit;

    case 'download_template':
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="questions_template.csv"');
        echo "\xEF\xBB\xBF";
        $cols = ['type','question_en','question_ta','option_a_en','option_b_en','option_c_en','option_d_en',
                 'option_a_ta','option_b_ta','option_c_ta','option_d_ta','correct_answer','exam_id'];
        echo implode(',', $cols) . "\n";
        echo '"text","Sample question in English","ஆங்கிலத்தில் மாதிரி கேள்வி","Option A","Option B","Option C","Option D","விருப்பம் A","விருப்பம் B","விருப்பம் C","விருப்பம் D","A","EXAM-001"' . "\n";
        exit;

    case 'import_questions':
        if (empty($_FILES['csv']['tmp_name'])) err('No file uploaded');
        $content = file_get_contents($_FILES['csv']['tmp_name']);
        // Strip UTF-8 BOM if present
        $content = ltrim($content, "\xEF\xBB\xBF");
        $lines = explode("\n", trim($content));
        if (count($lines) < 2) err('CSV file is empty or has only header');

        $questions = readJson($dataFiles['questions']);
        $header = str_getcsv(array_shift($lines));
        $imported = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if (!$line) continue;
            $row = str_getcsv($line);
            if (count($row) < 12) continue;
            $mapped = [];
            foreach ($header as $i => $col) {
                $mapped[trim($col)] = $row[$i] ?? '';
            }
            $id = generateId($questions, 'Q');
            $questions[] = [
                'id'            => $id,
                'type'          => $mapped['type'] ?? 'text',
                'question_en'   => $mapped['question_en'] ?? '',
                'question_ta'   => $mapped['question_ta'] ?? '',
                'option_a_en'   => $mapped['option_a_en'] ?? '',
                'option_b_en'   => $mapped['option_b_en'] ?? '',
                'option_c_en'   => $mapped['option_c_en'] ?? '',
                'option_d_en'   => $mapped['option_d_en'] ?? '',
                'option_a_ta'   => $mapped['option_a_ta'] ?? '',
                'option_b_ta'   => $mapped['option_b_ta'] ?? '',
                'option_c_ta'   => $mapped['option_c_ta'] ?? '',
                'option_d_ta'   => $mapped['option_d_ta'] ?? '',
                'correct_answer'=> strtoupper($mapped['correct_answer'] ?? 'A'),
                'exam_id'       => $mapped['exam_id'] ?? '',
                'image_path'    => '',
                'created_at'    => date('Y-m-d H:i:s'),
            ];
            $imported++;
        }
        writeJson($dataFiles['questions'], $questions);
        ok(['imported' => $imported]);

    // ── REGISTRATIONS ────────────────────────────────────────────────────────
    case 'get_registrations':
        ok(['registrations' => readJson($dataFiles['registrations'])]);

    case 'add_registration':
        $regs = readJson($dataFiles['registrations']);
        $exams = readJson($dataFiles['exams']);
        $examId = $_POST['exam_id'] ?? '';
        $examName = '';
        foreach ($exams as $e) { if ($e['id'] === $examId) { $examName = $e['name']; break; } }

        $id = generateId($regs, 'REG-');
        $userNum = str_pad(count($regs) + 1, 3, '0', STR_PAD_LEFT);
        $userId = 'STU' . str_pad(rand(1,999), 3, '0', STR_PAD_LEFT) . $userNum;
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
        $pass = '';
        for ($i = 0; $i < 8; $i++) $pass .= $chars[random_int(0, strlen($chars)-1)];

        $reg = [
            'id'            => $id,
            'student_name'  => $_POST['student_name'] ?? '',
            'school'        => $_POST['school'] ?? '',
            'group_studied' => $_POST['group_studied'] ?? '',
            'contact'       => $_POST['contact'] ?? '',
            'whatsapp'      => $_POST['whatsapp'] ?? '',
            'exam_id'       => $examId,
            'exam_name'     => $examName,
            'user_id'       => $userId,
            'password'      => $pass,
            'registered_at' => date('Y-m-d H:i:s'),
        ];
        $regs[] = $reg;
        writeJson($dataFiles['registrations'], $regs);
        ok(['registration' => $reg]);

    case 'delete_registration':
        $regs = readJson($dataFiles['registrations']);
        $id = $_POST['id'] ?? '';
        $regs = array_values(array_filter($regs, fn($r) => $r['id'] !== $id));
        writeJson($dataFiles['registrations'], $regs);
        ok();

    // ── RESULTS ──────────────────────────────────────────────────────────────
    case 'get_results':
        ok(['results' => readJson($dataFiles['results'])]);

    case 'add_result':
        $results = readJson($dataFiles['results']);
        $id = generateId($results, 'RES-');
        $score = (int)($_POST['score'] ?? 0);
        $total = (int)($_POST['total'] ?? 1);
        $result = [
            'id'           => $id,
            'student_name' => $_POST['student_name'] ?? '',
            'user_id'      => $_POST['user_id'] ?? '',
            'exam_id'      => $_POST['exam_id'] ?? '',
            'exam_name'    => $_POST['exam_name'] ?? '',
            'score'        => $score,
            'total'        => $total,
            'percentage'   => $total > 0 ? round(($score / $total) * 100, 1) : 0,
            'submitted_at' => date('Y-m-d H:i:s'),
        ];
        $results[] = $result;
        writeJson($dataFiles['results'], $results);
        ok(['result' => $result]);

    case 'delete_result':
        $results = readJson($dataFiles['results']);
        $id = $_POST['id'] ?? '';
        $results = array_values(array_filter($results, fn($r) => $r['id'] !== $id));
        writeJson($dataFiles['results'], $results);
        ok();

    // ── EXAMS ────────────────────────────────────────────────────────────────
    case 'get_exams':
        ok(['exams' => readJson($dataFiles['exams'])]);

    case 'add_exam':
        $exams = readJson($dataFiles['exams']);
        $id = generateId($exams, 'EXAM-');
        $exam = [
            'id'            => $id,
            'name'          => $_POST['name'] ?? '',
            'date'          => $_POST['date'] ?? '',
            'time'          => $_POST['time'] ?? '',
            'duration'      => (int)($_POST['duration'] ?? 60),
            'num_questions' => (int)($_POST['num_questions'] ?? 0),
            'created_at'    => date('Y-m-d H:i:s'),
        ];
        $exams[] = $exam;
        writeJson($dataFiles['exams'], $exams);
        ok(['exam' => $exam]);

    case 'delete_exam':
        $exams = readJson($dataFiles['exams']);
        $id = $_POST['id'] ?? '';
        $exams = array_values(array_filter($exams, fn($e) => $e['id'] !== $id));
        writeJson($dataFiles['exams'], $exams);
        ok();

    // ── SETTINGS ─────────────────────────────────────────────────────────────
    case 'get_settings':
        ok(['settings' => readJson($dataFiles['settings'])]);

    case 'save_settings':
        $settings = readJson($dataFiles['settings']);
        if (isset($_POST['fast2sms_api_key'])) {
            $settings['fast2sms_api_key'] = trim($_POST['fast2sms_api_key']);
        }
        writeJson($dataFiles['settings'], $settings);
        ok(['settings' => $settings]);

    case 'test_sms':
        $settings = readJson($dataFiles['settings']);
        $apiKey = $settings['fast2sms_api_key'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $message = $_POST['message'] ?? 'Test SMS from MKJC Exam Portal';

        if (!$apiKey) err('Fast2SMS API key not configured');
        if (!preg_match('/^[6-9]\d{9}$/', $phone)) err('Invalid phone number');

        $url = 'https://www.fast2sms.com/dev/bulkV2';
        $data = http_build_query([
            'authorization' => $apiKey,
            'message'       => $message,
            'language'      => 'english',
            'route'         => 'q',
            'numbers'       => $phone,
        ]);

        $context = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/x-www-form-urlencoded\r\ncache-control: no-cache\r\n",
                'content' => $data,
                'timeout' => 15,
            ]
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            $settings['sms_failed'] = ($settings['sms_failed'] ?? 0) + 1;
            writeJson($dataFiles['settings'], $settings);
            err('Failed to reach Fast2SMS API. Check your internet connection or API key.');
        }

        $json = json_decode($response, true);
        if (isset($json['return']) && $json['return'] === true) {
            $settings['sms_sent'] = ($settings['sms_sent'] ?? 0) + 1;
            writeJson($dataFiles['settings'], $settings);
            ok(['message' => 'Test SMS sent successfully!']);
        } else {
            $settings['sms_failed'] = ($settings['sms_failed'] ?? 0) + 1;
            writeJson($dataFiles['settings'], $settings);
            $errMsg = $json['message'] ?? 'Unknown error from Fast2SMS';
            err($errMsg);
        }

    default:
        err('Unknown action: ' . htmlspecialchars($action));
}
