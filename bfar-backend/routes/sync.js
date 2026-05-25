// bfar-backend/routes/sync.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../db'); 
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Setup Dayjs for Philippine Time
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Manila');

const CROSSCHEX_URL = "https://api.us.crosschexcloud.com/";

// --- Helper Functions ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getCrossChexToken() {
  const response = await fetch(CROSSCHEX_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      header: {
        nameSpace: "authorize.token",
        nameAction: "token",
        version: "1.0",
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      payload: {
        api_key: process.env.CROSSCHEX_API_KEY,
        api_secret: process.env.CROSSCHEX_API_SECRET,
      }
    })
  });
  const data = await response.json();
  return data.payload?.token;
}

// Recursive function to handle pagination safely
async function getRecord(token, requestId, page, startDate, endDate, accumulatedList = []) {
  try {
    const response = await fetch(CROSSCHEX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        header: {
          nameSpace: 'attendance.record',
          nameAction: 'getrecord',
          version: '1.0',
          requestId: requestId,
          timestamp: new Date().toISOString(),
        },
        authorize: { type: 'token', token: token },
        payload: {
          begin_time: new Date(`${startDate}T00:00:00Z`).toISOString(),
          end_time: new Date(`${endDate}T23:59:59Z`).toISOString(),
          order: 'asc',
          page: page,
          per_page: 200,
        }
      })
    });

    const data = await response.json();

    if (data.header?.name === 'Exception' && data.payload?.type === 'FREQUENT_REQUEST') {
      console.warn(`Rate limit hit. Waiting 30 seconds before retrying page ${page}...`);
      await delay(30000);
      return getRecord(token, requestId, page, startDate, endDate, accumulatedList);
    }

    const payload = data.payload;
    if (!payload?.list) return accumulatedList; 

    const updatedList = accumulatedList.concat(payload.list);

    if (payload.pageCount > page) {
      console.log(`Fetching page ${page + 1} of ${payload.pageCount}...`);
      await delay(30000); 
      return getRecord(token, requestId, page + 1, startDate, endDate, updatedList);
    }

    return updatedList;
  } catch (error) {
    console.error('Error fetching records:', error);
    return null;
  }
}

// ==========================================
// 1. CLOUD SYNC ENDPOINT
// ==========================================
router.post('/sync-crosschex', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) return res.status(400).json({ success: false, error: "Missing start or end date." });

    const token = await getCrossChexToken();
    if (!token) return res.status(401).json({ error: "CrossChex Auth Failed" });

    const requestId = crypto.randomUUID();
    const records = await getRecord(token, requestId, 1, startDate, endDate);

    if (!records || records.length === 0) {
      return res.json({ success: true, message: `No punches found from ${startDate} to ${endDate}.` });
    }

    const formattedLogs = records.map((record) => {
      const manilaTime = dayjs(record.checktime).tz('Asia/Manila');

      return {
        UserId: parseInt(record.employee?.workno || record.employee_no || 0), 
        DateLog: manilaTime.format('YYYY-MM-DD'), 
        TimeLog: manilaTime.format('HH:mm:ss'), 
        ReaderId: record.device?.serial_number || record.device?.name || "API", 
        TimeEventId: parseInt(record.checktype) || 0 
      };
    });

    await prisma.timelogs.createMany({ 
      data: formattedLogs, 
      skipDuplicates: true 
    });

    const pendingLogs = await prisma.timelogs.findMany({ 
      where: {
        DateLog: { gte: startDate, lte: endDate }
      },
      orderBy: { TimeLog: 'asc' } 
    });

    if (pendingLogs.length === 0) return res.json({ success: true, message: "Data synced, but no new punches to process." });

    const groupedLogs = {};
    for (const log of pendingLogs) {
      const key = `${log.UserId}_${log.DateLog}`;
      if (!groupedLogs[key]) groupedLogs[key] = [];
      groupedLogs[key].push(log);
    }

    let processedCount = 0;

    for (const key in groupedLogs) {
      const punches = groupedLogs[key];
      const userId = punches[0].UserId;
      const dateLog = punches[0].DateLog;

      let timeInAM = "", timeOutAM = "", timeInPM = "", timeOutPM = "";

      for (const p of punches) {
        const t = p.TimeLog;

        if (t >= "04:00:00" && t < "10:30:00") {
          if (!timeInAM) timeInAM = t; 
        } else if (t >= "10:30:00" && t <= "14:00:00") {
          if (t <= "13:00:00" && !timeOutAM) {
            timeOutAM = t; 
          } else if (t >= "11:00:00" && !timeInPM) {
            timeInPM = t;  
          } else if (t >= "11:00:00") {
            timeInPM = t;  
          }
        } else if (t > "14:00:00" && t <= "23:00:00") {
          timeOutPM = t; 
        }
      }

      const existingRecord = await prisma.tblattendance.findFirst({
        where: { biometricsNo_fk: userId, dtrDate: dateLog }
      });

      if (existingRecord) {
        await prisma.tblattendance.update({
          where: { dtr_id: existingRecord.dtr_id },
          data: { timeInAM: timeInAM || existingRecord.timeInAM, timeOutAM: timeOutAM || existingRecord.timeOutAM, timeInPM: timeInPM || existingRecord.timeInPM, timeOutPM: timeOutPM || existingRecord.timeOutPM, DateTimeModified: new Date() }
        });
      } else {
        await prisma.tblattendance.create({
          data: { dtrDate: dateLog, timeInAM, timeOutAM, timeInPM, timeOutPM, biometricsNo_fk: userId, DeviceID: punches[0].ReaderId, createdBy: "System", modifiedBy: "System", DateTimeModified: new Date(), otHour: 0, otMinutes: 0, overtime: 0, undertime: 0, utHour: 0, utMinutes: 0 }
        });
      }
      processedCount++;
    }

    res.json({ success: true, message: `Sync complete! Downloaded punches and updated ${processedCount} daily records.` });

  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;