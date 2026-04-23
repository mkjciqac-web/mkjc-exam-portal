<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: index.php');
    exit;
}
$adminUser = $_SESSION['admin_user'] ?? 'admin';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard — MKJC Exam Portal</title>
  <link rel="stylesheet" href="assets/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
<div class="layout">

  <!-- ── SIDEBAR ── -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">MK</div>
        <div class="sidebar-logo-text">
          <strong>MKJC Portal</strong>
          <span>Admin Dashboard</span>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-label">Management</div>
      <button class="nav-item active" onclick="switchTab('questions',this)" data-ocid="nav.questions_tab">
        <span class="nav-icon">📝</span><span>Questions</span>
      </button>
      <button class="nav-item" onclick="switchTab('registrations',this)" data-ocid="nav.registrations_tab">
        <span class="nav-icon">📋</span><span>Registrations</span>
      </button>
      <button class="nav-item" onclick="switchTab('results',this)" data-ocid="nav.results_tab">
        <span class="nav-icon">📊</span><span>Results</span>
      </button>
      <button class="nav-item" onclick="switchTab('exams',this)" data-ocid="nav.exams_tab">
        <span class="nav-icon">🗓️</span><span>Exams</span>
      </button>
      <div class="nav-label" style="margin-top:8px;">Configuration</div>
      <button class="nav-item" onclick="switchTab('settings',this)" data-ocid="nav.settings_tab">
        <span class="nav-icon">⚙️</span><span>Settings</span>
      </button>
      <button class="nav-item" onclick="switchTab('formbuilder',this)" data-ocid="nav.formbuilder_tab">
        <span class="nav-icon">🎨</span><span>Form Builder</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <a href="logout.php" class="nav-item" style="color:#f87171;" data-ocid="nav.logout_button">
        <span class="nav-icon">🚪</span><span>Logout</span>
      </a>
    </div>
  </aside>

  <!-- ── MAIN AREA ── -->
  <div class="main">
    <div class="topbar">
      <div>
        <div class="topbar-title" id="topbar-title">Questions</div>
        <span class="topbar-subtitle" id="topbar-subtitle">Manage exam questions</span>
      </div>
      <div class="topbar-actions">
        <div class="user-chip">
          <div class="user-chip-avatar">A</div>
          <?= htmlspecialchars($adminUser) ?>
        </div>
      </div>
    </div>

    <div class="content-area">

      <!-- ══════════════════════════════════════════
           TAB: QUESTIONS
      ══════════════════════════════════════════ -->
      <div class="tab-panel active" id="tab-questions">
        <div class="section-header">
          <div>
            <div class="section-title">Questions</div>
            <span class="section-title-meta" id="q-count-label">Loading...</span>
          </div>
          <div class="section-actions">
            <button class="btn btn-secondary btn-sm" onclick="downloadTemplate()" data-ocid="questions.download_template_button">⬇ Template</button>
            <label class="btn btn-secondary btn-sm" style="cursor:pointer;" data-ocid="questions.import_button">
              📥 Import CSV
              <input type="file" id="csv-import-input" accept=".csv" style="display:none" onchange="importCSV(this)">
            </label>
            <button class="btn btn-secondary btn-sm" onclick="exportCSV()" data-ocid="questions.export_button">📤 Export CSV</button>
            <button class="btn btn-secondary btn-sm" onclick="printQuestions()" data-ocid="questions.print_button">🖨 Print</button>
            <button class="btn btn-gold" onclick="openAddQuestion()" data-ocid="questions.add_button">+ Add Question</button>
          </div>
        </div>

        <div class="table-wrap">
          <div class="table-responsive">
            <table id="questions-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Question (EN)</th>
                  <th>Question (TA)</th>
                  <th>Options A–D (EN)</th>
                  <th>Correct</th>
                  <th>Exam</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="questions-tbody">
                <tr><td colspan="8" class="loading-overlay"><div class="loading-spinner-dark"></div> Loading questions…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div><!-- /tab-questions -->

      <!-- ══════════════════════════════════════════
           TAB: REGISTRATIONS
      ══════════════════════════════════════════ -->
      <div class="tab-panel" id="tab-registrations">
        <div class="section-header">
          <div>
            <div class="section-title">Registrations</div>
            <span class="section-title-meta" id="reg-count-label">Loading...</span>
          </div>
        </div>

        <div class="filter-bar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" id="reg-search" placeholder="Search by name, school, contact…" oninput="filterRegistrations()" data-ocid="registrations.search_input">
          </div>
          <select class="filter-select" id="reg-exam-filter" onchange="filterRegistrations()" data-ocid="registrations.exam_filter">
            <option value="">All Exams</option>
          </select>
        </div>

        <div class="table-wrap">
          <div class="table-responsive">
            <table id="registrations-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Reg ID</th>
                  <th>Student Name</th>
                  <th>School</th>
                  <th>Group</th>
                  <th>Contact</th>
                  <th>Exam</th>
                  <th>User ID</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="registrations-tbody">
                <tr><td colspan="10" class="loading-overlay"><div class="loading-spinner-dark"></div> Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div><!-- /tab-registrations -->

      <!-- ══════════════════════════════════════════
           TAB: RESULTS
      ══════════════════════════════════════════ -->
      <div class="tab-panel" id="tab-results">
        <div class="section-header">
          <div>
            <div class="section-title">Results</div>
            <span class="section-title-meta" id="res-count-label">Loading...</span>
          </div>
        </div>

        <div class="filter-bar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" id="res-search" placeholder="Search by student name…" oninput="filterResults()" data-ocid="results.search_input">
          </div>
          <select class="filter-select" id="res-exam-filter" onchange="filterResults()" data-ocid="results.exam_filter">
            <option value="">All Exams</option>
          </select>
        </div>

        <div class="table-wrap">
          <div class="table-responsive">
            <table id="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Result ID</th>
                  <th>Student Name</th>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Total</th>
                  <th>Percentage</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="results-tbody">
                <tr><td colspan="9" class="loading-overlay"><div class="loading-spinner-dark"></div> Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div><!-- /tab-results -->

      <!-- ══════════════════════════════════════════
           TAB: EXAMS
      ══════════════════════════════════════════ -->
      <div class="tab-panel" id="tab-exams">
        <div class="section-header">
          <div>
            <div class="section-title">Exams</div>
            <span class="section-title-meta" id="exam-count-label">Loading...</span>
          </div>
          <div class="section-actions">
            <button class="btn btn-gold" onclick="openAddExam()" data-ocid="exams.add_button">+ New Exam</button>
          </div>
        </div>

        <div class="table-wrap">
          <div class="table-responsive">
            <table id="exams-table">
              <thead>
                <tr>
                  <th>Exam ID</th>
                  <th>Exam Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration (min)</th>
                  <th>No. of Questions</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="exams-tbody">
                <tr><td colspan="8" class="loading-overlay"><div class="loading-spinner-dark"></div> Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div><!-- /tab-exams -->

      <!-- ══════════════════════════════════════════
           TAB: SETTINGS
      ══════════════════════════════════════════ -->
      <div class="tab-panel" id="tab-settings">
        <div class="section-header">
          <div class="section-title">Settings</div>
        </div>

        <!-- SMS Stats -->
        <div class="stat-cards" id="sms-stats-cards">
          <div class="stat-card">
            <div class="stat-icon stat-icon-navy">📨</div>
            <div class="stat-info"><div class="stat-value" id="stat-sms-sent">—</div><div class="stat-label">Total SMS Sent</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-danger">⚠️</div>
            <div class="stat-info"><div class="stat-value" id="stat-sms-failed">—</div><div class="stat-label">Failed SMS</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-gold">₹</div>
            <div class="stat-info"><div class="stat-value" id="stat-sms-cost">—</div><div class="stat-label">Estimated Cost</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-success">✅</div>
            <div class="stat-info"><div class="stat-value" id="stat-api-status">—</div><div class="stat-label">API Key Status</div></div>
          </div>
        </div>

        <!-- API Key Section -->
        <div class="settings-section">
          <div class="settings-section-header">
            <div class="settings-section-icon">🔑</div>
            <div class="settings-section-title">Fast2SMS API Key</div>
          </div>
          <div class="settings-section-body">
            <div class="form-group" style="max-width:520px;">
              <label for="api-key-input">API Key <span class="required-star">*</span></label>
              <div class="input-group">
                <input type="password" class="form-control" id="api-key-input" placeholder="Paste your Fast2SMS API key here…" data-ocid="settings.api_key_input">
                <button class="btn btn-secondary" onclick="toggleApiKeyVisibility()" id="api-key-toggle" data-ocid="settings.toggle_key_button">👁</button>
              </div>
              <p class="form-hint">Get your API key at <a href="https://www.fast2sms.com" target="_blank" style="color:var(--gold-dark);">fast2sms.com</a></p>
            </div>
            <button class="btn btn-primary" onclick="saveApiKey()" data-ocid="settings.save_key_button">💾 Save API Key</button>
          </div>
        </div>

        <!-- Test SMS Section -->
        <div class="settings-section">
          <div class="settings-section-header">
            <div class="settings-section-icon">📲</div>
            <div class="settings-section-title">Test SMS Delivery</div>
          </div>
          <div class="settings-section-body">
            <div class="form-grid" style="max-width:520px;">
              <div class="form-group">
                <label for="test-phone">Mobile Number</label>
                <input type="text" class="form-control" id="test-phone" placeholder="10-digit number" maxlength="10" data-ocid="settings.test_phone_input">
              </div>
              <div class="form-group">
                <label for="test-msg">Message</label>
                <input type="text" class="form-control" id="test-msg" value="Test SMS from MKJC Exam Portal" data-ocid="settings.test_message_input">
              </div>
            </div>
            <button class="btn btn-gold" onclick="sendTestSms()" data-ocid="settings.test_sms_button">📤 Send Test SMS</button>
          </div>
        </div>

        <!-- Recharge Section -->
        <div class="settings-section">
          <div class="settings-section-header">
            <div class="settings-section-icon">💳</div>
            <div class="settings-section-title">Recharge & Pricing</div>
          </div>
          <div class="settings-section-body">
            <p style="margin-bottom:14px; color:var(--gray-600); font-size:13px;">SMS is billed at ₹0.18 per message via Fast2SMS. Recharge your wallet to continue sending.</p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a href="https://www.fast2sms.com/wallet" target="_blank" class="btn btn-primary" data-ocid="settings.recharge_button">💰 Recharge Fast2SMS Wallet</a>
              <a href="https://www.fast2sms.com/pricing" target="_blank" class="btn btn-secondary" data-ocid="settings.pricing_button">📋 View Pricing</a>
            </div>
          </div>
        </div>
      </div><!-- /tab-settings -->

      <!-- ══════════════════════════════════════════
           TAB: FORM BUILDER
      ══════════════════════════════════════════ -->
      <div class="tab-panel" id="tab-formbuilder">
        <div class="section-header">
          <div class="section-title">Form Builder</div>
          <div class="section-actions">
            <div class="theme-buttons" id="theme-buttons">
              <button class="theme-btn active" onclick="applyTheme('light',this)" data-ocid="formbuilder.theme_light">Light</button>
              <button class="theme-btn" onclick="applyTheme('dark',this)" data-ocid="formbuilder.theme_dark">Dark</button>
              <button class="theme-btn" onclick="applyTheme('modern',this)" data-ocid="formbuilder.theme_modern">Modern</button>
              <button class="theme-btn" onclick="applyTheme('minimal',this)" data-ocid="formbuilder.theme_minimal">Minimal</button>
            </div>
            <button class="btn btn-gold" onclick="exportFormHtml()" data-ocid="formbuilder.export_button">⬇ Export HTML</button>
            <button class="btn btn-danger-outline btn-sm" onclick="clearCanvas()" data-ocid="formbuilder.clear_button">🗑 Clear</button>
          </div>
        </div>

        <div class="form-builder" id="fb-container">
          <!-- Palette -->
          <div class="fb-palette">
            <h3>Controls</h3>
            <div class="fb-control-item" draggable="true" data-type="text" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_text">
              <span class="fb-control-icon">🔤</span> Text Input
            </div>
            <div class="fb-control-item" draggable="true" data-type="email" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_email">
              <span class="fb-control-icon">📧</span> Email Input
            </div>
            <div class="fb-control-item" draggable="true" data-type="password" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_password">
              <span class="fb-control-icon">🔒</span> Password
            </div>
            <div class="fb-control-item" draggable="true" data-type="number" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_number">
              <span class="fb-control-icon">🔢</span> Number
            </div>
            <div class="fb-control-item" draggable="true" data-type="textarea" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_textarea">
              <span class="fb-control-icon">📄</span> Textarea
            </div>
            <div class="fb-control-item" draggable="true" data-type="select" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_select">
              <span class="fb-control-icon">📋</span> Dropdown
            </div>
            <div class="fb-control-item" draggable="true" data-type="checkbox" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_checkbox">
              <span class="fb-control-icon">☑️</span> Checkbox
            </div>
            <div class="fb-control-item" draggable="true" data-type="radio" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_radio">
              <span class="fb-control-icon">🔘</span> Radio Button
            </div>
            <div class="fb-control-item" draggable="true" data-type="date" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_date">
              <span class="fb-control-icon">📅</span> Date Picker
            </div>
            <div class="fb-control-item" draggable="true" data-type="file" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_file">
              <span class="fb-control-icon">📎</span> File Upload
            </div>
            <div class="fb-control-item" draggable="true" data-type="button" ondragstart="fbDragStart(event)" data-ocid="formbuilder.control_button">
              <span class="fb-control-icon">🖱️</span> Button
            </div>
          </div>

          <!-- Canvas -->
          <div>
            <div class="fb-canvas" id="fb-canvas"
              ondragover="fbDragOver(event)"
              ondrop="fbDrop(event)"
              ondragleave="fbDragLeave(event)"
              data-ocid="formbuilder.canvas_target">
              <div class="fb-empty-canvas" id="fb-empty-msg">
                <div class="fb-empty-canvas-icon">🖱️</div>
                <div><strong>Drag controls here</strong></div>
                <div>Drop form elements to start building your form</div>
              </div>
            </div>
            <div class="css-editor-wrap">
              <label>Custom CSS (live preview)</label>
              <textarea class="css-editor" id="fb-css-editor" placeholder="/* Add custom CSS... */" oninput="applyCssPreview()" data-ocid="formbuilder.editor"></textarea>
            </div>
          </div>

          <!-- Properties Panel -->
          <div class="fb-props" id="fb-props">
            <h3>Properties</h3>
            <div class="fb-no-selection" id="fb-no-sel">Select a field to edit its properties</div>
            <div id="fb-prop-form" style="display:none;">
              <div class="form-group">
                <label>Label</label>
                <input type="text" class="form-control" id="fb-prop-label" oninput="fbUpdateProp('label')" placeholder="Field label">
              </div>
              <div class="form-group" id="fb-prop-placeholder-wrap">
                <label>Placeholder</label>
                <input type="text" class="form-control" id="fb-prop-placeholder" oninput="fbUpdateProp('placeholder')" placeholder="Placeholder text">
              </div>
              <div class="form-group">
                <label>Name (HTML)</label>
                <input type="text" class="form-control" id="fb-prop-name" oninput="fbUpdateProp('name')" placeholder="field_name">
              </div>
              <div class="form-group" id="fb-prop-required-wrap">
                <label style="display:flex; align-items:center; gap:8px; text-transform:none; letter-spacing:0; font-size:13px; cursor:pointer;">
                  <input type="checkbox" id="fb-prop-required" onchange="fbUpdateProp('required')"> Required field
                </label>
              </div>
              <div class="form-group" id="fb-prop-options-wrap" style="display:none;">
                <label>Options (one per line)</label>
                <textarea class="form-control" id="fb-prop-options" rows="4" oninput="fbUpdateProp('options')" placeholder="Option 1&#10;Option 2&#10;Option 3"></textarea>
              </div>
              <div class="form-group" id="fb-prop-btn-text-wrap" style="display:none;">
                <label>Button Text</label>
                <input type="text" class="form-control" id="fb-prop-btn-text" oninput="fbUpdateProp('btn_text')" placeholder="Submit">
              </div>
              <button class="btn btn-danger-outline btn-sm" onclick="fbDeleteSelected()" style="width:100%; margin-top:4px;" data-ocid="formbuilder.delete_button">🗑 Remove Field</button>
            </div>
          </div>
        </div>
      </div><!-- /tab-formbuilder -->

    </div><!-- /content-area -->
  </div><!-- /main -->
</div><!-- /layout -->

<!-- ══════════════════════════════════════════
     MODAL: ADD/EDIT QUESTION
══════════════════════════════════════════ -->
<div class="modal-overlay" id="question-modal-overlay" onclick="closeModal('question-modal-overlay')">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header">
      <div class="modal-title" id="question-modal-title">Add Question</div>
      <button class="modal-close" onclick="closeModal('question-modal-overlay')" data-ocid="question_modal.close_button">✕</button>
    </div>
    <div class="modal-body">
      <form id="question-form" enctype="multipart/form-data">
        <input type="hidden" id="q-edit-id" name="id" value="">

        <div class="form-grid">
          <div class="form-group">
            <label>Question Type <span class="required-star">*</span></label>
            <select class="form-control" name="type" id="q-type" onchange="toggleImageUpload(this.value)" data-ocid="question_modal.type_select">
              <option value="text">Text</option>
              <option value="image">Image</option>
            </select>
          </div>
          <div class="form-group">
            <label>Assign to Exam</label>
            <select class="form-control" name="exam_id" id="q-exam-id" data-ocid="question_modal.exam_select">
              <option value="">— Select Exam —</option>
            </select>
          </div>
        </div>

        <div class="form-group" id="image-upload-group" style="display:none;">
          <label>Question Image</label>
          <input type="file" class="form-control" name="image" id="q-image-input" accept="image/*" onchange="previewImage(this)">
          <div class="img-preview-wrap" id="q-image-preview" style="display:none;"></div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Question (English) <span class="required-star">*</span></label>
            <textarea class="form-control" name="question_en" id="q-question-en" rows="3" placeholder="Enter question in English…" required data-ocid="question_modal.question_en_input"></textarea>
          </div>
          <div class="form-group">
            <label>Question (Tamil)</label>
            <textarea class="form-control" name="question_ta" id="q-question-ta" rows="3" placeholder="தமிழில் கேள்வி உள்ளிடவும்…" data-ocid="question_modal.question_ta_input"></textarea>
          </div>
        </div>

        <div style="background:var(--gray-50); border-radius:var(--radius); padding:14px; margin-bottom:14px;">
          <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--gray-500); margin-bottom:10px;">Options (English)</p>
          <div class="form-grid">
            <div class="form-group"><label>Option A <span class="required-star">*</span></label><input class="form-control" name="option_a_en" id="q-opt-a-en" placeholder="Option A" required data-ocid="question_modal.option_a_en"></div>
            <div class="form-group"><label>Option B <span class="required-star">*</span></label><input class="form-control" name="option_b_en" id="q-opt-b-en" placeholder="Option B" required data-ocid="question_modal.option_b_en"></div>
            <div class="form-group"><label>Option C <span class="required-star">*</span></label><input class="form-control" name="option_c_en" id="q-opt-c-en" placeholder="Option C" required data-ocid="question_modal.option_c_en"></div>
            <div class="form-group"><label>Option D <span class="required-star">*</span></label><input class="form-control" name="option_d_en" id="q-opt-d-en" placeholder="Option D" required data-ocid="question_modal.option_d_en"></div>
          </div>
        </div>

        <div style="background:var(--gray-50); border-radius:var(--radius); padding:14px; margin-bottom:14px;">
          <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--gray-500); margin-bottom:10px;">Options (Tamil)</p>
          <div class="form-grid">
            <div class="form-group"><label>Option A (Tamil)</label><input class="form-control" name="option_a_ta" id="q-opt-a-ta" placeholder="விருப்பம் A"></div>
            <div class="form-group"><label>Option B (Tamil)</label><input class="form-control" name="option_b_ta" id="q-opt-b-ta" placeholder="விருப்பம் B"></div>
            <div class="form-group"><label>Option C (Tamil)</label><input class="form-control" name="option_c_ta" id="q-opt-c-ta" placeholder="விருப்பம் C"></div>
            <div class="form-group"><label>Option D (Tamil)</label><input class="form-control" name="option_d_ta" id="q-opt-d-ta" placeholder="விருப்பம் D"></div>
          </div>
        </div>

        <div class="form-group" style="max-width:200px;">
          <label>Correct Answer <span class="required-star">*</span></label>
          <select class="form-control" name="correct_answer" id="q-correct-answer" data-ocid="question_modal.correct_answer_select">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('question-modal-overlay')" data-ocid="question_modal.cancel_button">Cancel</button>
      <button class="btn btn-gold" onclick="saveQuestion()" data-ocid="question_modal.submit_button">💾 Save Question</button>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════
     MODAL: ADD EXAM
══════════════════════════════════════════ -->
<div class="modal-overlay" id="exam-modal-overlay" onclick="closeModal('exam-modal-overlay')">
  <div class="modal" style="max-width:500px;" onclick="event.stopPropagation()">
    <div class="modal-header">
      <div class="modal-title">New Exam</div>
      <button class="modal-close" onclick="closeModal('exam-modal-overlay')" data-ocid="exam_modal.close_button">✕</button>
    </div>
    <div class="modal-body">
      <form id="exam-form">
        <div class="form-group">
          <label>Exam Name <span class="required-star">*</span></label>
          <input class="form-control" name="name" id="exam-name" placeholder="e.g. Mathematics Test 2025" required data-ocid="exam_modal.name_input">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Date</label>
            <input type="date" class="form-control" name="date" id="exam-date" data-ocid="exam_modal.date_input">
          </div>
          <div class="form-group">
            <label>Time</label>
            <input type="time" class="form-control" name="time" id="exam-time" data-ocid="exam_modal.time_input">
          </div>
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input type="number" class="form-control" name="duration" id="exam-duration" value="60" min="1" data-ocid="exam_modal.duration_input">
          </div>
          <div class="form-group">
            <label>No. of Questions</label>
            <input type="number" class="form-control" name="num_questions" id="exam-num-questions" value="30" min="1" data-ocid="exam_modal.num_questions_input">
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('exam-modal-overlay')" data-ocid="exam_modal.cancel_button">Cancel</button>
      <button class="btn btn-gold" onclick="saveExam()" data-ocid="exam_modal.submit_button">✅ Create Exam</button>
    </div>
  </div>
</div>

<!-- Confirm Dialog -->
<div id="confirm-overlay" class="confirm-overlay" style="display:none;">
  <div class="confirm-box">
    <div class="confirm-icon">⚠️</div>
    <div class="confirm-title" id="confirm-title">Are you sure?</div>
    <div class="confirm-msg" id="confirm-msg">This action cannot be undone.</div>
    <div class="confirm-actions">
      <button class="btn btn-secondary" onclick="confirmCancel()" data-ocid="confirm.cancel_button">Cancel</button>
      <button class="btn btn-danger" onclick="confirmOk()" data-ocid="confirm.confirm_button">Delete</button>
    </div>
  </div>
</div>

<!-- Toast Container -->
<div class="toast-container" id="toast-container"></div>

<!-- Inline CSS for print -->
<style id="fb-preview-style"></style>

<script>
// ════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════
let allQuestions = [];
let allRegistrations = [];
let allResults = [];
let allExams = [];
let currentSettings = {};
let confirmCallback = null;

// Form Builder state
let fbFields = [];
let fbSelectedId = null;
let fbDragType = null;
let fbCounter = 0;

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();
  loadExams();
  loadSettings();
});

// ════════════════════════════════════════════════════════
//  TAB SWITCHING
// ════════════════════════════════════════════════════════
const tabMeta = {
  questions:    { title: 'Questions',    subtitle: 'Manage exam questions' },
  registrations:{ title: 'Registrations', subtitle: 'Student registrations' },
  results:      { title: 'Results',      subtitle: 'Exam results and scores' },
  exams:        { title: 'Exams',        subtitle: 'Custom exam management' },
  settings:     { title: 'Settings',     subtitle: 'SMS and configuration' },
  formbuilder:  { title: 'Form Builder', subtitle: 'Drag-and-drop form designer' },
};

function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  document.getElementById('topbar-title').textContent = tabMeta[name].title;
  document.getElementById('topbar-subtitle').textContent = tabMeta[name].subtitle;

  if (name === 'registrations' && allRegistrations.length === 0) loadRegistrations();
  if (name === 'results' && allResults.length === 0) loadResults();
  if (name === 'exams') loadExams();
  if (name === 'settings') loadSettings();
}

// ════════════════════════════════════════════════════════
//  API HELPER
// ════════════════════════════════════════════════════════
async function api(formData) {
  try {
    const res = await fetch('api.php', { method: 'POST', body: formData });
    return await res.json();
  } catch (e) {
    showToast('Network error: ' + e.message, 'error');
    return { success: false, error: e.message };
  }
}

async function apiGet(action) {
  try {
    const res = await fetch('api.php?action=' + action);
    return await res.json();
  } catch (e) {
    showToast('Network error: ' + e.message, 'error');
    return { success: false, error: e.message };
  }
}

function fd(action, data = {}) {
  const form = new FormData();
  form.append('action', action);
  for (const [k, v] of Object.entries(data)) form.append(k, v);
  return form;
}

// ════════════════════════════════════════════════════════
//  QUESTIONS
// ════════════════════════════════════════════════════════
async function loadQuestions() {
  const data = await apiGet('get_questions');
  if (!data.success) { showToast('Failed to load questions', 'error'); return; }
  allQuestions = data.questions || [];
  renderQuestionsTable(allQuestions);
  document.getElementById('q-count-label').textContent = allQuestions.length + ' questions total';
  populateExamDropdowns();
}

function renderQuestionsTable(questions) {
  const tbody = document.getElementById('questions-tbody');
  if (!questions.length) {
    tbody.innerHTML = '<tr class="empty-table-row"><td colspan="8">📭 No questions yet. Click "Add Question" to get started.</td></tr>';
    return;
  }
  tbody.innerHTML = questions.map((q, i) => `
    <tr data-ocid="questions.item.${i+1}">
      <td>${i+1}</td>
      <td><span class="badge badge-${q.type === 'image' ? 'image' : 'text'}">${q.type}</span></td>
      <td style="max-width:200px; white-space:normal; line-height:1.4;">${esc(q.question_en)}</td>
      <td style="max-width:180px; white-space:normal; line-height:1.4; font-family:'Noto Sans Tamil',sans-serif;">${esc(q.question_ta)}</td>
      <td style="font-size:11px;">
        <div>A: ${esc(q.option_a_en)}</div>
        <div>B: ${esc(q.option_b_en)}</div>
        <div>C: ${esc(q.option_c_en)}</div>
        <div>D: ${esc(q.option_d_en)}</div>
      </td>
      <td><span class="badge badge-success">${q.correct_answer}</span></td>
      <td style="font-size:12px;">${esc(q.exam_name || q.exam_id || '—')}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-secondary btn-icon btn-sm" title="Edit" onclick="openEditQuestion('${esc(q.id)}')" data-ocid="questions.edit_button.${i+1}">✏️</button>
          <button class="btn btn-danger btn-icon btn-sm" title="Delete" onclick="deleteQuestion('${esc(q.id)}')" data-ocid="questions.delete_button.${i+1}">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

function openAddQuestion() {
  document.getElementById('question-modal-title').textContent = 'Add Question';
  document.getElementById('question-form').reset();
  document.getElementById('q-edit-id').value = '';
  document.getElementById('q-image-preview').style.display = 'none';
  toggleImageUpload('text');
  populateExamDropdown(document.getElementById('q-exam-id'));
  openModal('question-modal-overlay');
}

function openEditQuestion(id) {
  const q = allQuestions.find(x => x.id === id);
  if (!q) return;
  document.getElementById('question-modal-title').textContent = 'Edit Question';
  document.getElementById('q-edit-id').value = q.id;
  document.getElementById('q-type').value = q.type;
  toggleImageUpload(q.type);
  setVal('q-question-en', q.question_en);
  setVal('q-question-ta', q.question_ta);
  setVal('q-opt-a-en', q.option_a_en);
  setVal('q-opt-b-en', q.option_b_en);
  setVal('q-opt-c-en', q.option_c_en);
  setVal('q-opt-d-en', q.option_d_en);
  setVal('q-opt-a-ta', q.option_a_ta);
  setVal('q-opt-b-ta', q.option_b_ta);
  setVal('q-opt-c-ta', q.option_c_ta);
  setVal('q-opt-d-ta', q.option_d_ta);
  setVal('q-correct-answer', q.correct_answer);
  populateExamDropdown(document.getElementById('q-exam-id'), q.exam_id);

  if (q.image_path) {
    const prev = document.getElementById('q-image-preview');
    prev.style.display = 'flex';
    prev.innerHTML = '<img src="../' + esc(q.image_path) + '" alt="Question image">';
  } else {
    document.getElementById('q-image-preview').style.display = 'none';
  }

  openModal('question-modal-overlay');
}

async function saveQuestion() {
  const form = document.getElementById('question-form');
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const editId = document.getElementById('q-edit-id').value;
  formData.append('action', editId ? 'edit_question' : 'add_question');
  const data = await api(formData);
  if (data.success) {
    showToast(editId ? 'Question updated!' : 'Question added!', 'success');
    closeModal('question-modal-overlay');
    loadQuestions();
  } else {
    showToast(data.error || 'Failed to save question', 'error');
  }
}

function deleteQuestion(id) {
  showConfirm('Delete Question', 'Are you sure you want to permanently delete this question?', async () => {
    const data = await api(fd('delete_question', { id }));
    if (data.success) { showToast('Question deleted.', 'success'); loadQuestions(); }
    else showToast(data.error || 'Failed to delete', 'error');
  });
}

function toggleImageUpload(type) {
  document.getElementById('image-upload-group').style.display = type === 'image' ? 'block' : 'none';
}

function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const prev = document.getElementById('q-image-preview');
  const reader = new FileReader();
  reader.onload = e => {
    prev.style.display = 'flex';
    prev.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
  };
  reader.readAsDataURL(file);
}

async function exportCSV() {
  window.location.href = 'api.php?action=export_questions';
}

async function downloadTemplate() {
  window.location.href = 'api.php?action=download_template';
}

async function importCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('action', 'import_questions');
  formData.append('csv', file);
  const data = await api(formData);
  if (data.success) {
    showToast('Imported ' + data.imported + ' question(s)!', 'success');
    loadQuestions();
  } else {
    showToast(data.error || 'Import failed', 'error');
  }
  input.value = '';
}

function printQuestions() {
  const win = window.open('', '_blank');
  const rows = allQuestions.map((q, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${esc(q.question_en)}</td>
      <td style="font-family:'Noto Sans Tamil',sans-serif">${esc(q.question_ta)}</td>
      <td>A: ${esc(q.option_a_en)}<br>B: ${esc(q.option_b_en)}<br>C: ${esc(q.option_c_en)}<br>D: ${esc(q.option_d_en)}</td>
      <td>${q.correct_answer}</td>
      <td>${esc(q.exam_name || q.exam_id || '')}</td>
    </tr>`).join('');

  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Questions — MKJC Exam Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body { font-family: Inter, 'Noto Sans Tamil', sans-serif; font-size:12px; padding:20px; }
      h2 { color:#0a1628; margin-bottom:16px; }
      table { width:100%; border-collapse:collapse; }
      th { background:#0a1628; color:#fff; padding:8px; text-align:left; font-size:11px; }
      td { padding:7px 8px; border-bottom:1px solid #e2e8f0; vertical-align:top; }
      tr:nth-child(even) { background:#f8fafc; }
    </style>
  </head><body>
    <h2>MKJC Exam Portal — Question Bank</h2>
    <p>Printed: ${new Date().toLocaleString()} | Total: ${allQuestions.length} questions</p>
    <table><thead><tr><th>#</th><th>Question (EN)</th><th>Question (TA)</th><th>Options</th><th>Answer</th><th>Exam</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </body></html>`);
  win.document.close();
  win.print();
}

// ════════════════════════════════════════════════════════
//  REGISTRATIONS
// ════════════════════════════════════════════════════════
async function loadRegistrations() {
  const data = await apiGet('get_registrations');
  if (!data.success) { showToast('Failed to load registrations', 'error'); return; }
  allRegistrations = data.registrations || [];
  renderRegistrationsTable(allRegistrations);
  document.getElementById('reg-count-label').textContent = allRegistrations.length + ' registrations total';
  populateExamFilter('reg-exam-filter', allRegistrations, 'exam_name');
}

function renderRegistrationsTable(regs) {
  const tbody = document.getElementById('registrations-tbody');
  if (!regs.length) {
    tbody.innerHTML = '<tr class="empty-table-row"><td colspan="10" data-ocid="registrations.empty_state">📭 No registrations found.</td></tr>';
    return;
  }
  tbody.innerHTML = regs.map((r, i) => `
    <tr data-ocid="registrations.item.${i+1}">
      <td>${i+1}</td>
      <td><code style="font-size:11px;">${esc(r.id)}</code></td>
      <td><strong>${esc(r.student_name)}</strong></td>
      <td>${esc(r.school)}</td>
      <td>${esc(r.group_studied)}</td>
      <td>${esc(r.contact)}</td>
      <td>${esc(r.exam_name || r.exam_id || '—')}</td>
      <td><code style="font-size:11px;">${esc(r.user_id)}</code></td>
      <td style="font-size:12px;">${esc(r.registered_at || '').split(' ')[0]}</td>
      <td>
        <button class="btn btn-danger btn-icon btn-sm" onclick="deleteRegistration('${esc(r.id)}')" data-ocid="registrations.delete_button.${i+1}">🗑</button>
      </td>
    </tr>`).join('');
}

function filterRegistrations() {
  const q = document.getElementById('reg-search').value.toLowerCase();
  const exam = document.getElementById('reg-exam-filter').value;
  const filtered = allRegistrations.filter(r => {
    const matchQ = !q || [r.student_name, r.school, r.contact, r.whatsapp].some(v => (v||'').toLowerCase().includes(q));
    const matchExam = !exam || r.exam_name === exam || r.exam_id === exam;
    return matchQ && matchExam;
  });
  renderRegistrationsTable(filtered);
}

function deleteRegistration(id) {
  showConfirm('Delete Registration', 'Remove this student registration permanently?', async () => {
    const data = await api(fd('delete_registration', { id }));
    if (data.success) { showToast('Registration deleted.', 'success'); loadRegistrations(); }
    else showToast(data.error || 'Failed', 'error');
  });
}

// ════════════════════════════════════════════════════════
//  RESULTS
// ════════════════════════════════════════════════════════
async function loadResults() {
  const data = await apiGet('get_results');
  if (!data.success) { showToast('Failed to load results', 'error'); return; }
  allResults = data.results || [];
  renderResultsTable(allResults);
  document.getElementById('res-count-label').textContent = allResults.length + ' results total';
  populateExamFilter('res-exam-filter', allResults, 'exam_name');
}

function renderResultsTable(results) {
  const tbody = document.getElementById('results-tbody');
  if (!results.length) {
    tbody.innerHTML = '<tr class="empty-table-row"><td colspan="9" data-ocid="results.empty_state">📭 No results yet.</td></tr>';
    return;
  }
  tbody.innerHTML = results.map((r, i) => {
    const pct = parseFloat(r.percentage) || 0;
    const badgeCls = pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger';
    return `
    <tr data-ocid="results.item.${i+1}">
      <td>${i+1}</td>
      <td><code style="font-size:11px;">${esc(r.id)}</code></td>
      <td><strong>${esc(r.student_name)}</strong></td>
      <td>${esc(r.exam_name || r.exam_id || '—')}</td>
      <td>${r.score}</td>
      <td>${r.total}</td>
      <td><span class="badge ${badgeCls}">${pct}%</span></td>
      <td style="font-size:12px;">${esc(r.submitted_at || '').split(' ')[0]}</td>
      <td>
        <button class="btn btn-danger btn-icon btn-sm" onclick="deleteResult('${esc(r.id)}')" data-ocid="results.delete_button.${i+1}">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function filterResults() {
  const q = document.getElementById('res-search').value.toLowerCase();
  const exam = document.getElementById('res-exam-filter').value;
  const filtered = allResults.filter(r => {
    const matchQ = !q || (r.student_name||'').toLowerCase().includes(q);
    const matchExam = !exam || r.exam_name === exam || r.exam_id === exam;
    return matchQ && matchExam;
  });
  renderResultsTable(filtered);
}

function deleteResult(id) {
  showConfirm('Delete Result', 'Remove this result record permanently?', async () => {
    const data = await api(fd('delete_result', { id }));
    if (data.success) { showToast('Result deleted.', 'success'); loadResults(); }
    else showToast(data.error || 'Failed', 'error');
  });
}

// ════════════════════════════════════════════════════════
//  EXAMS
// ════════════════════════════════════════════════════════
async function loadExams() {
  const data = await apiGet('get_exams');
  if (!data.success) { showToast('Failed to load exams', 'error'); return; }
  allExams = data.exams || [];
  renderExamsTable(allExams);
  document.getElementById('exam-count-label').textContent = allExams.length + ' exams configured';
  populateExamDropdowns();
}

function renderExamsTable(exams) {
  const tbody = document.getElementById('exams-tbody');
  if (!exams.length) {
    tbody.innerHTML = '<tr class="empty-table-row"><td colspan="8" data-ocid="exams.empty_state">📭 No exams yet. Click "New Exam" to create one.</td></tr>';
    return;
  }
  tbody.innerHTML = exams.map((e, i) => `
    <tr data-ocid="exams.item.${i+1}">
      <td><code style="font-size:11px; color:var(--navy);">${esc(e.id)}</code></td>
      <td><strong>${esc(e.name)}</strong></td>
      <td>${esc(e.date) || '—'}</td>
      <td>${esc(e.time) || '—'}</td>
      <td>${e.duration} min</td>
      <td>${e.num_questions}</td>
      <td style="font-size:12px;">${esc(e.created_at||'').split(' ')[0]}</td>
      <td>
        <button class="btn btn-danger btn-icon btn-sm" onclick="deleteExam('${esc(e.id)}')" data-ocid="exams.delete_button.${i+1}">🗑</button>
      </td>
    </tr>`).join('');
}

function openAddExam() {
  document.getElementById('exam-form').reset();
  openModal('exam-modal-overlay');
}

async function saveExam() {
  const name = document.getElementById('exam-name').value.trim();
  if (!name) { showToast('Exam name is required', 'error'); return; }
  const formData = new FormData(document.getElementById('exam-form'));
  formData.append('action', 'add_exam');
  const data = await api(formData);
  if (data.success) {
    showToast('Exam "' + name + '" created!', 'success');
    closeModal('exam-modal-overlay');
    loadExams();
  } else {
    showToast(data.error || 'Failed to create exam', 'error');
  }
}

function deleteExam(id) {
  const exam = allExams.find(e => e.id === id);
  showConfirm('Delete Exam', 'Delete "' + (exam ? exam.name : id) + '"? This will not delete questions assigned to it.', async () => {
    const data = await api(fd('delete_exam', { id }));
    if (data.success) { showToast('Exam deleted.', 'success'); loadExams(); }
    else showToast(data.error || 'Failed', 'error');
  });
}

function populateExamDropdown(select, selectedId = '') {
  select.innerHTML = '<option value="">— Select Exam —</option>';
  allExams.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = e.name;
    if (e.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  });
}

function populateExamDropdowns() {
  populateExamDropdown(document.getElementById('q-exam-id'));
}

function populateExamFilter(selectId, items, field) {
  const sel = document.getElementById(selectId);
  const current = sel.value;
  const names = [...new Set(items.map(i => i[field]).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">All Exams</option>';
  names.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = n;
    if (n === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════
async function loadSettings() {
  const data = await apiGet('get_settings');
  if (!data.success) return;
  currentSettings = data.settings || {};
  const s = currentSettings;

  document.getElementById('api-key-input').value = s.fast2sms_api_key || '';
  document.getElementById('stat-sms-sent').textContent = s.sms_sent || 0;
  document.getElementById('stat-sms-failed').textContent = s.sms_failed || 0;
  const cost = ((s.sms_sent || 0) * (s.sms_cost_per || 0.18)).toFixed(2);
  document.getElementById('stat-sms-cost').textContent = '₹' + cost;

  const hasKey = !!(s.fast2sms_api_key && s.fast2sms_api_key.length > 5);
  document.getElementById('stat-api-status').innerHTML =
    '<span class="status-dot status-dot-' + (hasKey ? 'green' : 'red') + '"></span>' +
    (hasKey ? 'Active' : 'Inactive');
}

async function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  const data = await api(fd('save_settings', { fast2sms_api_key: key }));
  if (data.success) {
    showToast('API key saved!', 'success');
    loadSettings();
  } else {
    showToast(data.error || 'Failed to save', 'error');
  }
}

function toggleApiKeyVisibility() {
  const inp = document.getElementById('api-key-input');
  const btn = document.getElementById('api-key-toggle');
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

async function sendTestSms() {
  const phone = document.getElementById('test-phone').value.trim();
  const msg = document.getElementById('test-msg').value.trim();
  if (!phone || phone.length !== 10) { showToast('Enter a valid 10-digit mobile number', 'error'); return; }
  const data = await api(fd('test_sms', { phone, message: msg }));
  if (data.success) { showToast(data.message || 'Test SMS sent!', 'success'); loadSettings(); }
  else showToast(data.error || 'SMS failed', 'error');
}

// ════════════════════════════════════════════════════════
//  FORM BUILDER
// ════════════════════════════════════════════════════════
const fbThemes = {
  light: `body{background:#f8fafc;font-family:Inter,sans-serif} form{background:#fff;padding:28px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.08);max-width:600px;margin:40px auto} label{display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#334155} input,textarea,select{width:100%;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:6px;font-size:14px;outline:none;margin-bottom:14px;font-family:inherit} input:focus,textarea:focus,select:focus{border-color:#c9a227} button[type=submit]{background:#0a1628;color:#fff;padding:10px 24px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer}`,
  dark: `body{background:#0f172a;font-family:Inter,sans-serif} form{background:#1e293b;padding:28px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.4);max-width:600px;margin:40px auto;color:#e2e8f0} label{display:block;font-size:13px;font-weight:600;margin-bottom:4px;color:#94a3b8} input,textarea,select{width:100%;padding:9px 12px;border:1.5px solid #334155;border-radius:6px;font-size:14px;background:#0f172a;color:#e2e8f0;outline:none;margin-bottom:14px;font-family:inherit} input:focus,textarea:focus,select:focus{border-color:#c9a227} button[type=submit]{background:#c9a227;color:#0a1628;padding:10px 24px;border:none;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer}`,
  modern: `body{background:linear-gradient(135deg,#0a1628,#1e3560);min-height:100vh;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center} form{background:rgba(255,255,255,.97);padding:32px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);max-width:560px;width:100%} label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;color:#475569} input,textarea,select{width:100%;padding:10px 14px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;margin-bottom:16px;transition:border-color .2s;font-family:inherit} input:focus,textarea:focus,select:focus{border-color:#c9a227;box-shadow:0 0 0 3px rgba(201,162,39,.12)} button[type=submit]{background:linear-gradient(135deg,#0a1628,#1e3560);color:#fff;padding:12px 28px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;width:100%}`,
  minimal: `body{background:#fff;font-family:Inter,sans-serif} form{max-width:520px;margin:48px auto;padding:0 20px} label{display:block;font-size:13px;font-weight:500;margin-bottom:5px;color:#64748b} input,textarea,select{width:100%;padding:8px 0;border:none;border-bottom:2px solid #e2e8f0;font-size:15px;outline:none;margin-bottom:20px;font-family:inherit;background:transparent} input:focus,textarea:focus,select:focus{border-color:#0a1628} button[type=submit]{background:transparent;color:#0a1628;padding:10px 24px;border:2px solid #0a1628;font-size:14px;font-weight:600;cursor:pointer}`,
};
let activeTheme = 'light';

function applyTheme(name, btn) {
  activeTheme = name;
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyCssPreview();
}

function applyCssPreview() {
  const custom = document.getElementById('fb-css-editor').value;
  document.getElementById('fb-preview-style').textContent = fbThemes[activeTheme] + '\n' + custom;
}

function fbDragStart(e) {
  fbDragType = e.currentTarget.dataset.type;
  e.dataTransfer.effectAllowed = 'copy';
}

function fbDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  document.getElementById('fb-canvas').classList.add('drag-over');
}

function fbDragLeave(e) {
  document.getElementById('fb-canvas').classList.remove('drag-over');
}

function fbDrop(e) {
  e.preventDefault();
  document.getElementById('fb-canvas').classList.remove('drag-over');
  if (!fbDragType) return;
  addFbField(fbDragType);
  fbDragType = null;
}

function addFbField(type) {
  const id = 'fb-field-' + (++fbCounter);
  const defaults = {
    id, type,
    label: type === 'button' ? 'Submit' : labelFor(type),
    placeholder: type === 'button' ? '' : 'Enter ' + labelFor(type).toLowerCase(),
    name: type + '_' + fbCounter,
    required: false,
    options: type === 'select' ? 'Option 1\nOption 2\nOption 3' :
             type === 'radio' ? 'Choice 1\nChoice 2' : '',
    btn_text: 'Submit',
  };
  fbFields.push(defaults);
  renderFbCanvas();
  selectFbField(id);
}

function labelFor(type) {
  const m = { text:'Text Input', email:'Email Address', password:'Password', number:'Number',
               textarea:'Message', select:'Select Option', checkbox:'I agree', radio:'Choose Option',
               date:'Date', file:'Upload File', button:'Button' };
  return m[type] || type;
}

function renderFbCanvas() {
  const canvas = document.getElementById('fb-canvas');
  const empty = document.getElementById('fb-empty-msg');

  if (!fbFields.length) {
    empty.style.display = 'flex';
    // Remove all fb-field divs
    canvas.querySelectorAll('.fb-field').forEach(f => f.remove());
    return;
  }
  empty.style.display = 'none';

  // Remove old fields
  canvas.querySelectorAll('.fb-field').forEach(f => f.remove());

  fbFields.forEach(f => {
    const div = document.createElement('div');
    div.className = 'fb-field' + (f.id === fbSelectedId ? ' selected' : '');
    div.dataset.id = f.id;
    div.onclick = () => selectFbField(f.id);

    const actionsHtml = `<div class="fb-field-actions">
      <button onclick="event.stopPropagation(); fbMoveUp('${f.id}')">▲</button>
      <button onclick="event.stopPropagation(); fbMoveDown('${f.id}')">▼</button>
      <button class="del-btn" onclick="event.stopPropagation(); fbDeleteField('${f.id}')">✕</button>
    </div>`;

    let fieldHtml = '';
    if (f.type === 'textarea') {
      fieldHtml = `<label class="fb-field-label">${esc(f.label)}${f.required ? ' *' : ''}</label>
        <textarea placeholder="${esc(f.placeholder)}" rows="3"></textarea>`;
    } else if (f.type === 'select') {
      const opts = (f.options||'').split('\n').map(o => `<option>${esc(o.trim())}</option>`).join('');
      fieldHtml = `<label class="fb-field-label">${esc(f.label)}${f.required ? ' *' : ''}</label>
        <select>${opts}</select>`;
    } else if (f.type === 'checkbox') {
      fieldHtml = `<label class="fb-field-label" style="display:flex;gap:6px;align-items:center;">
        <input type="checkbox"> ${esc(f.label)}</label>`;
    } else if (f.type === 'radio') {
      const opts = (f.options||'').split('\n').map((o,i) =>
        `<label style="display:flex;gap:6px;align-items:center;margin-bottom:4px;font-weight:400;">
          <input type="radio" name="${esc(f.name)}"> ${esc(o.trim())}</label>`).join('');
      fieldHtml = `<span class="fb-field-label">${esc(f.label)}${f.required ? ' *' : ''}</span>${opts}`;
    } else if (f.type === 'button') {
      fieldHtml = `<button type="button" style="padding:9px 22px;background:#0a1628;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:default;">${esc(f.btn_text)}</button>`;
    } else {
      fieldHtml = `<label class="fb-field-label">${esc(f.label)}${f.required ? ' *' : ''}</label>
        <input type="${f.type}" placeholder="${esc(f.placeholder)}">`;
    }

    div.innerHTML = actionsHtml + fieldHtml;
    canvas.appendChild(div);
  });
}

function selectFbField(id) {
  fbSelectedId = id;
  renderFbCanvas();
  const f = fbFields.find(x => x.id === id);
  if (!f) return;

  document.getElementById('fb-no-sel').style.display = 'none';
  document.getElementById('fb-prop-form').style.display = 'block';
  setVal('fb-prop-label', f.label);
  setVal('fb-prop-placeholder', f.placeholder);
  setVal('fb-prop-name', f.name);
  document.getElementById('fb-prop-required').checked = f.required;

  const isOptions = f.type === 'select' || f.type === 'radio';
  document.getElementById('fb-prop-options-wrap').style.display = isOptions ? 'block' : 'none';
  document.getElementById('fb-prop-placeholder-wrap').style.display = (f.type === 'button' || f.type === 'checkbox') ? 'none' : 'block';
  document.getElementById('fb-prop-btn-text-wrap').style.display = f.type === 'button' ? 'block' : 'none';

  if (isOptions) setVal('fb-prop-options', f.options);
  if (f.type === 'button') setVal('fb-prop-btn-text', f.btn_text);
}

function fbUpdateProp(prop) {
  const f = fbFields.find(x => x.id === fbSelectedId);
  if (!f) return;
  if (prop === 'label') f.label = document.getElementById('fb-prop-label').value;
  if (prop === 'placeholder') f.placeholder = document.getElementById('fb-prop-placeholder').value;
  if (prop === 'name') f.name = document.getElementById('fb-prop-name').value;
  if (prop === 'required') f.required = document.getElementById('fb-prop-required').checked;
  if (prop === 'options') f.options = document.getElementById('fb-prop-options').value;
  if (prop === 'btn_text') f.btn_text = document.getElementById('fb-prop-btn-text').value;
  renderFbCanvas();
}

function fbDeleteSelected() {
  if (!fbSelectedId) return;
  fbDeleteField(fbSelectedId);
}

function fbDeleteField(id) {
  fbFields = fbFields.filter(f => f.id !== id);
  if (fbSelectedId === id) {
    fbSelectedId = null;
    document.getElementById('fb-no-sel').style.display = 'block';
    document.getElementById('fb-prop-form').style.display = 'none';
  }
  renderFbCanvas();
}

function fbMoveUp(id) {
  const idx = fbFields.findIndex(f => f.id === id);
  if (idx <= 0) return;
  [fbFields[idx-1], fbFields[idx]] = [fbFields[idx], fbFields[idx-1]];
  renderFbCanvas();
}

function fbMoveDown(id) {
  const idx = fbFields.findIndex(f => f.id === id);
  if (idx >= fbFields.length - 1) return;
  [fbFields[idx], fbFields[idx+1]] = [fbFields[idx+1], fbFields[idx]];
  renderFbCanvas();
}

function clearCanvas() {
  fbFields = [];
  fbSelectedId = null;
  document.getElementById('fb-no-sel').style.display = 'block';
  document.getElementById('fb-prop-form').style.display = 'none';
  renderFbCanvas();
}

function exportFormHtml() {
  if (!fbFields.length) { showToast('Add some fields first', 'error'); return; }
  const customCss = document.getElementById('fb-css-editor').value;
  const themeCss = fbThemes[activeTheme] || fbThemes.light;

  let formContent = fbFields.map(f => {
    const reqAttr = f.required ? ' required' : '';
    if (f.type === 'textarea')
      return `  <div class="form-group"><label for="${f.name}">${esc(f.label)}</label><textarea id="${f.name}" name="${f.name}" placeholder="${esc(f.placeholder)}"${reqAttr}></textarea></div>`;
    if (f.type === 'select') {
      const opts = (f.options||'').split('\n').map(o => `    <option value="${esc(o.trim())}">${esc(o.trim())}</option>`).join('\n');
      return `  <div class="form-group"><label for="${f.name}">${esc(f.label)}</label><select id="${f.name}" name="${f.name}"${reqAttr}>\n${opts}\n  </select></div>`;
    }
    if (f.type === 'checkbox')
      return `  <div class="form-group"><label><input type="checkbox" id="${f.name}" name="${f.name}"${reqAttr}> ${esc(f.label)}</label></div>`;
    if (f.type === 'radio') {
      const opts = (f.options||'').split('\n').map((o,i) =>
        `    <label><input type="radio" name="${f.name}" value="${esc(o.trim())}"${reqAttr}> ${esc(o.trim())}</label>`).join('\n');
      return `  <div class="form-group"><fieldset><legend>${esc(f.label)}</legend>\n${opts}\n  </fieldset></div>`;
    }
    if (f.type === 'button')
      return `  <div class="form-group"><button type="submit">${esc(f.btn_text || 'Submit')}</button></div>`;
    return `  <div class="form-group"><label for="${f.name}">${esc(f.label)}</label><input type="${f.type}" id="${f.name}" name="${f.name}" placeholder="${esc(f.placeholder)}"${reqAttr}></div>`;
  }).join('\n');

  const validationJs = `// Form Validation
document.getElementById('myForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const fields = this.querySelectorAll('[required]');
  let valid = true;
  fields.forEach(f => {
    if (!f.value.trim()) {
      f.style.borderColor = 'red';
      valid = false;
    } else {
      f.style.borderColor = '';
    }
  });
  if (valid) {
    alert('Form submitted successfully!');
    this.reset();
  } else {
    alert('Please fill in all required fields.');
  }
});`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Form</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Sans+Tamil&display=swap" rel="stylesheet">
  <style>
/* === Theme: ${activeTheme} === */
${themeCss}

/* === Custom CSS === */
${customCss}
  </style>
</head>
<body>
<form id="myForm">
${formContent}
</form>
<script>
${validationJs}
<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'form_export.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Form exported as HTML!', 'success');
}

// ════════════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
    if (document.getElementById('confirm-overlay').style.display !== 'none') confirmCancel();
  }
});

// ════════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ════════════════════════════════════════════════════════
function showConfirm(title, msg, cb) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-overlay').style.display = 'flex';
  confirmCallback = cb;
}

function confirmOk() {
  document.getElementById('confirm-overlay').style.display = 'none';
  if (confirmCallback) confirmCallback();
  confirmCallback = null;
}

function confirmCancel() {
  document.getElementById('confirm-overlay').style.display = 'none';
  confirmCallback = null;
}

// ════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '📢'}</span> ${esc(msg)}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// ════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
</script>
</body>
</html>
