const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exec";

// --- 1. Event Listener เริ่มต้นเมื่อโหลดหน้าเว็บ ---
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) dateInput.valueAsDate = new Date();

  if (document.getElementById('dashSelectedDate')) {
    document.getElementById('dashSelectedDate').value = today;
  }
  if (document.getElementById('dashSelectedMonth')) {
    document.getElementById('dashSelectedMonth').value = currentMonth;
  }
  if (document.getElementById('printMonthSelect')) {
    document.getElementById('printMonthSelect').value = currentMonth;
  }

  // ดึงรายชื่อห้องเรียนมาใส่ Dropdown สำหรับหน้าพิมพ์รายงาน
  fetchClassList();
});

// --- 2. ฟังก์ชันเช็คชื่อนักเรียน (Attendance) ---
function loadStudentList() {
  const className = document.getElementById('classSelect').value;
  const attendanceDate = document.getElementById('attendanceDate').value;
  const tbody = document.getElementById('studentTableBody');

  if (!attendanceDate) {
    Swal.fire({
      icon: 'warning',
      title: 'แจ้งเตือน',
      text: 'กรุณาเลือกวันที่บันทึกกิจกรรมก่อนครับ',
      confirmButtonColor: '#4f46e5'
    });
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="3" class="text-center py-5">
        <div class="spinner-border text-primary me-2" role="status"></div>
        <span class="fs-6 text-secondary">กำลังตรวจสอบประวัติและดึงข้อมูล...</span>
      </td>
    </tr>`;

  const oldScript = document.getElementById('jsonp-script');
  if (oldScript) oldScript.remove();

  const timer = setTimeout(() => {
    const s = document.getElementById('jsonp-script');
    if (s) s.remove();
    Swal.fire({
      icon: 'error',
      title: 'ดึงข้อมูลใช้เวลานานเกินไป',
      text: 'กรุณาเช็กว่าได้กด Deploy ใน Apps Script เป็น "เวอร์ชันใหม่" แล้วหรือยังครับ',
      confirmButtonColor: '#4f46e5'
    });
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">❌ ดึงข้อมูลล้มเหลว (Timeout)</td></tr>`;
  }, 12000);

  window.renderStudentTable = function(response) {
    clearTimeout(timer);
    
    if (!response || response.status === "error") {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: response ? response.message : 'ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์',
        confirmButtonColor: '#4f46e5'
      });
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">❌ เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
      return;
    }

    const students = response.data;
    if (!students || students.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่พบข้อมูล',
        text: 'ไม่พบรายชื่อนักเรียนในระดับชั้นนี้',
        confirmButtonColor: '#4f46e5'
      });
      tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-warning">⚠️ ไม่พบรายชื่อนักเรียนในระดับชั้นนี้</td></tr>`;
      return;
    }

    let html = '';
    students.forEach((student, index) => {
      const isPresent = student.status === "เข้าร่วม/มาเรียน" ? "checked" : "";
      const isLate = student.status === "ไม่เข้าร่วม/มาเรียน (สาย)" ? "checked" : "";
      const isAbsent = (student.status === "ไม่มาเรียน" || !student.status) ? "checked" : "";

      html += `
        <tr>
          <td class="text-center fw-bold text-secondary">${student.no}</td>
          <td class="fw-medium">${student.name}</td>
          <td class="text-center">
            <div class="btn-group w-100 status-group" role="group">
              <input type="radio" class="btn-check" name="status_${index}" id="present_${index}" value="เข้าร่วม/มาเรียน" ${isPresent}>
              <label class="btn btn-outline-success" for="present_${index}">
                <i class="fa-solid fa-circle-check me-1"></i>เข้าร่วม/มาเรียน
              </label>

              <input type="radio" class="btn-check" name="status_${index}" id="late_${index}" value="ไม่เข้าร่วม/มาเรียน (สาย)" ${isLate}>
              <label class="btn btn-outline-warning" for="late_${index}">
                <i class="fa-solid fa-clock me-1"></i>ไม่เข้าร่วม/มาเรียน (สาย)
              </label>

              <input type="radio" class="btn-check" name="status_${index}" id="absent_${index}" value="ไม่มาเรียน" ${isAbsent}>
              <label class="btn btn-outline-danger" for="absent_${index}">
                <i class="fa-solid fa-circle-xmark me-1"></i>ไม่มาเรียน
              </label>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    Toast.fire({
      icon: 'success',
      title: `ดึงข้อมูลสำเร็จ ${students.length} รายการ`
    });
  };

  const script = document.createElement('script');
  script.id = 'jsonp-script';
  script.src = `${WEB_APP_URL}?action=getStudents&className=${encodeURIComponent(className)}&date=${encodeURIComponent(attendanceDate)}&callback=renderStudentTable`;

  script.onerror = function () {
    clearTimeout(timer);
    Swal.fire({
      icon: 'error',
      title: 'เชื่อมต่อล้มเหลว',
      text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้',
      confirmButtonColor: '#4f46e5'
    });
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้</td></tr>`;
  };

  document.body.appendChild(script);
}

async function submitAttendance() {
  const date = document.getElementById('attendanceDate').value;
  const className = document.getElementById('classSelect').value;
  const tbody = document.getElementById('studentTableBody');
  const rows = tbody.querySelectorAll('tr');

  if (rows.length === 0 || document.getElementById('statusMessage')) {
    Swal.fire({
      icon: 'info',
      title: 'แจ้งเตือน',
      text: 'กรุณากดดึงรายชื่อนักเรียนก่อนทำการบันทึกครับ',
      confirmButtonColor: '#4f46e5'
    });
    return;
  }

  let attendanceData = [];
  rows.forEach((row, index) => {
    const no = row.cells[0]?.innerText;
    const name = row.cells[1]?.innerText;
    const statusRadio = document.querySelector(`input[name="status_${index}"]:checked`);

    if (no && name) {
      attendanceData.push({
        date: date,
        no: no,
        name: name,
        className: className,
        status: statusRadio ? statusRadio.value : "ไม่มาเรียน"
      });
    }
  });

  const result = await Swal.fire({
    title: 'ยืนยันการบันทึก?',
    text: `ต้องการบันทึก/อัปเดตข้อมูลการเช็คชื่อ ${className} วันที่ ${date} ใช่หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ใช่, บันทึกเลย!',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'กรุณารอสักครู่ ระบบกำลังอัปเดตข้อมูลลง Google Sheets',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const response = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveAttendance",
          records: attendanceData
        })
      });

      const res = await response.json();
      if (res.status === "success") {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: res.message,
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'บันทึกไม่สำเร็จ',
          text: res.message,
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message,
        confirmButtonColor: '#ef4444'
      });
    }
  }
}

// --- 3. การจัดการรายชื่อนักเรียน (Manage Students) ---
function fetchStudentManageList() {
  const selectedClass = document.getElementById('manageClassSelect').value;
  const tbody = document.getElementById('manageStudentTableBody');

  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>`;

  const script = document.createElement('script');
  script.src = `${WEB_APP_URL}?action=getAllStudents&className=${encodeURIComponent(selectedClass)}&callback=renderManageStudentTable`;
  document.body.appendChild(script);
}

function renderManageStudentTable(response) {
  const tbody = document.getElementById('manageStudentTableBody');
  if (!response || response.status !== "success") {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    return;
  }

  const students = response.data;
  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">ไม่พบข้อมูลนักเรียน</td></tr>`;
    return;
  }

  let html = '';
  students.forEach(std => {
    html += `
      <tr>
        <td><span class="badge bg-info text-dark">${std.className}</span></td>
        <td class="fw-bold">${std.no}</td>
        <td>${std.name}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-warning me-1" onclick="editStudent('${std.no}', '${std.name}', '${std.className}')">
            <i class="fa-solid fa-pen-to-square"></i> แก้ไข
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteStudent('${std.no}', '${std.className}', '${std.name}')">
            <i class="fa-solid fa-trash"></i> ลบ
          </button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function openAddStudentModal() {
  Swal.fire({
    title: '➕ เพิ่มนักเรียนใหม่',
    html: `
      <div class="text-start mb-2"><small class="fw-bold">เลือกระดับชั้น:</small></div>
      <select id="swal-class" class="swal2-select w-100 m-0 mb-3">
        <optgroup label="ระดับประถมศึกษา">
          <option value="ป.1">ประถมศึกษาปีที่ 1 (ป.1)</option>
          <option value="ป.2">ประถมศึกษาปีที่ 2 (ป.2)</option>
          <option value="ป.3">ประถมศึกษาปีที่ 3 (ป.3)</option>
          <option value="ป.4">ประถมศึกษาปีที่ 4 (ป.4)</option>
          <option value="ป.5">ประถมศึกษาปีที่ 5 (ป.5)</option>
          <option value="ป.6">ประถมศึกษาปีที่ 6 (ป.6)</option>
        </optgroup>
        <optgroup label="ระดับมัธยมศึกษาตอนต้น">
          <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
          <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
          <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
        </optgroup>
      </select>

      <div class="text-start mb-2"><small class="fw-bold">เลขที่:</small></div>
      <input id="swal-no" type="number" class="swal2-input w-100 m-0 mb-3" placeholder="เช่น 1, 2, 3">

      <div class="text-start mb-2"><small class="fw-bold">ชื่อ - นามสกุล:</small></div>
      <input id="swal-name" class="swal2-input w-100 m-0" placeholder="เช่น เด็กชายเด็กดี มีวินัย">
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'บันทึกข้อมูล',
    cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      const className = document.getElementById('swal-class').value;
      const no = document.getElementById('swal-no').value.trim();
      const name = document.getElementById('swal-name').value.trim();

      if (!no || !name) {
        Swal.showValidationMessage('กรุณากรอกเลขที่และชื่อ-นามสกุลให้ครบถ้วนครับ');
        return false;
      }

      // ดึงตารางปัจจุบันมาเช็คความซ้ำซ้อนเบื้องต้น
      const rows = document.querySelectorAll('#manageStudentTableBody tr');
      let isDuplicateNo = false;
      let isDuplicateName = false;

      rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 3) {
          const rowClass = cols[0].innerText.trim();
          const rowNo = cols[1].innerText.trim();
          const rowName = cols[2].innerText.trim();

          if (rowClass === className) {
            if (rowNo === no) isDuplicateNo = true;
            if (rowName === name) isDuplicateName = true;
          }
        }
      });

      if (isDuplicateNo) {
        Swal.showValidationMessage(`เลขที่ ${no} ในชั้น ${className} มีในระบบแล้วครับ`);
        return false;
      }
      if (isDuplicateName) {
        Swal.showValidationMessage(`นักเรียนชื่อ "${name}" มีอยู่ในชั้น ${className} แล้วครับ`);
        return false;
      }

      return { no, name, className };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      saveStudentData('addStudent', { student: result.value });
    }
  });
}

function confirmDeleteStudent(no, className, name) {
  Swal.fire({
    title: 'ยืนยันการลบ?',
    text: `ต้องการลบ ${name} (${className} เลขที่ ${no}) ออกจากระบบหรือไม่?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก'
  }).then((result) => {
    if (result.isConfirmed) {
      saveStudentData('deleteStudent', { studentNo: no, className: className });
    }
  });
}

// ฟังก์ชันหลักในการบันทึก/เพิ่ม/ลบ ข้อมูลนักเรียน
async function saveStudentData(action, payload) {
  Swal.fire({
    title: 'กำลังบันทึกข้อมูล...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, ...payload })
    });
    const result = await response.json();

    if (result.status === "success" || result.success) {
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: result.message || 'บันทึกข้อมูลเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
      fetchStudentManageList();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถบันทึกได้',
        text: result.message
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
    });
  }
}

// --- 4. พิมพ์แบบฟอร์มรายชื่อนักเรียน ---
function printStudentList() {
  let selectedClassText = '';
  const classSelect = document.getElementById('manageClassSelect') || 
                      document.getElementById('classSelect') || 
                      document.querySelector('select');

  if (classSelect) {
    selectedClassText = classSelect.options[classSelect.selectedIndex]?.text.trim() || classSelect.value.trim();
  }

  let displayClassName = selectedClassText;
  if (selectedClassText.includes('ประถมศึกษาปีที่')) {
    displayClassName = selectedClassText.replace('ประถมศึกษาปีที่', 'ป.').replace(/\s+/g, '');
  } else if (selectedClassText.includes('อนุบาล')) {
    displayClassName = selectedClassText.replace('อนุบาลปีที่', 'อ.').replace('อนุบาล', 'อ.').replace(/\s+/g, '');
  }

  if (!displayClassName || displayClassName.includes('เลือก') || displayClassName.includes('ทั้งหมด')) {
    displayClassName = 'ป.5';
  }

  let classStudents = [];
  const tableRows = document.querySelectorAll('#manageStudentTableBody tr, #studentTableBody tr');
  
  tableRows.forEach(row => {
    const cols = row.querySelectorAll('td');
    if (cols.length >= 3) {
      const noText = cols[1].innerText.trim();
      const nameText = cols[2].innerText.trim();
      if (noText && nameText && !isNaN(noText)) {
        classStudents.push({ no: noText, name: nameText });
      }
    } else if (cols.length >= 2) {
      const noText = cols[0].innerText.trim();
      const nameText = cols[1].innerText.trim();
      if (noText && nameText && !isNaN(noText)) {
        classStudents.push({ no: noText, name: nameText });
      }
    }
  });

  if (classStudents.length === 0) {
    showCustomPopup('ไม่พบข้อมูลนักเรียน', `กรุณากดเลือกระดับชั้นให้ตารางแสดงรายชื่อนักเรียนก่อนสั่งพิมพ์ครับ`);
    return;
  }

  classStudents.sort((a, b) => Number(a.no) - Number(b.no));

  let rowsHtml = classStudents.map((s, index) => `
    <tr>
      <td style="text-align: center;">${s.no || (index + 1)}</td>
      <td style="text-align: left; padding-left: 15px;">${s.name}</td>
      <td style="text-align: center;">${displayClassName}</td>
      <td></td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>บัญชีรายชื่อนักเรียน ชั้น ${displayClassName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; font-size: 16pt; line-height: 1.6; margin: 0; padding: 20px; color: #000; }
        .header { text-align: center; margin-bottom: 20px; }
        .title { font-weight: bold; font-size: 18pt; margin-bottom: 5px; }
        .subtitle { font-size: 16pt; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #000; padding: 8px 5px; font-size: 15pt; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        @media print { @page { size: A4 portrait; margin: 2cm 1.5cm 2cm 2cm; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">บัญชีรายชื่อนักเรียน</div>
        <div class="subtitle">โรงเรียนชุมชนบ้านกะมิยอ | ระดับชั้น ${displayClassName}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 12%;">เลขที่</th>
            <th style="width: 50%;">ชื่อ - นามสกุล</th>
            <th style="width: 18%;">ระดับชั้น</th>
            <th style="width: 20%;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

function showCustomPopup(title, message) {
  const existingModal = document.getElementById('custom-alert-modal');
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div id="custom-alert-modal" style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;
      z-index: 99999;
    ">
      <div style="
        background: #ffffff; padding: 25px 30px; border-radius: 12px; width: 90%; max-width: 420px;
        text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-family: 'Sarabun', sans-serif;
      ">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: #fff3cd; color: #856404; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 15px auto;">⚠️</div>
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 20px; font-weight: bold;">${title}</h3>
        <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.5;">${message}</p>
        <button onclick="document.getElementById('custom-alert-modal').remove()" style="
          background: #8a5a00; color: white; border: none; padding: 10px 25px; font-size: 16px;
          border-radius: 6px; cursor: pointer; font-weight: bold;
        ">ตกลง</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// --- 5. การจัดการ Dashboard ---
function toggleDashPeriodInput() {
  const periodType = document.getElementById('dashPeriodType').value;
  const dateInput = document.getElementById('dashSelectedDate');
  const monthInput = document.getElementById('dashSelectedMonth');

  if (periodType === 'daily') {
    dateInput.style.display = 'inline-block';
    monthInput.style.display = 'none';
  } else {
    dateInput.style.display = 'none';
    monthInput.style.display = 'inline-block';
  }
  
  updateDashboard();
}

function updateDashboard() {
  const periodType = document.getElementById('dashPeriodType') ? document.getElementById('dashPeriodType').value : 'monthly';
  const selectedDate = document.getElementById('dashSelectedDate') ? document.getElementById('dashSelectedDate').value : '';
  const selectedMonth = document.getElementById('dashSelectedMonth') ? document.getElementById('dashSelectedMonth').value : '';
  const selectedClass = document.getElementById('dashClassSelect') ? document.getElementById('dashClassSelect').value : 'all';

  Swal.fire({
    title: 'กำลังโหลดข้อมูล...',
    text: 'โปรดรอสักครู่',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  const fetchUrl = `${WEB_APP_URL}?action=getDashboard&type=${periodType}&date=${selectedDate}&month=${selectedMonth}&className=${encodeURIComponent(selectedClass)}`;

  fetch(fetchUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      Swal.close();
      if (data && data.error) {
        Swal.fire('พบปัญหาฝั่ง Sheet', data.error, 'error');
      } else {
        renderDashboard(data);
      }
    })
    .catch(err => {
      Swal.close();
      Swal.fire('การเชื่อมต่อล้มเหลว', 'ไม่สามารถเชื่อมต่อ Google Sheets ได้: ' + err.message, 'error');
    });
}

function renderDashboard(data) {
  if (!data) return;

  if (document.getElementById('kpiTotal')) document.getElementById('kpiTotal').innerHTML = `${data.total || 0} <small>คน</small>`;
  if (document.getElementById('kpiPresent')) document.getElementById('kpiPresent').innerHTML = `${data.present || 0} <small>คน</small>`;
  if (document.getElementById('kpiLate')) document.getElementById('kpiLate').innerHTML = `${data.late || 0} <small>คน</small>`;
  if (document.getElementById('kpiAbsent')) document.getElementById('kpiAbsent').innerHTML = `${data.absent || 0} <small>คน</small>`;

  const classSummaryBody = document.getElementById('classSummaryTableBody');
  if (classSummaryBody && data.classSummary) {
    if (data.classSummary.length === 0) {
      classSummaryBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">ไม่พบข้อมูลระดับชั้น</td></tr>`;
    } else {
      let classRows = '';
      data.classSummary.forEach(item => {
        classRows += `
          <tr>
            <td class="ps-4 fw-bold"><span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">${item.className}</span></td>
            <td class="text-center fw-semibold">${item.total} คน</td>
            <td class="text-center text-success fw-bold">${item.present} คน</td>
            <td class="text-center text-warning text-dark fw-bold">${item.late} คน</td>
            <td class="text-center text-danger fw-bold pe-4">${item.absent} คน</td>
          </tr>
        `;
      });
      classSummaryBody.innerHTML = classRows;
    }
  }

  const alertBody = document.getElementById('alertTableBody');
  const badge = document.getElementById('alertCountBadge');
  if (!alertBody) return;

  if (!data.alerts || data.alerts.length === 0) {
    if (badge) badge.innerText = 'พบ 0 คน';
    alertBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-success fw-bold">🎉 ไม่พบนกเรียนที่มาสายเกิน 4 ครั้งในเดือนนี้</td></tr>`;
    return;
  }

  if (badge) badge.innerText = `พบ ${data.alerts.length} คน`;
  let rows = '';
  data.alerts.forEach((item, index) => {
    rows += `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><span class="badge bg-info text-dark">${item.className}</span></td>
        <td class="fw-bold">${item.name}</td>
        <td class="text-warning text-dark fw-bold text-center">${item.lateCount} ครั้ง</td>
        <td><small class="text-secondary">${item.lateDates || '-'}</small></td>
      </tr>`;
  });
  alertBody.innerHTML = rows;
}

// --- 6. พิมพ์รายงานสรุปประจำเดือน (Report) ---
function fetchClassList() {
  const select = document.getElementById('printClassSelect');
  if (!select) return;

  fetch(`${WEB_APP_URL}?action=getClassList`)
    .then(res => res.json())
    .then(res => {
      const classes = res.data || [];
      if (classes.length > 0) {
        select.innerHTML = '<option value="all">-- ทุกระดับชั้น --</option>';
        classes.forEach(cls => {
          select.innerHTML += `<option value="${cls}">${cls}</option>`;
        });
      }
    })
    .catch(err => console.error("Error fetching class list:", err));
}

function generateReport(type) {
  const monthVal = document.getElementById('printMonthSelect')?.value;
  const selectedClass = document.getElementById('printClassSelect')?.value || 'all';

  if (!monthVal) {
    Swal.fire('กรุณาเลือกเดือน', '', 'warning');
    return;
  }

  Swal.fire({ title: 'กำลังเตรียมเอกสาร...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const fetchUrl = `${WEB_APP_URL}?action=getReportData&month=${monthVal}&className=${encodeURIComponent(selectedClass)}`;

  fetch(fetchUrl)
    .then(res => res.json())
    .then(data => {
      Swal.close();
      if (data.error) {
        Swal.fire('เกิดข้อผิดพลาด', data.error, 'error');
        return;
      }

      if (!data.reportData || Object.keys(data.reportData).length === 0) {
        Swal.fire('ไม่พบข้อมูล', 'ไม่มีข้อมูลของระดับชั้นที่เลือกในเดือนนี้', 'info');
        return;
      }

      if (type === 'stats') {
        renderLandscapeStatsReport(data);
      } else {
        renderPortraitLateReport(data);
      }
    })
    .catch(err => {
      Swal.close();
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + err.message, 'error');
    });
}

function renderLandscapeStatsReport(data) {
  const printArea = document.getElementById('printArea');
  if (!printArea) return;
  printArea.innerHTML = '';

  const [year, month] = data.month.split('-');
  const thaiMonthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const monthTitle = `${thaiMonthNames[parseInt(month, 10) - 1]} ${parseInt(year, 10) + 543}`;

  for (const cls in data.reportData) {
    const classGroup = data.reportData[cls];
    let html = `
      <div class="page-landscape">
        <div style="text-align: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-weight: bold;">รายงานสรุปสถิติการเข้าร่วมกิจกรรมหน้าเสาธงของนักเรียน</h3>
          <p style="margin: 5px 0;">ระดับชั้น: ${cls} &nbsp;&nbsp;&nbsp;&nbsp; ประจำเดือน: ${monthTitle} &nbsp;&nbsp;&nbsp;&nbsp; โรงเรียนชุมชนบ้านกะมิยอ</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 220px;" rowspan="2">ชื่อ - นามสกุล</th>
              <th colspan="31">วันที่</th>
              <th colspan="3">สรุป</th>
            </tr>
            <tr>
              ${Array.from({length: 31}, (_, i) => `<th style="width: 18px; font-size: 9pt;">${i + 1}</th>`).join('')}
              <th style="width: 25px;">ร</th>
              <th style="width: 25px;">ส</th>
              <th style="width: 25px;">ข</th>
            </tr>
          </thead>
          <tbody>
    `;

    classGroup.students.forEach((s, idx) => {
      html += `
        <tr>
          <td class="text-start">${idx + 1}. ${s.name}</td>
          ${Array.from({length: 31}, (_, i) => `<td style="font-size: 9pt;">${s.dailyStatus[i + 1] || '-'}</td>`).join('')}
          <td style="font-weight: bold; color: green;">${s.presentCount || '-'}</td>
          <td style="font-weight: bold; color: orange;">${s.lateCount || '-'}</td>
          <td style="font-weight: bold; color: red;">${s.absentCount || '-'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <div class="signature-section" style="margin-top: 30px; display: flex; justify-content: space-between; text-align: center;">
          <div><br>ลงชื่อ..........................................................<br>(..........................................................)<br>ตำแหน่ง ครูประจำชั้น โรงเรียนชุมชนบ้านกะมิยอ</div>
          <div><br>ลงชื่อ..........................................................<br>(นายอับดุล เจะสือแม)<br>ตำแหน่ง รองผู้อำนวยการโรงเรียนชุมชนบ้านกะมิยอ</div>
          <div><br>ลงชื่อ..........................................................<br>(นางวันพิทยา มุสตาฟา)<br>ตำแหน่ง ผู้อำนวยการโรงเรียนชุมชนบ้านกะมิยอ</div>
        </div>
      </div>
    `;
    printArea.innerHTML += html;
  }

  setTimeout(() => window.print(), 500);
}

function renderLandscapeStatsReport(data) {
  const printArea = document.getElementById('printArea');
  if (!printArea) return;
  printArea.innerHTML = '';

  const [yearStr, monthStr] = data.month.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const thaiMonthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const monthTitle = `${thaiMonthNames[month - 1]} ${year + 543}`;
  
  // คำนวณจำนวนวันในเดือนนั้นๆ (28, 29, 30, 31 วัน)
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidays = data.holidays || {};

  for (const cls in data.reportData) {
    const classGroup = data.reportData[cls];
    const totalStudents = classGroup.students.length;

    // ตรวจสอบวันเสาร์ (6), อาทิตย์ (0) และวันหยุดพิเศษ
    const dayTypes = {}; // { dayNum: { isHoliday: true, name: 'วันเสาร์' } }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay(); // 0 = อาทิตย์, 6 = เสาร์
      const dateKey = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;

      if (dayOfWeek === 6) {
        dayTypes[d] = { isMerged: true, name: '--- วันเสาร์ ---' };
      } else if (dayOfWeek === 0) {
        dayTypes[d] = { isMerged: true, name: '--- วันอาทิตย์ ---' };
      } else if (holidays[dateKey]) {
        dayTypes[d] = { isMerged: true, name: `--- ${holidays[dateKey]} ---` };
      } else {
        dayTypes[d] = { isMerged: false };
      }
    }

    let html = `
      <div class="page-landscape">
        <style>
          .vertical-text {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            white-space: nowrap;
            text-align: center;
            vertical-align: middle;
            font-size: 8.5pt;
            color: #555;
            letter-spacing: 1px;
            padding: 5px 0;
          }
          .table-report th, .table-report td {
            text-align: center;
            vertical-align: middle;
            padding: 2px 1px;
          }
        </style>

        <div style="text-align: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-weight: bold; font-size: 16pt;">รายงานสรุปสถิติการเข้าร่วมกิจกรรมหน้าเสาธงของนักเรียน</h3>
          <p style="margin: 5px 0; font-size: 13pt;">
            <b>ระดับชั้น:</b> ${cls} &nbsp;&nbsp;&nbsp;&nbsp; 
            <b>ประจำเดือน:</b> ${monthTitle} &nbsp;&nbsp;&nbsp;&nbsp; 
            <b>โรงเรียนชุมชนบ้านกะมิยอ</b>
          </p>
        </div>

        <table class="table-report" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 200px;" rowspan="2">ชื่อ-นามสกุล</th>
              <th colspan="${daysInMonth}">วันที่</th>
              <th colspan="3">สรุป</th>
            </tr>
            <tr>
    `;

    // วนสร้างหัวตารางวันที่ 1 - 31
    for (let d = 1; d <= daysInMonth; d++) {
      html += `<th style="width: 18px; font-size: 8.5pt;">${d}</th>`;
    }

    html += `
              <th style="width: 22px; color: green;">ก</th>
              <th style="width: 22px; color: orange;">ส</th>
              <th style="width: 22px; color: red;">ข</th>
            </tr>
          </thead>
          <tbody>
    `;

    // สร้างแถวรายชื่อนักเรียน
    classGroup.students.forEach((s, idx) => {
      html += `<tr>`;
      html += `<td style="text-align: left; padding-left: 5px; font-size: 9.5pt;">${idx + 1}. ${s.name}</td>`;

      for (let d = 1; d <= daysInMonth; d++) {
        if (dayTypes[d].isMerged) {
          // ยุบรวมเซลล์แนวตั้งสำหรับนักเรียนคนแรก (Row index 0)
          if (idx === 0) {
            html += `<td rowspan="${totalStudents}" class="vertical-text">${dayTypes[d].name}</td>`;
          }
          // คนอื่นๆ ข้ามเซลล์นี้เพราะถูกยุบไปแล้ว
        } else {
          const st = s.dailyStatus[d] || '-';
          let styleColor = '';
          if (st === 'ก') styleColor = 'color: green;';
          if (st === 'ส') styleColor = 'color: orange; font-weight: bold;';
          if (st === 'ข') styleColor = 'color: red; font-weight: bold;';

          html += `<td style="font-size: 9pt; ${styleColor}">${st}</td>`;
        }
      }

      // คอลัมน์สรุป ก / ส / ข
      html += `
        <td style="font-size: 9pt;">${s.presentCount || '-'}</td>
        <td style="font-size: 9pt; color: orange; font-weight: bold;">${s.lateCount || '-'}</td>
        <td style="font-size: 9pt; color: red; font-weight: bold;">${s.absentCount || '-'}</td>
      </tr>`;
    });

    html += `
          </tbody>
        </table>

        <!-- ลายเซ็นท้ายเอกสาร -->
        <div class="signature-section" style="margin-top: 25px; display: flex; justify-content: space-around; text-align: center; font-size: 10.5pt;">
          <div>
            <br>ลงชื่อ..........................................................<br>
            (..........................................................)<br>
            ตำแหน่ง ครูประจำชั้น โรงเรียนชุมชนบ้านกะมิยอ
          </div>
          <div>
            <br>ลงชื่อ..........................................................<br>
            (นายอับดุล เจะสือแม)<br>
            ตำแหน่ง รองผู้อำนวยการโรงเรียนชุมชนบ้านกะมิยอ
          </div>
          <div>
            <br>ลงชื่อ..........................................................<br>
            (นางวันพิทยา มุสตาฟา)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนชุมชนบ้านกะมิยอ
          </div>
        </div>
      </div>
    `;
    printArea.innerHTML += html;
  }

  setTimeout(() => window.print(), 500);
}