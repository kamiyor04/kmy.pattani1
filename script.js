// ⚠️ ใส่ Web App URL ของคุณที่ได้จากการ Deploy Google Apps Script ตรงนี้
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exec";

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) dateInput.valueAsDate = new Date();
});

// 1. ฟังก์ชันดึงรายชื่อนักเรียน
async function loadStudentList() {
  const className = document.getElementById('classSelect').value;
  const tbody = document.getElementById('studentTableBody');

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center py-4">
        ⏳ กำลังดึงข้อมูลรายชื่อนักเรียน...
      </td>
    </tr>`;

  try {
    const response = await fetch(`${WEB_APP_URL}?action=getStudents&className=${encodeURIComponent(className)}`);
    const result = await response.json();

    if (result.status === "error") {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">❌ ${result.message}</td></tr>`;
      return;
    }

    renderStudentTable(result.data);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">❌ ไม่สามารถเชื่อมต่อระบบได้: ${error.message}</td></tr>`;
  }
}

// 2. ฟังก์ชันแสดงตาราง
function renderStudentTable(students) {
  const tbody = document.getElementById('studentTableBody');

  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-warning">⚠️ ไม่พบรายชื่อนักเรียนในระดับชั้นนี้</td></tr>`;
    return;
  }

  let html = '';
  students.forEach((student, index) => {
    html += `
      <tr>
        <td class="text-center">${student.no}</td>
        <td>${student.name}</td>
        <td class="text-center">
          <div class="btn-group w-100" role="group">
            <input type="radio" class="btn-check" name="status_${index}" id="present_${index}" value="มา" checked>
            <label class="btn btn-outline-success btn-sm" for="present_${index}">มา</label>

            <input type="radio" class="btn-check" name="status_${index}" id="late_${index}" value="สาย">
            <label class="btn btn-outline-warning btn-sm" for="late_${index}">สาย</label>

            <input type="radio" class="btn-check" name="status_${index}" id="absent_${index}" value="ขาด">
            <label class="btn btn-outline-danger btn-sm" for="absent_${index}">ขาด</label>

            <input type="radio" class="btn-check" name="status_${index}" id="leave_${index}" value="ลา">
            <label class="btn btn-outline-secondary btn-sm" for="leave_${index}">ลา</label>
          </div>
        </td>
        <td class="text-center">
           <span class="badge bg-light text-dark border">พร้อมบันทึก</span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// 3. ฟังก์ชันบันทึกข้อมูล
async function submitAttendance() {
  const date = document.getElementById('attendanceDate').value;
  const className = document.getElementById('classSelect').value;
  const tbody = document.getElementById('studentTableBody');
  const rows = tbody.querySelectorAll('tr');

  if (rows.length === 0 || document.getElementById('statusMessage')) {
    alert('กรุณากดดึงรายชื่อนักเรียนก่อนครับ');
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

  if (confirm(`ยืนยันบันทึกเช็คชื่อ ${className} จำนวน ${attendanceData.length} คน?`)) {
    try {
      const response = await fetch(WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "saveAttendance",
          records: attendanceData
        })
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("✅ " + result.message);
      } else {
        alert("❌ เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      alert("❌ บันทึกไม่สำเร็จ: " + error.message);
    }
  }
}