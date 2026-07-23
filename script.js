// ⚠️ ใส่ Web App URL ของคุณตรงนี้
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exec";

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) dateInput.valueAsDate = new Date();
});

// 1. ฟังก์ชันดึงรายชื่อนักเรียน
function loadStudentList() {
  const className = document.getElementById('classSelect').value;
  const tbody = document.getElementById('studentTableBody');

  // โชว์หมุนโหลดในตาราง
  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center py-5">
        <div class="spinner-border text-primary me-2" role="status"></div>
        <span class="fs-6 text-secondary">กำลังดึงข้อมูลรายชื่อนักเรียน...</span>
      </td>
    </tr>`;

  // ลบ script tag เก่าออก
  const oldScript = document.getElementById('jsonp-script');
  if (oldScript) oldScript.remove();

  // สร้าง script tag ใหม่ ยิงดึงข้อมูล JSONP
  const script = document.createElement('script');
  script.id = 'jsonp-script';
  script.src = `${WEB_APP_URL}?action=getStudents&className=${encodeURIComponent(className)}&callback=renderStudentTable`;

  script.onerror = function () {
    Swal.fire({
      icon: 'error',
      title: 'เชื่อมต่อล้มเหลว',
      text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาเช็กการเชื่อมต่อเน็ตหรือ Web App URL',
      confirmButtonColor: '#4f46e5'
    });
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้</td></tr>`;
  };

  document.body.appendChild(script);
}

// 2. ฟังก์ชันแสดงตาราง
function renderStudentTable(response) {
  const tbody = document.getElementById('studentTableBody');

  if (!response || response.status === "error") {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: response ? response.message : 'ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์',
      confirmButtonColor: '#4f46e5'
    });
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">❌ เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
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
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-warning">⚠️ ไม่พบรายชื่อนักเรียนในระดับชั้นนี้</td></tr>`;
    return;
  }

  let html = '';
  students.forEach((student, index) => {
    html += `
      <tr>
        <td class="text-center fw-bold text-secondary">${student.no}</td>
        <td class="fw-medium">${student.name}</td>
        <td class="text-center">
          <div class="btn-group w-100 status-group" role="group">
            <input type="radio" class="btn-check" name="status_${index}" id="present_${index}" value="มา" checked>
            <label class="btn btn-outline-success" for="present_${index}">มา</label>

            <input type="radio" class="btn-check" name="status_${index}" id="late_${index}" value="สาย">
            <label class="btn btn-outline-warning" for="late_${index}">สาย</label>

            <input type="radio" class="btn-check" name="status_${index}" id="absent_${index}" value="ขาด">
            <label class="btn btn-outline-danger" for="absent_${index}">ขาด</label>

            <input type="radio" class="btn-check" name="status_${index}" id="leave_${index}" value="ลา">
            <label class="btn btn-outline-secondary" for="leave_${index}">ลา</label>
          </div>
        </td>
        <td class="text-center">
           <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2">พร้อม</span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  // แจ้งเตือน Toast เล็กๆ มุมขวาบนว่าโหลดสำเร็จ
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true
  });
  Toast.fire({
    icon: 'success',
    title: `ดึงรายชื่อสำเร็จ ${students.length} คน`
  });
}

// 3. ฟังก์ชันส่งข้อมูลไปบันทึก
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
        status: statusRadio ? statusRadio.value : "มา"
      });
    }
  });

  // ถามยืนยันด้วย Pop-up สวยๆ
  const result = await Swal.fire({
    title: 'ยืนยันการบันทึก?',
    text: `ต้องการบันทึกข้อมูลการเช็คชื่อ ${className} จำนวน ${attendanceData.length} คนใช่หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ใช่, บันทึกเลย!',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    // แสดงป๊อปอัปกำลังบันทึก (ล็อกหน้าจอไว้กันกดซ้ำ)
    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'กรุณารอสักครู่ ระบบกำลังส่งข้อมูลลง Google Sheets',
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