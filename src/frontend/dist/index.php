<?php
/**
 * index.php — MKJC Scholarship Exam Portal Homepage
 * Student registration with auto-credential generation + SMS delivery.
 */

session_start();
require_once __DIR__ . '/admin/db.php';

$db         = new MKJCDB();
$error      = '';
$registered = false;
$credentials = [];

// ── Handle registration POST ────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'register') {

    $studentName = trim($_POST['student_name'] ?? '');
    $schoolName  = trim($_POST['school_name']  ?? '');
    $group       = trim($_POST['group_studied'] ?? '');
    $contact     = trim($_POST['contact']       ?? '');
    $whatsapp    = trim($_POST['whatsapp']      ?? '');
    $examId      = trim($_POST['exam_id']       ?? '');

    if ($studentName === '') {
        $error = 'Student Name is required.';
    } elseif ($contact === '') {
        $error = 'Contact Number is required.';
    } else {
        try {
            $result = $db->registerStudent([
                'student_name'  => $studentName,
                'school_name'   => $schoolName,
                'group_studied' => $group,
                'contact'       => $contact,
                'whatsapp'      => $whatsapp,
                'exam_id'       => $examId,
            ]);

            $userId   = $result['user_id'];
            $password = $result['password'];

            // Send SMS credentials
            $smsNumber = !empty($whatsapp) ? $whatsapp : $contact;
            $smsMsg    = "MKJC Exam Portal - Your login credentials: User ID: {$userId}, Password: {$password}. Use these to log in at the exam portal.";
            $db->sendSms($smsNumber, $smsMsg);

            // Store in session for credential display
            $_SESSION['reg_user_id']      = $userId;
            $_SESSION['reg_password']     = $password;
            $_SESSION['reg_id']           = $result['id'];
            $_SESSION['reg_exam_id']      = $examId;
            $_SESSION['reg_student_name'] = $studentName;

            $registered  = true;
            $credentials = ['user_id' => $userId, 'password' => $password];

        } catch (\Throwable $e) {
            $error = 'Registration failed. Please try again.';
        }
    }
}

// ── If session already has credentials (page refresh after register) ─────────
if (!$registered && !empty($_SESSION['reg_user_id'])) {
    $registered  = true;
    $credentials = [
        'user_id'  => $_SESSION['reg_user_id'],
        'password' => $_SESSION['reg_password'],
    ];
}

// ── Clear credentials from session after displaying ──────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['clear'])) {
    unset($_SESSION['reg_user_id'], $_SESSION['reg_password'],
          $_SESSION['reg_id'], $_SESSION['reg_exam_id'], $_SESSION['reg_student_name']);
    header('Location: index.php');
    exit;
}

// ── Fetch exams for dropdown ──────────────────────────────────────────────────
$exams = $db->getExams();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MKJC Scholarship Exam Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --navy:       #1a237e;
            --navy-dark:  #0d1757;
            --navy-light: #283593;
            --gold:       #ffd700;
            --gold-light: #ffeb3b;
            --white:      #ffffff;
            --gray-50:    #f8f9fa;
            --gray-100:   #f1f3f4;
            --gray-300:   #dadce0;
            --gray-500:   #80868b;
            --gray-700:   #5f6368;
            --red:        #d32f2f;
            --green:      #2e7d32;
        }

        body {
            font-family: 'Inter', 'Noto Sans Tamil', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 50%, var(--navy-light) 100%);
            padding: 1.5rem;
        }

        .card {
            background: var(--white);
            border-radius: 16px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 460px;
            overflow: hidden;
        }

        /* ── Card header ─────────────────────────────────────────────────── */
        .card-header {
            background: var(--navy);
            padding: 1.75rem 2rem 1.5rem;
            text-align: center;
            position: relative;
        }

        .logo-ring {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: var(--gold);
            margin-bottom: 0.75rem;
        }

        .logo-text {
            font-size: 1.4rem;
            font-weight: 800;
            color: var(--navy);
            letter-spacing: 0.08em;
        }

        .card-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--gold);
            margin-bottom: 0.2rem;
        }

        .card-subtitle {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.7);
            letter-spacing: 0.04em;
        }

        /* ── Card body ───────────────────────────────────────────────────── */
        .card-body {
            padding: 1.75rem 2rem 2rem;
        }

        .section-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 1.25rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--gold);
        }

        /* ── Form ────────────────────────────────────────────────────────── */
        .form-group {
            margin-bottom: 1rem;
        }

        label {
            display: block;
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 0.35rem;
        }

        label .req { color: var(--red); }

        input[type="text"],
        input[type="tel"],
        select {
            display: block;
            width: 100%;
            padding: 0.6rem 0.85rem;
            font-size: 0.9rem;
            font-family: 'Inter', 'Noto Sans Tamil', sans-serif;
            color: #202124;
            background: var(--white);
            border: 1.5px solid var(--gray-300);
            border-radius: 8px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            appearance: none;
        }

        input:focus, select:focus {
            border-color: var(--navy);
            box-shadow: 0 0 0 3px rgba(26, 35, 126, 0.12);
        }

        select {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a237e' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.85rem center;
            padding-right: 2.5rem;
        }

        /* ── Buttons ─────────────────────────────────────────────────────── */
        .btn-row {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
        }

        .btn {
            flex: 1;
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
            font-weight: 600;
            font-family: 'Inter', 'Noto Sans Tamil', sans-serif;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
        }

        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0); opacity: 0.9; }

        .btn-primary {
            background: var(--navy);
            color: var(--gold);
            border: none;
            box-shadow: 0 2px 8px rgba(26, 35, 126, 0.3);
        }

        .btn-primary:hover { background: var(--navy-light); box-shadow: 0 4px 16px rgba(26, 35, 126, 0.4); }

        .btn-secondary {
            background: var(--white);
            color: var(--navy);
            border: 2px solid var(--navy);
        }

        .btn-secondary:hover { background: var(--gray-50); }

        .btn-gold {
            background: var(--gold);
            color: var(--navy);
            border: none;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
        }

        .btn-gold:hover { background: var(--gold-light); }

        /* ── Alert ───────────────────────────────────────────────────────── */
        .alert {
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }

        .alert-error {
            background: #fce4ec;
            color: var(--red);
            border: 1px solid #f8bbd0;
        }

        /* ── Credential card ─────────────────────────────────────────────── */
        .cred-box {
            background: var(--gray-50);
            border: 2px solid var(--gold);
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1.25rem;
            text-align: center;
        }

        .cred-box .cred-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--navy);
            margin-bottom: 0.25rem;
        }

        .cred-box .cred-note {
            font-size: 0.78rem;
            color: var(--gray-700);
            margin-bottom: 1rem;
        }

        .cred-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.6rem 0.85rem;
            background: var(--white);
            border: 1.5px solid var(--gray-300);
            border-radius: 8px;
            margin-bottom: 0.5rem;
        }

        .cred-item .cred-label {
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--gray-700);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .cred-item .cred-value {
            font-size: 1rem;
            font-weight: 700;
            color: var(--navy);
            font-family: 'Courier New', monospace;
            letter-spacing: 0.06em;
        }

        .success-icon {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            display: block;
        }

        /* ── Footer link ─────────────────────────────────────────────────── */
        .footer-note {
            text-align: center;
            margin-top: 1rem;
            font-size: 0.78rem;
            color: var(--gray-500);
        }

        .footer-note a {
            color: var(--navy);
            text-decoration: underline;
        }

        /* ── Responsive ──────────────────────────────────────────────────── */
        @media (max-width: 480px) {
            body { padding: 1rem; align-items: flex-start; padding-top: 2rem; }
            .card-body { padding: 1.25rem 1.25rem 1.5rem; }
            .btn-row { flex-direction: column; }
        }
    </style>
</head>
<body>

<div class="card" data-ocid="registration.card">

    <!-- Header -->
    <div class="card-header">
        <div class="logo-ring">
            <span class="logo-text">MKJC</span>
        </div>
        <div class="card-title">MKJC Scholarship Exam Portal</div>
        <div class="card-subtitle">Online Examination System</div>
    </div>

    <!-- Body -->
    <div class="card-body">

        <?php if ($error): ?>
            <div class="alert alert-error" data-ocid="registration.error_state">⚠ <?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <?php if ($registered): ?>
            <!-- ── Credential display ──────────────────────────────────── -->
            <div class="cred-box" data-ocid="registration.success_state">
                <span class="success-icon">🎉</span>
                <div class="cred-title">Registration Successful!</div>
                <div class="cred-note">Save your login credentials before proceeding. An SMS has been sent to your mobile number.</div>

                <div class="cred-item">
                    <span class="cred-label">User ID</span>
                    <span class="cred-value" id="credUserId"><?= htmlspecialchars($credentials['user_id']) ?></span>
                </div>
                <div class="cred-item">
                    <span class="cred-label">Password</span>
                    <span class="cred-value" id="credPassword"><?= htmlspecialchars($credentials['password']) ?></span>
                </div>
            </div>

            <div class="btn-row">
                <button class="btn btn-secondary" onclick="copyCredentials()" data-ocid="registration.copy_button">
                    📋 Copy Credentials
                </button>
                <a href="quiz.php" class="btn btn-primary" data-ocid="registration.proceed_button" onclick="clearSession()">
                    🎯 Proceed to Login
                </a>
            </div>

            <div class="footer-note">
                <a href="index.php?clear=1">← Register another student</a>
            </div>

        <?php else: ?>
            <!-- ── Registration form ────────────────────────────────────── -->
            <div class="section-title">Student Registration</div>

            <form method="POST" action="index.php" data-ocid="registration.form">
                <input type="hidden" name="action" value="register">

                <div class="form-group">
                    <label for="student_name">Student Name <span class="req">*</span></label>
                    <input type="text" id="student_name" name="student_name" placeholder="Enter full name"
                           value="<?= htmlspecialchars($_POST['student_name'] ?? '') ?>"
                           required data-ocid="registration.name_input">
                </div>

                <div class="form-group">
                    <label for="school_name">School Name</label>
                    <input type="text" id="school_name" name="school_name" placeholder="Enter school name"
                           value="<?= htmlspecialchars($_POST['school_name'] ?? '') ?>"
                           data-ocid="registration.school_input">
                </div>

                <div class="form-group">
                    <label for="group_studied">12th Group Studied</label>
                    <select id="group_studied" name="group_studied" data-ocid="registration.group_select">
                        <option value="">Select Group</option>
                        <?php foreach (['Bio-Maths','Computer Science','Commerce','Arts','Other'] as $g): ?>
                            <option value="<?= $g ?>" <?= (($_POST['group_studied'] ?? '') === $g) ? 'selected' : '' ?>>
                                <?= $g ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="contact">Contact Number <span class="req">*</span></label>
                    <input type="tel" id="contact" name="contact" placeholder="10-digit mobile number"
                           value="<?= htmlspecialchars($_POST['contact'] ?? '') ?>"
                           required data-ocid="registration.contact_input">
                </div>

                <div class="form-group">
                    <label for="whatsapp">WhatsApp Number</label>
                    <input type="tel" id="whatsapp" name="whatsapp" placeholder="WhatsApp number (if different)"
                           value="<?= htmlspecialchars($_POST['whatsapp'] ?? '') ?>"
                           data-ocid="registration.whatsapp_input">
                </div>

                <div class="form-group">
                    <label for="exam_id">Select Exam</label>
                    <select id="exam_id" name="exam_id" data-ocid="registration.exam_select">
                        <option value="" disabled selected>Select Exam</option>
                        <?php foreach ($exams as $exam): ?>
                            <option value="<?= htmlspecialchars($exam['exam_id']) ?>"
                                <?= (($_POST['exam_id'] ?? '') === $exam['exam_id']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($exam['exam_name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="btn-row">
                    <button type="submit" class="btn btn-primary" data-ocid="registration.submit_button">
                        🚀 Start Now
                    </button>
                    <a href="admin/index.php" class="btn btn-secondary" data-ocid="registration.staff_login_button">
                        🔐 Staff Login
                    </a>
                </div>
            </form>

        <?php endif; ?>

    </div><!-- /.card-body -->
</div><!-- /.card -->

<script>
function copyCredentials() {
    const uid  = document.getElementById('credUserId')?.textContent  || '';
    const pass = document.getElementById('credPassword')?.textContent || '';
    const text = `MKJC Exam Portal\nUser ID: ${uid}\nPassword: ${pass}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => alert('Credentials copied to clipboard!'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('Credentials copied to clipboard!');
    }
}

function clearSession() {
    // Let quiz.php handle the session; just navigate
    return true;
}
</script>

</body>
</html>
