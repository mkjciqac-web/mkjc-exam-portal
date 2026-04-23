========================================
MKJC EXAM PORTAL — ADMIN DASHBOARD
========================================
Version: 1.0
PHP + HTML + CSS + JS (No frameworks)
Data: Flat JSON files (no MySQL needed)
========================================

INSTALLATION INSTRUCTIONS
--------------------------

1. UPLOAD FILES
   Upload the entire "admin" folder to your PHP hosting via FTP or File Manager.
   Recommended path: /public_html/admin/ or /htdocs/admin/

2. SET FOLDER PERMISSIONS
   Set the following folders to be writable (chmod 755 or 777):
     - admin/data/
     - admin/uploads/

   In cPanel File Manager: right-click folder → Permissions → set to 755

3. ACCESS THE DASHBOARD
   Visit: https://yourdomain.com/admin/
   Login:
     Username: admin
     Password: staff@318

4. FIRST-TIME SETUP
   On first load, the system auto-creates these JSON data files:
     - data/questions.json
     - data/registrations.json
     - data/results.json
     - data/exams.json
     - data/settings.json

   Sample exam data is pre-loaded so the dashboard looks populated.

5. FAST2SMS SETUP (for SMS delivery)
   - Go to Admin Dashboard → Settings tab
   - Enter your Fast2SMS API key
   - Click Save Settings
   - Use "Test SMS" to verify delivery
   - Get API key at: https://www.fast2sms.com

========================================

FILE STRUCTURE
--------------
admin/
├── index.php           ← Login page
├── dashboard.php       ← Main admin dashboard (all tabs)
├── api.php             ← AJAX API handler (CRUD + CSV)
├── logout.php          ← Session logout
├── assets/
│   └── style.css       ← Complete CSS styling
├── data/               ← JSON flat-file database (auto-created)
│   ├── .htaccess       ← Blocks direct access to data folder
│   ├── questions.json
│   ├── registrations.json
│   ├── results.json
│   ├── exams.json
│   └── settings.json
├── uploads/            ← Question images (auto-created)
│   └── .htaccess       ← Allows only image files
└── README.txt          ← This file

========================================

FEATURES
--------
✅ Session-based admin login (admin / staff@318)
✅ Questions Tab: Add/Edit/Delete questions (text or image)
✅ CSV Import/Export with UTF-8 BOM (Tamil text support)
✅ Downloadable CSV template
✅ Print question paper
✅ Registrations Tab: View, search, filter, delete
✅ Results Tab: View, search, filter, delete
✅ Exams Tab: Create custom exams with auto-generated IDs (EXAM-001...)
✅ Settings Tab: Fast2SMS API key, SMS stats, recharge links
✅ Form Builder Tab: Drag-and-drop form designer with export
✅ No MySQL required — uses flat JSON files
✅ Tamil language support (Noto Sans Tamil font)
✅ Fully responsive design

========================================

CSV IMPORT FORMAT
-----------------
The CSV template has these columns:
type, question_en, question_ta, option_a_en, option_b_en, option_c_en, option_d_en,
option_a_ta, option_b_ta, option_c_ta, option_d_ta, correct_answer, exam_id

- type: "text" or "image"
- correct_answer: "A", "B", "C", or "D"
- Tamil text: save CSV as "UTF-8 (Comma delimited)" in Excel

========================================

HOSTING COMPATIBILITY
---------------------
Tested and compatible with:
- InfinityFree (https://infinityfree.net)
- 000webhost (https://www.000webhost.com)
- AwardSpace (https://www.awardspace.com)
- Any standard cPanel PHP hosting

Requirements:
- PHP 7.0 or higher
- PHP json extension (enabled by default)
- PHP fileinfo extension (for image upload)
- Writable data/ and uploads/ directories

========================================

SUPPORT
-------
MKJC Scholarship Exam Portal
Built with ❤️ using caffeine.ai

========================================
