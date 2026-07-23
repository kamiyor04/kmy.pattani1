// 🔗 URL ที่ได้จากการ Deploy Web App บน Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exec";

// 🚀 ฟังก์ชันดึงรายชื่อนักเรียนและเช็กวันหยุด
async function handleLoadStudents() {
  const dateVal = document.getElementById('date-select').value;
  const classVal = document.getElementById('class-select').value;
  const tbody = document.getElementById('student-list-body');
  const holidayBanner = document.getElementById('holiday-banner');
  const holidayReason = document.getElementById('holiday-reason');
  const countBadge = document.getElementById('student-count-badge');

  if (!dateVal) {
    alert("กรุณาเลือกวันที่ก่อนทำรายการค่ะ");
    return;
  }

  // แสดงข้อความกำลังโหลด
  tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#64748b;">⏳ กำลังตรวจสอบปฏิทินวันหยุดและโหลดรายชื่อ...</td></tr>';
  holidayBanner.style.display = 'none';

  try {
    // 1. ตรวจสอบวันหยุด
    const resHoliday = await fetch(`${API_URL}?action=checkHoliday&date=${dateVal}`);
    const holidayData = await resHoliday.json();

    if (holidayData.isHoliday) {
      holidayReason.textContent = `วันนี้เป็นวันหยุด: ${holidayData.reason}`;
      holidayBanner.style.display = 'block';
    }

    // 2. ดึงรายชื่อนักเรียน
    const resStudents = await fetch(`${API_URL}?action=getStudents&cls=${encodeURIComponent(classVal)}&date=${dateVal}`);
    const students = await resStudents.json();

    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#ef4444;">❌ ไม่พบข้อมูลนักเรียนในชั้นเรียนนี้</td></tr>';
      countBadge.textContent = '0 คน';
      return;
    }

    countBadge.textContent = `${students.length} คน`;

    // 3. แสดงผลตารางนักเรียน
    let html = '';
    students.forEach((s) => {
      const isPresent = s.savedStatus === 'เข้าร่วม/มาเรียน' || s.savedStatus === 'มาเรียน' || s.savedStatus === 'เข้าร่วม';
      const isLate = s.savedStatus.indexOf('สาย') !== -1;
      const isAbsent = s.savedStatus === 'ไม่มาเรียน';

      html += `
        <tr>
          <td style="text-align:center; font-weight:600;">${s.id}</td>
          <td>${s.name}</td>
          <td style="text-align:center;">
            <div class="status-options" style="justify-content:center;">
              <label class="status-btn ${isPresent ? 'checked-present' : ''}">
                <input type="radio" name="status_${s.id}" value="เข้าร่วม/มาเรียน" ${isPresent ? 'checked' : ''} style="display:none;" onchange="updateBtnStyle(this)"> มาเรียน
              </label>
              <label class="status-btn ${isLate ? 'checked-late' : ''}">
                <input type="radio" name="status_${s.id}" value="ไม่เข้าร่วม/มาเรียน (สาย)" ${isLate ? 'checked' : ''} style="display:none;" onchange="updateBtnStyle(this)"> สาย
              </label>
              <label class="status-btn ${isAbsent ? 'checked-absent' : ''}">
                <input type="radio" name="status_${s.id}" value="ไม่มาเรียน" ${isAbsent ? 'checked' : ''} style="display:none;" onchange="updateBtnStyle(this)"> ขาด
              </label>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

  } catch (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#dc2626;">❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาเช็ก API_URL หรือสิทธิ์การเข้าถึงค่ะ</td></tr>';
  }
}

// 🎨 เปลี่ยนสีปุ่มเมื่อเลือกสถานะ
function updateBtnStyle(radioBtn) {
  const container = radioBtn.closest('.status-options');
  container.querySelectorAll('.status-btn').forEach(btn => {
    btn.classList.remove('checked-present', 'checked-late', 'checked-absent');
  });

  const parentLabel = radioBtn.closest('.status-btn');
  if (radioBtn.value.includes('มาเรียน') && !radioBtn.value.includes('สาย')) {
    parentLabel.classList.add('checked-present');
  } else if (radioBtn.value.includes('สาย')) {
    parentLabel.classList.add('checked-late');
  } else if (radioBtn.value.includes('ไม่มาเรียน')) {
    parentLabel.classList.add('checked-absent');
  }
}

// 💾 ฟังก์ชันบันทึกข้อมูลการเช็กชื่อ
async function handleSaveAttendance() {
  const dateVal = document.getElementById('date-select').value;
  const classVal = document.getElementById('class-select').value;
  const records = {};

  const rows = document.querySelectorAll('#student-list-body tr');
  rows.forEach(row => {
    const radioChecked = row.querySelector('input[type="radio"]:checked');
    if (radioChecked) {
      const studentId = radioChecked.name.replace('status_', '');
      records[studentId] = radioChecked.value;
    }
  });

  if (Object.keys(records).length === 0) {
    alert("กรุณาเลือกสถานะของนักเรียนอย่างน้อย 1 คนค่ะ");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveAttendance",
        cls: classVal,
        recs: records,
        dateSelected: dateVal
      })
    });
    const result = await response.json();
    alert(result.message);
  } catch (error) {
    console.error(error);
    alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
  }
}
// 🔎 ดึงรายชื่อนักเรียนผ่าน API
async function loadStudents(cls, dateSelected) {
  try {
    const response = await fetch(`${API_URL}?action=getStudents&cls=${encodeURIComponent(cls)}&date=${dateSelected}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading students:", error);
  }
}

// 💾 บันทึกข้อมูลการเช็กชื่อ
async function saveAttendance(cls, recordsMap, dateSelected) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveAttendance",
        cls: cls,
        recs: recordsMap,
        dateSelected: dateSelected
      })
    });
    const result = await response.json();
    alert(result.message);
  } catch (error) {
    console.error("Error saving attendance:", error);
  }
}

// 🚨 ดึงข้อมูลสรุปนักเรียนสายเกินเกณฑ์
async function triggerRealtimeStrictReport() {
  const monthEl = document.getElementById('dash-month-input') || document.getElementById('dashboard-month-select');
  const currentMonth = monthEl ? monthEl.value : "";
  
  const targetContainer = document.getElementById('late-students-rooms-container');
  if (!targetContainer) return;
  
  targetContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b;">⏳ กำลังโหลดตาราง...</div>';
  
  try {
    const response = await fetch(`${API_URL}?action=getLateSummary&targetMonth=${currentMonth}`);
    const responseData = await response.json();

    if (!responseData || !responseData.success) return;
    
    const report = responseData.reportData;
    if (Object.keys(report).length === 0) {
        targetContainer.innerHTML = '<div style="text-align:center; color:#16a34a; font-weight:bold; padding:20px;">🎉 เดือนนี้ไม่มีรายชื่อนักเรียนมาสายเกินเกณฑ์ค่ะ</div>';
        return;
    }

    let htmlContent = '<div style="display:flex; flex-direction:column; align-items:center; width:100%;">';
    htmlContent += '<h4 style="color:#b91c1c; margin-bottom:15px; text-align:center;">🚨 รายชื่อนักเรียนไม่เข้าร่วม/สาย (สะสม 4+ ครั้ง)</h4>';
    
    const sortedRoomNames = Object.keys(report).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));
    
    sortedRoomNames.forEach(function(roomName) {
        htmlContent += `
            <div style="width: 95%; max-width: 600px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow:hidden; margin-left: auto; margin-right: auto;">
                <div style="background:#334155; color:#fff; padding:10px; font-weight:bold; text-align:center;">ระดับชั้น ${roomName}</div>
                <table style="width:100%; border-collapse:collapse; font-size:12px;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                            <th style="padding:10px; text-align:center;">เลขที่</th>
                            <th style="padding:10px; text-align:left;">ชื่อ - นามสกุล</th>
                            <th style="padding:10px; text-align:center;">ครั้ง</th>
                            <th style="padding:10px; text-align:center;">วันที่มาสาย</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report[roomName].map(s => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:8px; text-align:center;">${s.id}</td>
                                <td style="padding:8px; font-weight:600;">${s.name}</td>
                                <td style="padding:8px; text-align:center; color:#dc2626; font-weight:bold;">${s.totalCount}</td>
                                <td style="padding:8px; text-align:center;">
                                    ${s.lateDates.map(d => `<span style="background:#fef3c7; padding:2px 5px; border-radius:3px; margin:1px; display:inline-block;">${d}</span>`).join('')}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });
    
    htmlContent += '</div>';
    targetContainer.innerHTML = htmlContent;
  } catch (err) {
    console.error(err);
  }
}