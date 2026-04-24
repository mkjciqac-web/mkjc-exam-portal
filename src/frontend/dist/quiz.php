<?php
/**
 * quiz.php — MKJC Exam Portal: Student Login + Quiz + Results
 * Session-based state machine: login → quiz → results
 */

session_start();
require_once __DIR__ . '/admin/db.php';

$db             = new MKJCDB();
$loginError     = '';
$QUESTIONS_PER_PAGE = 5;

// ── Helper: current quiz state ───────────────────────────────────────────────
function quizState(): string {
    return $_SESSION['quiz_state'] ?? 'login';
}

// ── Action: LOGOUT ────────────────────────────────────────────────────────────
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header('Location: index.php');
    exit;
}

// ── Action: START OVER (clear quiz, keep registration) ───────────────────────
if (isset($_GET['action']) && $_GET['action'] === 'startover') {
    unset($_SESSION['quiz_state'], $_SESSION['quiz_questions'], $_SESSION['quiz_answers'],
          $_SESSION['quiz_current_page'], $_SESSION['quiz_score'], $_SESSION['quiz_total'],
          $_SESSION['quiz_start_time'], $_SESSION['quiz_student'], $_SESSION['quiz_exam']);
    header('Location: index.php');
    exit;
}

// ── Action: LOGIN ─────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
    $userId   = trim($_POST['user_id']  ?? '');
    $password = trim($_POST['password'] ?? '');

    $student = $db->getStudentByCredentials($userId, $password);

    if ($student) {
        $examId     = $student['exam_id'];
        $questions  = $db->getActiveQuestions($examId);

        if (empty($questions)) {
            $loginError = 'No questions are available for your exam yet. Please contact the administrator.';
        } else {
            $_SESSION['quiz_state']        = 'quiz';
            $_SESSION['quiz_student']      = $student;
            $_SESSION['quiz_exam']         = $db->getExamById($examId) ?? ['exam_name' => $examId, 'duration' => 60, 'num_questions' => count($questions)];
            $_SESSION['quiz_questions']    = $questions;
            $_SESSION['quiz_answers']      = [];
            $_SESSION['quiz_current_page'] = 0;
            $_SESSION['quiz_start_time']   = time();

            header('Location: quiz.php');
            exit;
        }
    } else {
        $loginError = 'Invalid User ID or password. Please check your credentials.';
    }
}

// ── Action: ANSWER (quiz navigation) ─────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'answer' && quizState() === 'quiz') {
    $questions   = $_SESSION['quiz_questions']    ?? [];
    $currentPage = (int) ($_SESSION['quiz_current_page'] ?? 0);
    $totalPages  = (int) ceil(count($questions) / $QUESTIONS_PER_PAGE);

    // Merge submitted answers for this page
    $pageAnswers = $_POST['answers'] ?? [];
    if (is_array($pageAnswers)) {
        foreach ($pageAnswers as $qId => $choice) {
            if (in_array(strtoupper($choice), ['A','B','C','D'], true)) {
                $_SESSION['quiz_answers'][(int)$qId] = strtoupper($choice);
            }
        }
    }

    // Navigation
    $nav = $_POST['nav'] ?? 'next';

    if ($nav === 'prev') {
        $_SESSION['quiz_current_page'] = max(0, $currentPage - 1);
        header('Location: quiz.php');
        exit;

    } elseif ($nav === 'jump') {
        $jumpPage = (int) ($_POST['jump_page'] ?? 0);
        $_SESSION['quiz_current_page'] = max(0, min($totalPages - 1, $jumpPage));
        header('Location: quiz.php');
        exit;

    } elseif ($nav === 'submit') {
        // Calculate score
        $score   = 0;
        $total   = count($questions);
        $answers = $_SESSION['quiz_answers'];

        foreach ($questions as $q) {
            $qId = (int) $q['id'];
            if (isset($answers[$qId]) && strtoupper($answers[$qId]) === strtoupper($q['correct_answer'])) {
                $score++;
            }
        }

        // Persist result
        $regId = (int) ($_SESSION['quiz_student']['id'] ?? 0);
        $db->submitQuizResponse($regId, $_SESSION['quiz_student']['exam_id'], $answers, $score, $total);

        $_SESSION['quiz_state'] = 'results';
        $_SESSION['quiz_score'] = $score;
        $_SESSION['quiz_total'] = $total;

        header('Location: quiz.php');
        exit;

    } else {
        // next
        $_SESSION['quiz_current_page'] = min($totalPages - 1, $currentPage + 1);
        header('Location: quiz.php');
        exit;
    }
}

// ── Prepare render variables ──────────────────────────────────────────────────
$state       = quizState();
$questions   = $_SESSION['quiz_questions']    ?? [];
$currentPage = (int) ($_SESSION['quiz_current_page'] ?? 0);
$answers     = $_SESSION['quiz_answers']      ?? [];
$totalPages  = $questions ? (int) ceil(count($questions) / $QUESTIONS_PER_PAGE) : 1;
$pageStart   = $currentPage * $QUESTIONS_PER_PAGE;
$pageQuestions = array_slice($questions, $pageStart, $QUESTIONS_PER_PAGE);
$student     = $_SESSION['quiz_student']      ?? [];
$exam        = $_SESSION['quiz_exam']         ?? [];
$examDuration = (int) ($exam['duration']      ?? 60);
$startTime   = (int) ($_SESSION['quiz_start_time'] ?? time());
$elapsed     = time() - $startTime;
$remaining   = max(0, ($examDuration * 60) - $elapsed);

$score = (int) ($_SESSION['quiz_score'] ?? 0);
$total = (int) ($_SESSION['quiz_total'] ?? 0);
$pct   = $total > 0 ? round(($score / $total) * 100) : 0;
$grade = $pct >= 90 ? 'Excellent 🏆' : ($pct >= 75 ? 'Good 👍' : ($pct >= 50 ? 'Pass ✅' : 'Needs Improvement 📚'));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MKJC Exam Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --navy:        #1a237e;
            --navy-dark:   #0d1757;
            --navy-light:  #283593;
            --gold:        #ffd700;
            --gold-light:  #ffeb3b;
            --white:       #ffffff;
            --gray-50:     #f8f9fa;
            --gray-100:    #f1f3f4;
            --gray-200:    #e8eaed;
            --gray-300:    #dadce0;
            --gray-500:    #80868b;
            --gray-700:    #5f6368;
            --green:       #4caf50;
            --green-dark:  #2e7d32;
            --red:         #d32f2f;
        }

        body {
            font-family: 'Inter', 'Noto Sans Tamil', sans-serif;
            background: var(--gray-100);
            min-height: 100vh;
        }

        /* ═══════════════════════════════════════════════════
           LOGIN PAGE
        ═══════════════════════════════════════════════════ */
        .login-wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 55%, var(--navy-light) 100%);
            padding: 1.5rem;
        }

        .login-card {
            background: var(--white);
            border-radius: 16px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.35);
            width: 100%;
            max-width: 420px;
            overflow: hidden;
        }

        .login-header {
            background: var(--navy);
            padding: 1.5rem 2rem;
            text-align: center;
        }

        .logo-ring {
            display: inline-flex; align-items: center; justify-content: center;
            width: 58px; height: 58px; border-radius: 50%;
            background: var(--gold); margin-bottom: 0.6rem;
        }

        .logo-text { font-size: 1.3rem; font-weight: 800; color: var(--navy); letter-spacing: 0.08em; }

        .login-title { font-size: 1.05rem; font-weight: 700; color: var(--gold); }
        .login-subtitle { font-size: 0.78rem; color: rgba(255,255,255,0.65); margin-top: 0.15rem; }

        .login-body { padding: 1.75rem 2rem 2rem; }

        .form-group { margin-bottom: 1rem; }
        label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--navy); margin-bottom: 0.35rem; }

        input[type="text"], input[type="password"] {
            display: block; width: 100%; padding: 0.65rem 0.9rem;
            font-size: 0.9rem; font-family: 'Inter', 'Noto Sans Tamil', sans-serif;
            border: 1.5px solid var(--gray-300); border-radius: 8px;
            outline: none; transition: border-color 0.2s, box-shadow 0.2s;
            background: var(--white); color: #202124;
        }

        input:focus { border-color: var(--navy); box-shadow: 0 0 0 3px rgba(26,35,126,0.12); }

        .btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
            padding: 0.75rem 1.25rem; font-size: 0.9rem; font-weight: 600;
            font-family: 'Inter', 'Noto Sans Tamil', sans-serif;
            border-radius: 8px; cursor: pointer; text-decoration: none;
            transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
            border: none;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0); opacity: 0.9; }
        .btn-primary   { background: var(--navy); color: var(--gold); box-shadow: 0 2px 8px rgba(26,35,126,0.3); }
        .btn-primary:hover { background: var(--navy-light); }
        .btn-secondary { background: var(--white); color: var(--navy); border: 2px solid var(--navy); }
        .btn-secondary:hover { background: var(--gray-50); }
        .btn-gold { background: var(--gold); color: var(--navy); box-shadow: 0 2px 8px rgba(255,215,0,0.4); }
        .btn-gold:hover { background: var(--gold-light); }
        .btn-full { width: 100%; }
        .btn-danger { background: var(--red); color: var(--white); }

        .alert { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem; }
        .alert-error { background: #fce4ec; color: var(--red); border: 1px solid #f8bbd0; }

        .back-link { text-align: center; margin-top: 1rem; font-size: 0.82rem; }
        .back-link a { color: var(--navy); text-decoration: underline; }

        /* ═══════════════════════════════════════════════════
           QUIZ PAGE
        ═══════════════════════════════════════════════════ */
        .quiz-page { display: flex; flex-direction: column; min-height: 100vh; }

        /* Header */
        .quiz-header {
            background: var(--navy);
            color: var(--white);
            padding: 0.75rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            position: sticky;
            top: 0;
            z-index: 50;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .quiz-header-left { display: flex; flex-direction: column; }
        .quiz-brand { font-size: 1rem; font-weight: 800; color: var(--gold); }
        .quiz-info { font-size: 0.78rem; color: rgba(255,255,255,0.75); margin-top: 0.1rem; }

        .quiz-header-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }

        /* Language toggle */
        .lang-toggle { display: flex; background: rgba(255,255,255,0.12); border-radius: 6px; overflow: hidden; }
        .lang-btn {
            padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 600;
            background: none; border: none; color: rgba(255,255,255,0.75); cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }
        .lang-btn.active { background: var(--gold); color: var(--navy); }

        /* Timer */
        .timer-box {
            background: rgba(255,255,255,0.12);
            border-radius: 6px;
            padding: 0.35rem 0.75rem;
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--gold);
            min-width: 70px;
            text-align: center;
            font-family: 'Courier New', monospace;
        }

        .timer-box.warning { background: rgba(255,87,34,0.3); color: #ff5722; }

        /* Content area */
        .quiz-content {
            max-width: 820px;
            width: 100%;
            margin: 0 auto;
            padding: 1.5rem 1.25rem;
            flex: 1;
        }

        /* Progress bar */
        .progress-bar-wrap {
            background: var(--gray-200);
            border-radius: 999px;
            height: 6px;
            margin-bottom: 1.5rem;
            overflow: hidden;
        }

        .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--navy), var(--gold));
            border-radius: 999px;
            transition: width 0.3s ease;
        }

        /* Question card */
        .question-card {
            background: var(--white);
            border-radius: 12px;
            padding: 1.25rem 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            border: 1.5px solid var(--gray-200);
        }

        .question-card:last-of-type { margin-bottom: 0; }

        .question-num {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--gold);
            background: var(--navy);
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 999px;
            margin-bottom: 0.75rem;
            letter-spacing: 0.04em;
        }

        .question-text {
            font-size: 0.97rem;
            font-weight: 600;
            color: #202124;
            margin-bottom: 1rem;
            line-height: 1.55;
        }

        .question-img {
            max-width: 100%;
            max-height: 220px;
            border-radius: 8px;
            border: 1.5px solid var(--gray-200);
            margin-bottom: 1rem;
            display: block;
        }

        /* Options */
        .options-grid { display: flex; flex-direction: column; gap: 0.5rem; }

        .option-label {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.65rem 1rem;
            border: 1.5px solid var(--gray-300);
            border-radius: 8px;
            cursor: pointer;
            transition: border-color 0.15s, background 0.15s;
            font-size: 0.9rem;
            color: #202124;
            user-select: none;
        }

        .option-label:hover { border-color: var(--navy); background: rgba(26,35,126,0.04); }

        .option-label input[type="radio"] { display: none; }

        .option-letter {
            display: inline-flex; align-items: center; justify-content: center;
            width: 28px; height: 28px; border-radius: 50%;
            background: var(--gray-100); color: var(--navy);
            font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
            transition: background 0.15s, color 0.15s;
        }

        .option-label:has(input:checked) {
            border-color: var(--navy);
            background: var(--navy);
            color: var(--white);
        }

        .option-label:has(input:checked) .option-letter {
            background: var(--gold);
            color: var(--navy);
        }

        /* ── Language visibility ── */
        body[data-lang="en"] .ta { display: none; }
        body[data-lang="ta"] .en { display: none; }

        /* ── Navigation bar ── */
        .nav-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 1.5rem;
            gap: 1rem;
        }

        .page-indicator { font-size: 0.85rem; color: var(--gray-700); font-weight: 500; }

        /* ── Question grid ── */
        .q-grid-section {
            background: var(--white);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            margin-top: 1.5rem;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            border: 1.5px solid var(--gray-200);
        }

        .q-grid-title { font-size: 0.78rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; }

        .q-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
        }

        .q-grid-item {
            width: 32px; height: 32px;
            display: inline-flex; align-items: center; justify-content: center;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
            border: none;
            background: var(--gray-300);
            color: var(--gray-700);
            transition: background 0.15s, color 0.15s, transform 0.1s;
        }

        .q-grid-item:hover { transform: scale(1.1); }
        .q-grid-item.answered { background: var(--green); color: var(--white); }
        .q-grid-item.current  { outline: 2.5px solid var(--navy); outline-offset: 1px; }

        /* ═══════════════════════════════════════════════════
           RESULTS PAGE
        ═══════════════════════════════════════════════════ */
        .results-wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 55%, var(--navy-light) 100%);
            padding: 1.5rem;
        }

        .results-card {
            background: var(--white);
            border-radius: 16px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.35);
            width: 100%;
            max-width: 480px;
            overflow: hidden;
        }

        .results-header { background: var(--navy); padding: 1.5rem 2rem; text-align: center; }
        .results-title { font-size: 1.1rem; font-weight: 700; color: var(--gold); }
        .results-subtitle { font-size: 0.8rem; color: rgba(255,255,255,0.7); margin-top: 0.2rem; }

        .results-body { padding: 1.75rem 2rem; }

        .score-display {
            text-align: center;
            padding: 1.5rem 0 1rem;
        }

        .score-big { font-size: 3rem; font-weight: 800; color: var(--navy); line-height: 1; }
        .score-out { font-size: 1rem; color: var(--gray-700); margin-top: 0.25rem; }

        .score-bar-wrap { background: var(--gray-200); border-radius: 999px; height: 12px; margin: 1.25rem 0; overflow: hidden; }
        .score-bar-fill { height: 100%; border-radius: 999px; transition: width 1s ease; }

        .grade-badge {
            display: inline-block;
            padding: 0.4rem 1.25rem;
            border-radius: 999px;
            font-size: 0.9rem;
            font-weight: 700;
            background: var(--navy);
            color: var(--gold);
            margin: 0.5rem auto;
        }

        .result-meta { font-size: 0.83rem; color: var(--gray-700); margin-bottom: 0.3rem; }

        .result-divider { border: none; border-top: 1.5px solid var(--gray-200); margin: 1rem 0; }

        @media (max-width: 600px) {
            .quiz-header { padding: 0.65rem 1rem; }
            .quiz-content { padding: 1rem 0.75rem; }
            .question-card { padding: 1rem; }
            .timer-box { min-width: 56px; font-size: 0.75rem; }
        }
    </style>
</head>
<body data-lang="en" data-ocid="quiz.page">

<?php if ($state === 'login'): ?>
<!-- ══════════════════════════════════════════════════════════
     LOGIN SECTION
══════════════════════════════════════════════════════════ -->
<div class="login-wrap">
    <div class="login-card" data-ocid="quiz.login_card">
        <div class="login-header">
            <div class="logo-ring">
                <span class="logo-text">MKJC</span>
            </div>
            <div class="login-title">Student Login</div>
            <div class="login-subtitle">MKJC Scholarship Exam Portal</div>
        </div>

        <div class="login-body">
            <?php if ($loginError): ?>
                <div class="alert alert-error" data-ocid="quiz.login_error_state">
                    ⚠ <?= htmlspecialchars($loginError) ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="quiz.php" data-ocid="quiz.login_form">
                <input type="hidden" name="action" value="login">

                <div class="form-group">
                    <label for="user_id">User ID</label>
                    <input type="text" id="user_id" name="user_id"
                           placeholder="e.g. STU000001" autocomplete="username"
                           value="<?= htmlspecialchars($_POST['user_id'] ?? '') ?>"
                           required data-ocid="quiz.user_id_input">
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password"
                           placeholder="Enter your password" autocomplete="current-password"
                           required data-ocid="quiz.password_input">
                </div>

                <button type="submit" class="btn btn-primary btn-full" data-ocid="quiz.login_button">
                    🔓 Login to Exam
                </button>
            </form>

            <div class="back-link">
                <a href="index.php" data-ocid="quiz.back_to_register">← Back to Registration</a>
            </div>
        </div>
    </div>
</div>

<?php elseif ($state === 'quiz'): ?>
<!-- ══════════════════════════════════════════════════════════
     QUIZ SECTION
══════════════════════════════════════════════════════════ -->
<div class="quiz-page" data-ocid="quiz.quiz_section">

    <!-- Header -->
    <div class="quiz-header">
        <div class="quiz-header-left">
            <span class="quiz-brand">MKJC Exam Portal</span>
            <span class="quiz-info">
                <?= htmlspecialchars($student['student_name'] ?? '') ?> &mdash;
                <?= htmlspecialchars($exam['exam_name'] ?? '') ?>
            </span>
        </div>
        <div class="quiz-header-right">
            <!-- Language toggle -->
            <div class="lang-toggle" data-ocid="quiz.lang_toggle">
                <button class="lang-btn active" id="btnEn" onclick="setLang('en')" data-ocid="quiz.lang_en_button">English</button>
                <button class="lang-btn" id="btnTa" onclick="setLang('ta')" data-ocid="quiz.lang_ta_button">தமிழ்</button>
            </div>
            <!-- Timer -->
            <div class="timer-box" id="examTimer" data-remaining="<?= $remaining ?>" data-ocid="quiz.timer">
                <?= gmdate('i:s', $remaining) ?>
            </div>
            <!-- Logout -->
            <a href="quiz.php?action=logout" class="btn btn-danger" style="padding:0.4rem 0.75rem;font-size:0.78rem;" data-ocid="quiz.logout_button">Exit</a>
        </div>
    </div>

    <!-- Content -->
    <div class="quiz-content">

        <!-- Progress bar -->
        <?php $answeredCount = count($answers); $questionCount = count($questions); ?>
        <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:<?= $questionCount > 0 ? round(($answeredCount / $questionCount) * 100) : 0 ?>%"></div>
        </div>

        <!-- Questions form -->
        <form method="POST" action="quiz.php" id="quizForm" data-ocid="quiz.answers_form">
            <input type="hidden" name="action" value="answer">
            <input type="hidden" name="nav" value="next" id="navInput">
            <input type="hidden" name="jump_page" value="" id="jumpPageInput">

            <?php foreach ($pageQuestions as $index => $q):
                $absIndex = $pageStart + $index;
                $qId      = (int) $q['id'];
                $selected = $answers[$qId] ?? '';
                $qNum     = $absIndex + 1;
            ?>
            <div class="question-card" data-ocid="quiz.question.<?= $qNum ?>">
                <span class="question-num">Q <?= $qNum ?></span>

                <div class="question-text">
                    <?php if (!empty($q['question_ta'])): ?>
                        <span class="en"><?= htmlspecialchars($q['question_en']) ?></span>
                        <span class="ta"><?= htmlspecialchars($q['question_ta']) ?></span>
                    <?php else: ?>
                        <?= htmlspecialchars($q['question_en']) ?>
                    <?php endif; ?>
                </div>

                <?php if (!empty($q['image_url'])): ?>
                    <img src="<?= htmlspecialchars($q['image_url']) ?>" alt="Question image" class="question-img">
                <?php endif; ?>

                <div class="options-grid" data-ocid="quiz.options.<?= $qNum ?>">
                    <?php
                    $opts = [
                        'A' => ['en' => $q['option_a_en'], 'ta' => $q['option_a_ta'] ?? ''],
                        'B' => ['en' => $q['option_b_en'], 'ta' => $q['option_b_ta'] ?? ''],
                        'C' => ['en' => $q['option_c_en'], 'ta' => $q['option_c_ta'] ?? ''],
                        'D' => ['en' => $q['option_d_en'], 'ta' => $q['option_d_ta'] ?? ''],
                    ];
                    foreach ($opts as $letter => $opt):
                        $checked = ($selected === $letter) ? 'checked' : '';
                    ?>
                    <label class="option-label" data-ocid="quiz.option.<?= $qNum ?>.<?= strtolower($letter) ?>">
                        <input type="radio" name="answers[<?= $qId ?>]" value="<?= $letter ?>" <?= $checked ?>>
                        <span class="option-letter"><?= $letter ?></span>
                        <span>
                            <?php if (!empty($opt['ta'])): ?>
                                <span class="en"><?= htmlspecialchars($opt['en']) ?></span>
                                <span class="ta"><?= htmlspecialchars($opt['ta']) ?></span>
                            <?php else: ?>
                                <?= htmlspecialchars($opt['en']) ?>
                            <?php endif; ?>
                        </span>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endforeach; ?>

            <!-- Navigation -->
            <div class="nav-bar" data-ocid="quiz.nav_bar">
                <?php if ($currentPage > 0): ?>
                    <button type="button" class="btn btn-secondary" onclick="navigate('prev')" data-ocid="quiz.prev_button">
                        ← Previous
                    </button>
                <?php else: ?>
                    <div></div>
                <?php endif; ?>

                <span class="page-indicator">Page <?= $currentPage + 1 ?> of <?= $totalPages ?></span>

                <?php if ($currentPage < $totalPages - 1): ?>
                    <button type="button" class="btn btn-primary" onclick="navigate('next')" data-ocid="quiz.next_button">
                        Next →
                    </button>
                <?php else: ?>
                    <button type="button" class="btn btn-gold" onclick="confirmSubmit()" data-ocid="quiz.submit_button">
                        ✔ Submit Exam
                    </button>
                <?php endif; ?>
            </div>

        </form>

        <!-- Question grid -->
        <div class="q-grid-section" data-ocid="quiz.question_grid">
            <div class="q-grid-title">Question Status (Green = Answered)</div>
            <div class="q-grid">
                <?php foreach ($questions as $gIdx => $gq):
                    $gQid    = (int) $gq['id'];
                    $gPage   = (int) floor($gIdx / $QUESTIONS_PER_PAGE);
                    $isAns   = isset($answers[$gQid]) ? 'answered' : '';
                    $isCurr  = ($gPage === $currentPage) ? 'current' : '';
                ?>
                <button type="button"
                        class="q-grid-item <?= $isAns ?> <?= $isCurr ?>"
                        onclick="jumpTo(<?= $gPage ?>)"
                        data-ocid="quiz.grid_item.<?= $gIdx + 1 ?>">
                    <?= $gIdx + 1 ?>
                </button>
                <?php endforeach; ?>
            </div>
        </div>

    </div><!-- /.quiz-content -->
</div><!-- /.quiz-page -->

<?php else: // state === 'results' ?>
<!-- ══════════════════════════════════════════════════════════
     RESULTS SECTION
══════════════════════════════════════════════════════════ -->
<div class="results-wrap">
    <div class="results-card" data-ocid="quiz.results_card">
        <div class="results-header">
            <div class="results-title">Exam Complete! 🎓</div>
            <div class="results-subtitle">MKJC Scholarship Exam Portal</div>
        </div>

        <div class="results-body">
            <p class="result-meta">Student: <strong><?= htmlspecialchars($student['student_name'] ?? '') ?></strong></p>
            <p class="result-meta">Exam: <strong><?= htmlspecialchars($exam['exam_name'] ?? '') ?></strong></p>

            <hr class="result-divider">

            <div class="score-display" data-ocid="quiz.score_display">
                <div class="score-big"><?= $score ?></div>
                <div class="score-out">out of <?= $total ?> &nbsp;·&nbsp; <?= $pct ?>%</div>

                <div class="score-bar-wrap" style="margin-top:1rem;">
                    <div class="score-bar-fill"
                         id="scoreBar"
                         style="width:0%;background:<?= $pct >= 75 ? 'linear-gradient(90deg,#2e7d32,#4caf50)' : ($pct >= 50 ? 'linear-gradient(90deg,#f57f17,#fbc02d)' : 'linear-gradient(90deg,#b71c1c,#e53935)') ?>">
                    </div>
                </div>

                <div class="grade-badge" data-ocid="quiz.grade_badge"><?= $grade ?></div>
            </div>

            <hr class="result-divider">

            <a href="quiz.php?action=startover" class="btn btn-primary btn-full" data-ocid="quiz.startover_button">
                🔄 Start Over
            </a>
        </div>
    </div>
</div>

<script>
// Animate score bar on load
window.addEventListener('load', function () {
    setTimeout(function () {
        var bar = document.getElementById('scoreBar');
        if (bar) bar.style.width = '<?= $pct ?>%';
    }, 300);
});
</script>

<?php endif; ?>

<script>
/* ── Language toggle ─────────────────────────────────────────── */
function setLang(lang) {
    document.body.setAttribute('data-lang', lang);
    document.getElementById('btnEn').classList.toggle('active', lang === 'en');
    document.getElementById('btnTa').classList.toggle('active', lang === 'ta');
    try { localStorage.setItem('mkjc_lang', lang); } catch(e) {}
}

// Restore language preference
(function () {
    try {
        var saved = localStorage.getItem('mkjc_lang');
        if (saved === 'ta') setLang('ta');
    } catch(e) {}
})();

/* ── Quiz navigation ─────────────────────────────────────────── */
function navigate(dir) {
    document.getElementById('navInput').value = dir;
    document.getElementById('jumpPageInput').value = '';
    document.getElementById('quizForm').submit();
}

function jumpTo(page) {
    document.getElementById('navInput').value = 'jump';
    document.getElementById('jumpPageInput').value = page;
    document.getElementById('quizForm').submit();
}

function confirmSubmit() {
    var answered = document.querySelectorAll('[data-ocid^="quiz.grid_item"].answered').length;
    var total    = document.querySelectorAll('[data-ocid^="quiz.grid_item"]').length;
    var unanswered = total - answered;

    var msg = unanswered > 0
        ? 'You have ' + unanswered + ' unanswered question(s). Submit anyway?'
        : 'Submit the exam? You cannot change answers after submission.';

    if (confirm(msg)) {
        document.getElementById('navInput').value = 'submit';
        document.getElementById('jumpPageInput').value = '';
        document.getElementById('quizForm').submit();
    }
}

/* ── Countdown timer ─────────────────────────────────────────── */
(function () {
    var timerEl = document.getElementById('examTimer');
    if (!timerEl) return;

    var remaining = parseInt(timerEl.getAttribute('data-remaining'), 10) || 0;

    var interval = setInterval(function () {
        remaining--;
        if (remaining <= 0) {
            clearInterval(interval);
            timerEl.textContent = '00:00';
            // Auto-submit when time runs out
            document.getElementById('navInput').value = 'submit';
            document.getElementById('quizForm').submit();
            return;
        }

        var m = Math.floor(remaining / 60);
        var s = remaining % 60;
        timerEl.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');

        if (remaining <= 300) {
            timerEl.classList.add('warning');
        }
    }, 1000);
})();
</script>

</body>
</html>
