// bfar-backend/routes/upload.js
const express = require('express');
const router = express.Router();
const prisma = require('../db'); 
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const multer = require('multer');

// Setup Dayjs for Philippine Time
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Manila');

// Set up Multer to catch the BAK.KQ file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// MANUAL FILE UPLOAD ENDPOINT (BAK.KQ)
// ==========================================
router.post('/upload-bak', upload.single('bakFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file was uploaded." });
    }

    const buffer = req.file.buffer;
    const records = [];
    
    // 🔥 THE REAL FIX: 14 bytes per punch!
    const recordLength = 14; 

    for (let i = 0; i < buffer.length; i += recordLength) {
      if (i + recordLength > buffer.length) break; 

      const chunk = buffer.slice(i, i + recordLength);
      
      // 1. User ID is 2 bytes, starting after the 6 blank padding bytes (Big Endian)
      const userId = chunk.readUInt16BE(6); 
      
      // 2. Timestamp is 4 bytes, starting at index 8 (Big Endian)
      const timestampSeconds = chunk.readUInt32BE(8); 
      
      // 3. Event Type (In/Out) is at index 12
      const eventType = chunk.readUInt8(12);
      
      // Filter out empty/blank records
      if (timestampSeconds > 0 && userId > 0 && userId < 100000) {
        // Anviz devices count seconds starting from Jan 2, 2000
        const epochBase = Date.UTC(2000, 0, 2, 0, 0, 0); 
        
        // Use .utc() so it doesn't add a fake +8 hours
        const dateObj = dayjs.utc(epochBase + (timestampSeconds * 1000));

        // Sanity check: Ensure the year makes sense
        const year = dateObj.year();
        if (year >= 2020 && year <= 2030) {
           records.push({
             UserId: userId,
             DateLog: dateObj.format('YYYY-MM-DD'),
             TimeLog: dateObj.format('HH:mm:ss'),
             ReaderId: "BAK.KQ", 
             TimeEventId: eventType
           });
        }
      }
    }

    if (records.length === 0) {
       return res.json({ success: false, error: "Could not decode file. Please ensure this is a valid BAK.KQ file." });
    }

    // 3. Stage the decoded punches
    await prisma.timelogs.createMany({ 
      data: records, 
      skipDuplicates: true 
    });

    // 4. Find the date range of the uploaded file to limit processing
    const dates = [...new Set(records.map(r => r.DateLog))];
    const minDate = dates.reduce((a, b) => a < b ? a : b);
    const maxDate = dates.reduce((a, b) => a > b ? a : b);

    const pendingLogs = await prisma.timelogs.findMany({ 
      where: { DateLog: { gte: minDate, lte: maxDate } },
      orderBy: { TimeLog: 'asc' } 
    });

    const groupedLogs = {};
    for (const log of pendingLogs) {
      const key = `${log.UserId}_${log.DateLog}`;
      if (!groupedLogs[key]) groupedLogs[key] = [];
      groupedLogs[key].push(log);
    }

    let processedCount = 0;

    // 5. Apply the Intelligent Time-Range Bucketing
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
          if (t <= "13:00:00" && !timeOutAM) timeOutAM = t; 
          else if (t >= "11:00:00") timeInPM = t; 
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

    return res.json({ 
      success: true, 
      message: `File decoded successfully! Found ${records.length} punches and updated ${processedCount} daily records.` 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, error: "Failed to decode BAK.KQ file. The file may be corrupted." });
  }
});

module.exports = router;