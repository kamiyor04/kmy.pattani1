// ==========================================
// 📌 Configuration & Constant Settings
// ==========================================
var SPREADSHEET_ID = "1cAxC17wR3S-Uz7XRKrpj9zXHNep91GaUB5gw0SoQRYY"; 
var CHANNEL_ACCESS_TOKEN = "Td6TTx1mnzMlkdB1cbbx456Dx+SPJ8zrjsa41335CjuJbAMmBN7aWkfvlAEd5aA2IeX433ZK5lKL3gm3i6HNKqMFGY3YZIoCjWZVoXT0eCOsdEe+Xd9hkM/0K9LZc8PVQTaPrv4U2STwsRS6k9P5mgdB04t89/1O/w1cDnyilFU=";
var GROUP_ID = "C11194f2a91f764ee4ffbbd2102052b5f";

function getSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ==========================================
// 🚀 Web API Handlers (doGet / doPost)
// ==========================================
function doGet(e) {
  var action = e.parameter.action;
  var result = {};

  try {
    if (action === "getStudents") {
      result = getStudentsByClassAndDate(e.parameter.cls, e.parameter.date);
    } else if (action === "checkHoliday") {
      result = checkIsHoliday(e.parameter.date);
    } else if (action === "getDashboard") {
      result = getDashboardData(e.parameter.periodType, e.parameter.targetValue, e.parameter.classScope);
    } else if (action === "getLateSummary") {
      result = getRealtimeLateAbsentSummary(e.parameter.targetMonth);
    } else if (action === "getDutyLogs") {
      result = getSavedDutyLogs(e.parameter.targetMonth);
    } else if (action === "getHolidays") {
      result = getHolidaysList();
    } else {
      result = { status: "error", message: "Invalid action" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = {};
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "saveAttendance") {
      result = { message: saveAttendanceDataByDate(data.cls, data.recs, data.dateSelected) };
    } else if (action === "saveDuty") {
      result = { message: saveAllDutyLogs(data.targetMonth, data.dutyData) };
    } else if (action === "addHoliday") {
      result = { message: addHoliday(data.dateStr, data.nameStr) };
    } else if (action === "deleteHoliday") {
      result = { message: deleteHoliday(data.dateStr) };
    } else if (action === "saveStudent") {
      result = { message: saveStudentToSheet(data.cls, data.oldId, data.id, data.nm) };
    } else if (action === "deleteStudent") {
      result = { message: deleteStudentFromSheet(data.cls, data.id) };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 🔍 Data Retrieval & Core Logic Functions
// ==========================================
function getStudentsByClassAndDate(cls, dateSelected) {
  var studentList = [];
  try {
    var ss = getSS();
    var dbSheet = ss.getSheetByName("Student_List"); 
    var allStudents = dbSheet ? dbSheet.getDataRange().getValues() : [];
    
    var logSheet = ss.getSheetByName("Attendance_Logs");
    var checkedMap = {}; 
    
    if (logSheet) {
      var lastLog = logSheet.getLastRow();
      if (lastLog > 1) {
        var logData = logSheet.getRange(2, 1, lastLog - 1, 5).getValues(); 
        for (var k = 0; k < logData.length; k++) {
          var rawDate = logData[k][0]; 
          if (!rawDate) continue;
          
          var logDate = Utilities.formatDate(new Date(rawDate), Session.getScriptTimeZone(), "yyyy-MM-dd");
          var logClass = String(logData[k][1]).trim(); 
          
          if (logDate === dateSelected && logClass === cls) {
            var studentNo = String(logData[k][2]).trim(); 
            var sStatus = String(logData[k][4]).trim();   
            if (studentNo) checkedMap[studentNo] = sStatus; 
          }
        }
      }
    }
    
    for (var j = 1; j < allStudents.length; j++) {
      var studentClass = String(allStudents[j][2]).trim(); 
      if (studentClass === String(cls).trim()) {
        var id = String(allStudents[j][0]).trim();   
        var name = allStudents[j][1];                 
        var savedStatus = checkedMap[id] || "";
        
        studentList.push({
          id: id,
          name: name,
          alreadyChecked: (savedStatus !== ""),
          savedStatus: savedStatus
        });
      }
    }
  } catch (e) {
    Logger.log("Error: " + e.toString());
  }
  return studentList;
}

function saveAttendanceDataByDate(cls, recs, dateSelected) {
  try {
    var ss = getSS();
    var logSheet = ss.getSheetByName("Attendance_Logs");
    if (!logSheet) return "❌ ไม่พบแท็บ Attendance_Logs ในระบบค่ะ";
    
    var sysDate = dateSelected; 
    var lastRow = logSheet.getLastRow();
    var logData = lastRow > 1 ? logSheet.getRange(2, 1, lastRow - 1, 6).getValues() : [];
    
    var rowMap = {};
    var timeZone = Session.getScriptTimeZone();
    
    for (var i = 0; i < logData.length; i++) {
      var rawDate = logData[i][0];
      if (!rawDate) continue;
      
      var logDate = Utilities.formatDate(new Date(rawDate), timeZone, "yyyy-MM-dd");
      var logClass = String(logData[i][1]).trim();
      var rawNo = logData[i][2];
      var logNo = (typeof rawNo === 'number') ? String(Math.floor(rawNo)) : String(rawNo).trim();
      
      if (logDate === dateSelected && logClass === cls) {
        rowMap[logNo] = i + 2; 
      }
    }
    
    var studentNamesMap = {};
    var dbSheet = ss.getSheetByName("Student_List");
    if (dbSheet) {
      var allSt = dbSheet.getDataRange().getValues();
      for (var j = 1; j < allSt.length; j++) {
        var dbClass = String(allSt[j][2]).trim();
        if (dbClass === cls) {
          var dbNo = (typeof allSt[j][0] === 'number') ? String(Math.floor(allSt[j][0])) : String(allSt[j][0]).trim();
          studentNamesMap[dbNo] = allSt[j][1]; 
        }
      }
    }

    for (var studentNo in recs) {
      var status = recs[studentNo];
      var cleanNo = (typeof studentNo === 'number') ? String(Math.floor(studentNo)) : String(studentNo).trim();
      var studentName = studentNamesMap[cleanNo] || "";

      if (rowMap[cleanNo]) {
        var targetRow = rowMap[cleanNo];
        logSheet.getRange(targetRow, 5, 1, 2).setValues([[status, sysDate]]); 
      } else {
        logSheet.appendRow([dateSelected, cls, cleanNo, studentName, status, sysDate]);
        rowMap[cleanNo] = logSheet.getLastRow();
      }
    }
    return "✅ บันทึกข้อมูลเรียบร้อยแล้วค๊าาา!";
  } catch (e) {
    return "❌ เกิดข้อผิดพลาดหลังบ้าน: " + e.toString();
  }
}

function checkIsHoliday(dateSelected) {
  var result = { isHoliday: false, reason: "" };
  try {
    var d = new Date(dateSelected);
    var dayOfWeek = d.getDay(); 
    if (dayOfWeek === 0) return { isHoliday: true, reason: "วันอาทิตย์ (วันหยุดประจำสัปดาห์)" };
    if (dayOfWeek === 6) return { isHoliday: true, reason: "วันเสาร์ (วันหยุดประจำสัปดาห์)" };

    var ss = getSS();
    var settingsSheet = ss.getSheetByName("Settings");
    if (settingsSheet) {
      var lastRow = settingsSheet.getLastRow();
      if (lastRow > 1) {
        var data = settingsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0]) {
            var hKey = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
            if (hKey === dateSelected) {
              return { isHoliday: true, reason: data[i][1] || "วันหยุดโรงเรียน/วันหยุดนักขัตฤกษ์" };
            }
          }
        }
      }
    }
  } catch (e) {
    Logger.log("Error in checkIsHoliday: " + e.toString());
  }
  return result;
}

// ==========================================
// 📡 LINE Notification Triggers
// ==========================================
function sendLineNotify(message) {
  var url = "https://api.line.me/v2/bot/message/push";
  var payload = { to: GROUP_ID, messages: [{ type: "text", text: message }] };
  var options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify(payload)
  };
  UrlFetchApp.fetch(url, options);
}

function dailyReportLateDutyToLine() {
  try {
    var ss = getSS();
    var today = new Date();
    if (today.getDay() === 0 || today.getDay() === 6) return;

    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    var dateKey = yyyy + '-' + mm + '-' + dd;
    
    var settingsSheet = ss.getSheetByName("Settings");
    if (settingsSheet) {
      var settingsData = settingsSheet.getDataRange().getValues();
      for (var i = 1; i < settingsData.length; i++) {
        if (settingsData[i][0]) {
          var hObj = new Date(settingsData[i][0]);
          if (!isNaN(hObj.getTime())) {
            var hKey = hObj.getFullYear() + '-' + String(hObj.getMonth() + 1).padStart(2, '0') + '-' + String(hObj.getDate()).padStart(2, '0');
            if (hKey === dateKey) return; 
          }
        }
      }
    }

    var dutySheet = ss.getSheetByName("Duty_Logs");
    var teacherName = "";
    if (dutySheet) {
      var dutyData = dutySheet.getDataRange().getValues();
      for (var j = 1; j < dutyData.length; j++) {
        if (dutyData[j][0]) {
          var dObj = new Date(dutyData[j][0]);
          if (!isNaN(dObj.getTime())) {
            var dKey = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0') + '-' + String(dObj.getDate()).padStart(2, '0');
            if (dKey === dateKey) {
              teacherName = String(dutyData[j][1]).trim();
              break;
            }
          }
        }
      }
    }

    var monthNamesThai = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    var thaiDateStr = parseInt(dd, 10) + " " + monthNamesThai[today.getMonth()] + " " + (yyyy + 543);

    if (teacherName !== "" && teacherName !== "-") {
      var messageStr = "☀️ ครูเวรจับสายประจำวัน ☀️\n" +
                       "🗓️ วันที่: " + thaiDateStr + "\n" +
                       "👤 " + teacherName;
      sendLineNotify(messageStr);
    }
  } catch (e) {
    Logger.log("Error in dailyReportLine: " + e.toString());
  }
}