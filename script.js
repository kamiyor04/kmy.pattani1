// ⚠️ ใส่ Web App URL ของคุณตรงนี้
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exec";

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) dateInput.valueAsDate = new Date();
});

// 1. ดึงรายชื่อนักเรียน (ส่งวันที่ไปด้วย)
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

  const script = document.createElement('script');
  script.id = 'jsonp-script';
  // ส่งค่าทั้ง className และ date ไปฝั่ง Apps Script
  script.src = `${WEB_APP_URL}?action=getStudents&className=${encodeURIComponent(className)}&date=${encodeURIComponent(attendanceDate)}&callback=renderStudentTable`;

  script.onerror = function () {
    Swal.fire({
      icon: 'error',
      title: 'เชื่อมต่อล้มเหลว',
      text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาเช็กเน็ตหรือ Web App URL',
      confirmButtonColor: '#4f46e5'
    });
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้</td></tr>`;
  };

  document.body.appendChild(script);
}

// 2. แสดงตาราง (ถ้าเคยบันทึกแล้ว จะเลือกสถานะเดิมให้ออโต้)
function renderStudentTable(response) {
  const tbody = document.getElementById('studentTableBody');

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
    // เช็กสถานะเดิมของนักเรียนแต่ละคน
    const isPresent = student.status === "เข้าร่วม/มาเรียน" ? "checked" : "";
    const isLate = student.status === "ไม่เข้าร่วม/มาเรียน (สาย)" ? "checked" : "";
    // ถ้าไม่มีข้อมูล หรือเป็น ไม่มาเรียน ให้เลือก ไม่มาเรียน
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
}

// 3. ยืนยันบันทึก/อัปเดตข้อมูล
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