const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exechttps://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exec";

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const attendanceDateInput = document.getElementById('attendanceDate');
  if (attendanceDateInput) attendanceDateInput.value = `${yyyy}-${mm}-${dd}`;

  const monthInput = document.getElementById('printMonthSelect');
  if (monthInput) monthInput.value = `${yyyy}-${mm}`;

  const dashMonthInput = document.getElementById('dashSelectedMonth');
  if (dashMonthInput) dashMonthInput.value = `${yyyy}-${mm}`;

  const dashDateInput = document.getElementById('dashSelectedDate');
  if (dashDateInput) dashDateInput.value = `${yyyy}-${mm}-${dd}`;
});

// --- 1. เช็คชื่อรายวัน ---
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
      didOpen: () => { Swal.showLoading(); }
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

// --- 2. จัดการรายชื่อนักเรียน ---
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
  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">ไม่พบข้อมูลนักเรียน</td></tr>`;
    return;
  }

  let html = '';
  students.forEach(std => {
    html += `
      <tr>
        <td><span class="badge bg-info text-dark">${std.className}</span></td>
        <td class="fw-bold text-center">${std.no}</td>
        <td>${std.name}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-warning me-1" onclick="openEditStudentModal('${std.no}', '${std.name}', '${std.className}')">
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
      return { no, name, className };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      saveStudentData('addStudent', { student: result.value });
    }
  });
}

function openEditStudentModal(oldNo, name, oldClass) {
  Swal.fire({
    title: '✏️ แก้ไขข้อมูลนักเรียน',
    html: `
      <div class="text-start mb-2"><small class="fw-bold">ระดับชั้น:</small></div>
      <select id="swal-edit-class" class="swal2-select w-100 m-0 mb-3">
        <option value="${oldClass}">${oldClass}</option>
      </select>

      <div class="text-start mb-2"><small class="fw-bold">เลขที่:</small></div>
      <input id="swal-edit-no" type="number" class="swal2-input w-100 m-0 mb-3" value="${oldNo}">

      <div class="text-start mb-2"><small class="fw-bold">ชื่อ - นามสกุล:</small></div>
      <input id="swal-edit-name" class="swal2-input w-100 m-0" value="${name}">
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'อัปเดตข้อมูล',
    cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      const className = document.getElementById('swal-edit-class').value;
      const no = document.getElementById('swal-edit-no').value.trim();
      const newName = document.getElementById('swal-edit-name').value.trim();

      if (!no || !newName) {
        Swal.showValidationMessage('กรุณากรอกเลขที่และชื่อ-นามสกุลให้ครบถ้วน');
        return false;
      }
      return { oldNo: oldNo, oldClass: oldClass, no: no, name: newName, className: className };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      saveStudentData('updateStudent', { student: result.value });
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

async function saveStudentData(action, payload) {
  Swal.fire({
    title: 'กำลังดำเนินการ...',
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
        text: result.message || 'ทำรายการเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
      fetchStudentManageList();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถดำเนินการได้',
        text: result.message || 'เกิดข้อผิดพลาด'
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

// --- 3. แดชบอร์ดสรุปผล ---
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
    didOpen: () => { Swal.showLoading(); }
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
  Swal.close();
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
    alertBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-success fw-bold">
          🎉 ไม่พบนักเรียนที่มาสายเกิน 4 ครั้งในเดือนนี้
        </td>
      </tr>`;
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

// =========================================================
// 4. ฟังก์ชันพิมพ์รายงานสถิติ และ รายงานเด็กมาสาย (สำหรับ VS Code + GitHub)
// =========================================================

function generateReport(type) {
  const monthVal = document.getElementById('printMonthSelect')?.value;
  const selectedClass = document.getElementById('printClassSelect')?.value || 'all';

  if (!monthVal) {
    Swal.fire('กรุณาเลือกเดือน', '', 'warning');
    return;
  }

  Swal.fire({ 
    title: 'กำลังเตรียมเอกสาร...', 
    text: 'กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูล',
    allowOutsideClick: false, 
    didOpen: () => Swal.showLoading() 
  });

  // เรียกไปยัง Google Apps Script Web App
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

// --- 4.1 รายงานสรุปสถิติประจำเดือน (แนวนอน A4 Landscape พร้อมหัวรายงานและแนวตั้ง) ---
function renderLandscapeStatsReport(data) {
  const printArea = document.getElementById('printArea');
  if (!printArea) return;
  printArea.innerHTML = '';

  const [yearStr, monthStr] = data.month.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const thaiMonthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const monthTitle = `${thaiMonthNames[month - 1]} ${year + 543}`;
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidays = data.holidays || {};

  for (const cls in data.reportData) {
    const classGroup = data.reportData[cls];
    const totalStudents = classGroup.students.length;

    const dayTypes = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      const dateKey = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;

      if (dayOfWeek === 6) {
        dayTypes[d] = { isMerged: true, name: 'วันเสาร์' };
      } else if (dayOfWeek === 0) {
        dayTypes[d] = { isMerged: true, name: 'วันอาทิตย์' };
      } else if (holidays[dateKey]) {
        dayTypes[d] = { isMerged: true, name: holidays[dateKey] };
      } else {
        dayTypes[d] = { isMerged: false };
      }
    }

    let html = `
      <div class="page-landscape">
        <div class="report-container">
          <div style="text-align: center; margin-bottom: 15px; font-family: 'Sarabun', sans-serif;">
            <h3 style="margin: 0 0 5px 0; font-weight: bold; font-size: 16pt;">รายงานสรุปสถิติการเข้าร่วมกิจกรรมหน้าเสาธงของนักเรียน</h3>
            <p style="margin: 0; font-size: 13pt;">
              <b>ระดับชั้น:</b> ${cls} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              <b>ประจำเดือน:</b> ${monthTitle}
            </p>
            <p style="margin: 3px 0 0 0; font-size: 13pt;">
              <b>โรงเรียนชุมชนบ้านกะมิยอ</b>
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
            <thead>
              <tr>
                <th style="width: 45px; text-align: center; vertical-align: middle;" rowspan="2">ที่</th>
                <th style="width: 180px; text-align: left; vertical-align: middle; padding-left: 8px;" rowspan="2">ชื่อ - นามสกุล</th>
                <th colspan="${daysInMonth}" style="text-align: center; vertical-align: middle;">วันที่ในเดือน ${thaiMonthNames[month - 1]}</th>
                <th colspan="3" style="text-align: center; vertical-align: middle;">สรุปผล (ครั้ง)</th>
              </tr>
              <tr>
    `;

    for (let d = 1; d <= daysInMonth; d++) {
      html += `<th style="width: 22px; text-align: center; vertical-align: middle;"><div class="vertical-header">${d}</div></th>`;
    }

    html += `
                <th style="width: 25px; color: green; text-align: center; vertical-align: middle; font-weight: bold;">ร</th>
                <th style="width: 25px; color: orange; text-align: center; vertical-align: middle; font-weight: bold;">ส</th>
                <th style="width: 25px; color: red; text-align: center; vertical-align: middle; font-weight: bold;">ข</th>
              </tr>
            </thead>
            <tbody>
    `;

    classGroup.students.forEach((s, idx) => {
      html += `<tr>`;
      html += `<td style="text-align: center; vertical-align: middle;">${idx + 1}</td>`;
      html += `<td style="text-align: left; vertical-align: middle; padding-left: 8px;">${s.name}</td>`;

      for (let d = 1; d <= daysInMonth; d++) {
        if (dayTypes[d].isMerged) {
          if (idx === 0) {
            html += `<td rowspan="${totalStudents}" style="text-align: center; vertical-align: middle; background-color: #f9f9f9; font-size: 8pt; writing-mode: vertical-lr; transform: rotate(180deg);">${dayTypes[d].name}</td>`;
          }
        } else {
          const st = s.dailyStatus[d] || '-';
          let styleColor = '';
          if (st === 'ร') styleColor = 'color: green;';
          if (st === 'ส') styleColor = 'color: orange; font-weight: bold;';
          if (st === 'ข') styleColor = 'color: red; font-weight: bold;';

          html += `<td style="text-align: center; vertical-align: middle; ${styleColor}">${st}</td>`;
        }
      }

      html += `
        <td style="color: green; font-weight: bold; text-align: center; vertical-align: middle;">${s.presentCount || 0}</td>
        <td style="color: orange; font-weight: bold; text-align: center; vertical-align: middle;">${s.lateCount || 0}</td>
        <td style="color: red; font-weight: bold; text-align: center; vertical-align: middle;">${s.absentCount || 0}</td>
      </tr>`;
    });

    html += `
            </tbody>
          </table>

          <div class="signature-section" style="margin-top: 35px; display: flex; justify-content: space-around; text-align: center; font-size: 10pt; font-family: 'Sarabun', sans-serif;">
            <div>
              ลงชื่อ..........................................................<br>
              (..........................................................)<br>
              ตำแหน่ง ครูโรงเรียนชุมชนบ้านกะมิยอ
            </div>
            <div>
              ลงชื่อ..........................................................<br>
              (นายอับดุล เจะสือแต)<br>
              ตำแหน่ง รองผู้อำนวยการโรงเรียนชุมชนบ้านกะมิยอ
            </div>
            <div>
              ลงชื่อ..........................................................<br>
              (นางวันพิทยา มุสตาฟา)<br>
              ตำแหน่ง ผู้อำนวยการโรงเรียนชุมชนบ้านกะมิยอ
            </div>
          </div>
        </div>
      </div>
    `;
    printArea.innerHTML += html;
  }

  setTimeout(() => window.print(), 500);
}

// 4.2 รายงานเด็กมาสายแนวตั้ง (Multi-Page)
function renderPortraitLateReport(data) {
  const printArea = document.getElementById('printArea');
  if (!printArea) return;
  printArea.innerHTML = '';

  const [yearStr, monthStr] = data.month.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const monthTitle = `${thaiMonths[month - 1]} ${year + 543}`;

  for (const cls in data.reportData) {
    const classGroup = data.reportData[cls];
    const lateStudents = classGroup.students.filter(s => s.lateCount >= 4);

    let html = `
      <div class="page-portrait">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-weight: bold; font-size: 16pt;">รายงานสรุปรายชื่อนักเรียนมาสาย / ไม่เข้าร่วมกิจกรรม (4 ครั้งขึ้นไป)</h3>
          <p style="margin: 5px 0; font-size: 13pt;"><b>ระดับชั้น:</b> ${cls} &nbsp;&nbsp;&nbsp;&nbsp; <b>ประจำเดือน:</b> ${monthTitle} &nbsp;&nbsp;&nbsp;&nbsp; <b>โรงเรียนชุมชนบ้านกะมิยอ</b></p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <thead>
            <tr>
              <th style="width: 8%; padding: 6px; text-align: center;">ลำดับ</th>
              <th style="width: 18%; padding: 6px; text-align: center;">ระดับชั้น</th>
              <th style="width: 30%; padding: 6px;">ชื่อ - นามสกุล</th>
              <th style="width: 15%; padding: 6px; text-align: center;">จำนวนสาย</th>
              <th style="width: 29%; padding: 6px;">วันที่มาสาย</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (lateStudents.length === 0) {
      html += `<tr><td colspan="5" style="padding: 15px; text-align: center; color: green; font-weight: bold;">🎉 ไม่พบนักเรียนที่มาสายตั้งแต่ 4 ครั้งขึ้นไปในเดือนนี้</td></tr>`;
    } else {
      lateStudents.forEach((s, idx) => {
        html += `
          <tr>
            <td style="text-align: center; padding: 5px;">${idx + 1}</td>
            <td style="text-align: center; padding: 5px;">${cls}</td>
            <td style="text-align: left; padding: 5px 8px;">${s.name}</td>
            <td style="text-align: center; padding: 5px; font-weight: bold; color: red;">${s.lateCount} ครั้ง</td>
            <td style="text-align: left; padding: 5px 8px;">${s.lateDates ? s.lateDates.join(', ') : '-'}</td>
          </tr>
        `;
      });
    }

    html += `
          </tbody>
        </table>

        <div class="signature-section" style="margin-top: 35px; display: flex; justify-content: space-around; text-align: center; font-size: 10pt;">
          <div>
            <br>ลงชื่อ..........................................................<br>
            (..........................................................)<br>
            ตำแหน่ง ครูโรงเรียนชุมชนบ้านกะมิยอ
          </div>
          <div>
            <br>ลงชื่อ..........................................................<br>
            (นายอับดุล เจะสือแต)<br>
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