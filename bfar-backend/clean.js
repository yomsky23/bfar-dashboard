const prisma = require('./db');

async function cleanDatabase() {
  try {
    console.log("🧹 Sweeping out bad April data...");

    // 1. Delete the processed daily records for April
    const deletedDTR = await prisma.tblattendance.deleteMany({
      where: { dtrDate: { contains: "2026-04" } }
    });
    
    // 2. Delete the raw punches for April
    const deletedLogs = await prisma.timelogs.deleteMany({
      where: { DateLog: { contains: "2026-04" } }
    });

    console.log(`✅ Successfully deleted ${deletedDTR.count} processed records.`);
    console.log(`✅ Successfully deleted ${deletedLogs.count} raw punches.`);
    console.log("🚀 The database is clean! You can now re-download from CrossChex.");
    
  } catch (error) {
    console.error("Error cleaning database:", error);
  }
}

cleanDatabase();