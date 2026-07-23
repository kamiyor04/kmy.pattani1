// 🔗 URL ที่ได้จากการ Deploy Web App บน Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbze6PHouALWAr_xog9v1Wucd0DmAqFZ6_cVT55Ya7yzUAYtFiiwX7qWULU40oNdZQa6/exec";

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