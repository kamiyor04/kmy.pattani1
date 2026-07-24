const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exec"; // ⚠️ อย่าลืมใส่ URL จริงของคุณนะครับ

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) dateInput.valueAsDate = new Date();
});

function loadStudentList() {
  const className = document.getElementById('classSelect').value;
  const attendanceDate = document.getElementById('attendanceDate').value;
  const tbody = document.getElementById('studentTableBody');

  if (!attendanceDate) {
    Swal.fire({
      icon: 'warning',
      title: 'แจ้งเตือน',
      text: 'กรุณาเลือกวันที่บันทึกกิจกรรมก่อนครับ 55',
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

  // ตั้ง Timeout 12 วินาที ถ้ายังไม่ตอบกลับให้ตัดการทำงานทันที
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
    clearTimeout(timer); // ยกเลิกเวลาถ้าได้ข้อมูลแล้ว
    
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
      didOpen: () => {
        Swal.showLoading();
      }
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
// ดึงรายชื่อมาแสดงในหน้าจัดการ
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

// ฟังก์ชันเปิด Modal เพิ่มนักเรียนใหม่ + เช็คเลขที่/ชื่อ ซ้ำในห้อง
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
          <option value="ม.2">ม.2</option>
          <option value="ม.3">ม.3</option>
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

      // 1. ตรวจสอบว่ากรอกข้อมูลครบถ้วนหรือไม่
      if (!no || !name) {
        Swal.showValidationMessage('กรุณากรอกเลขที่และชื่อ-นามสกุลให้ครบถ้วนครับ');
        return false;
      }

      // 2. ดึงข้อมูลนักเรียนทั้งหมดในระบบมาตรวจสอบ (สมมติว่าเกิร์ลเก็บไว้อยู่ในตัวแปร global หรือ localStorage)
      // หากเก็บใน localStorage หรือดึงมาจาก Google Sheets ให้ปรับชื่อตัวแปรที่เก็บข้อมูลนักเรียน
      const allStudents = window.studentData || []; // หรือดึงจากแหล่งข้อมูลนักเรียนในโปรเจกต์

      // กรองเฉพาะนักเรียนในห้องเดียวกัน
      const sameClassStudents = allStudents.filter(s => s.className === className);

      // 3. เช็คว่าเลขที่ซ้ำหรือไม่
      const isDuplicateNo = sameClassStudents.some(s => String(s.no) === String(no));
      if (isDuplicateNo) {
        Swal.showValidationMessage(`เลขที่ ${no} ในชั้น ${className} มีในระบบแล้วครับ`);
        return false;
      }

      // 4. เช็คว่าชื่อ-นามสกุล ซ้ำหรือไม่
      const isDuplicateName = sameClassStudents.some(s => s.name.trim() === name);
      if (isDuplicateName) {
        Swal.showValidationMessage(`นักเรียนชื่อ "${name}" มีอยู่ในชั้น ${className} แล้วครับ`);
        return false;
      }

      return { no, name, className };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      // ส่งข้อมูลไปบันทึกยัง Google Apps Script หรือ Database
      saveStudentData('addStudent', { student: result.value });
    }
  });
}

// ยืนยันลบน้องนักเรียน
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

// ฟังก์ชันส่งข้อมูลไปยัง Apps Script
async function saveStudentData(action, bodyData) {
  Swal.showLoading();
  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, ...bodyData })
    });
    const data = await res.json();
    if (data.status === "success") {
      Swal.fire('สำเร็จ!', data.message, 'success');
      fetchStudentManageList(); // โหลดตารางใหม่
    } else {
      Swal.fire('ผิดพลาด', data.message, 'error');
    }
  } catch (err) {
    Swal.fire('ผิดพลาด', err.message, 'error');
  }
}
// ฟังก์ชันบันทึกข้อมูลนักเรียนใหม่
async function saveStudentData(action, payload) {
  Swal.fire({
    title: 'กำลังบันทึกข้อมูล...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: action, ...payload })
    });
    const result = await response.json();

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: result.message || 'บันทึกข้อมูลเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
      // โหลดตารางนักเรียนใหม่
      fetchStudentManageList();
    } else {
      // ถ้า Apps Script ตรวจพบว่าซ้ำ จะเด้งเตือนตรงนี้ทันที
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

// ฟังก์ชันพิมพ์รายชื่อนักเรียน ( Pop-up สวยงาม ไม่ใช้ alert เบราว์เซอร์ + รองรับทุกชั้น ป.1-ป.6)
function printStudentList() {
  // 1. ดึงข้อความชั้นเรียนจากช่อง dropdown ให้ตรงเป๊ะ
  let selectedClassText = '';
  
  // หา element ตัวเลือกชั้นเรียน
  const classSelect = document.getElementById('manageClassSelect') || 
                      document.getElementById('classSelect') || 
                      document.getElementById('selectClass') ||
                      document.querySelector('select');

  if (classSelect) {
    if (classSelect.selectedIndex !== -1) {
      selectedClassText = classSelect.options[classSelect.selectedIndex].text.trim();
    } else if (classSelect.value) {
      selectedClassText = classSelect.value.trim();
    }
  }

  // แปลงชื่อชั้นเรียนสำหรับแสดงผล (เช่น ประถมศึกษาปีที่ 5 -> ป.5)
  let displayClassName = selectedClassText;
  if (selectedClassText.includes('ประถมศึกษาปีที่')) {
    displayClassName = selectedClassText.replace('ประถมศึกษาปีที่', 'ป.').replace(/\s+/g, '');
  } else if (selectedClassText.includes('อนุบาล')) {
    displayClassName = selectedClassText.replace('อนุบาลปีที่', 'อ.').replace('อนุบาล', 'อ.').replace(/\s+/g, '');
  }

  if (!displayClassName || displayClassName.includes('เลือก') || displayClassName.includes('ทั้งหมด')) {
    displayClassName = 'ป.5'; // เผื่อกรณีหาไม่เจอ ให้ใช้ตามหน้าจอปัจจุบัน
  }

  let classStudents = [];

  // 2. กวาดรายชื่อจากตารางที่แสดงอยู่บนหน้าจอทันที
  const tableRows = document.querySelectorAll('table tbody tr');
  
  tableRows.forEach(row => {
    const cols = row.querySelectorAll('td');
    
    // โครงสร้างตาราง: col[0]=ป้าย ป.5, col[1]=เลขที่, col[2]=ชื่อ-นามสกุล
    if (cols.length >= 3) {
      const noText = cols[1].innerText.trim();
      const nameText = cols[2].innerText.trim();

      if (noText && nameText && !isNaN(noText)) {
        classStudents.push({
          no: noText,
          name: nameText
        });
      }
    } 
    else if (cols.length >= 2) {
      const noText = cols[0].innerText.trim();
      const nameText = cols[1].innerText.trim();

      if (noText && nameText && !isNaN(noText)) {
        classStudents.push({
          no: noText,
          name: nameText
        });
      }
    }
  });

  // 3. ถ้าไม่พบข้อมูล ให้แสดง Custom Pop-up สวยงาม (ไม่ใช่ alert เบราว์เซอร์)
  if (classStudents.length === 0) {
    showCustomPopup('ไม่พบข้อมูลนักเรียน', `กรุณากดเลือกระดับชั้นให้ตารางแสดงรายชื่อนักเรียนก่อนสั่งพิมพ์ครับ`);
    return;
  }

  // 4. เรียงลำดับตามเลขที่ (1, 2, 3, ...)
  classStudents.sort((a, b) => Number(a.no) - Number(b.no));

  // 5. สร้างแบบฟอร์มเอกสารทางการ
  let rowsHtml = classStudents.map((s, index) => `
    <tr>
      <td style="text-align: center;">${s.no || (index + 1)}</td>
      <td style="text-align: left; padding-left: 15px;">${s.name}</td>
      <td style="text-align: center;">${displayClassName}</td>
      <td></td>
    </tr>
  `).join('');

  // 6. เปิดหน้าต่างพิมพ์เอกสารทันที
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
        .garuda-img { width: 80px; height: auto; margin-bottom: 10px; }
        .title { font-weight: bold; font-size: 18pt; margin-bottom: 5px; }
        .subtitle { font-size: 16pt; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #000; padding: 8px 5px; font-size: 15pt; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .footer-sign { margin-top: 40px; width: 100%; display: table; }
        .sign-box { display: table-cell; width: 50%; text-align: center; vertical-align: top; }
        @media print { @page { size: A4 portrait; margin: 2cm 1.5cm 2cm 2cm; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Garuda_Thailande.png" class="garuda-img" alt="ตราครุฑ"><br>
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
      <div class="footer-sign">
        <div class="sign-box">
          <p>ลงชื่อ......................................................ครูประจำชั้น<br>
          (......................................................)<br>
          ตำแหน่ง ......................................................</p>
        </div>
        <div class="sign-box">
          <p>ลงชื่อ......................................................ผู้รับรอง<br>
          (นางสาววรรณพิตตยา มุสตาฟา)<br>
          ผู้อำนวยการโรงเรียนชุมชนบ้านกะมิยอ</p>
        </div>
      </div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

// ฟังก์ชันสร้าง Pop-up สวยๆ ขึ้นมาเองโดยไม่ใช้ alert() ของเบราว์เซอร์
function showCustomPopup(title, message) {
  // ลบ popup เก่าถ้ามี
  const existingModal = document.getElementById('custom-alert-modal');
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div id="custom-alert-modal" style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;
      z-index: 99999; animation: fadeIn 0.2s ease-in-out;
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
          border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;
        " onmouseover="this.style.background='#6c4600'" onmouseout="this.style.background='#8a5a00'">ตกลง</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}