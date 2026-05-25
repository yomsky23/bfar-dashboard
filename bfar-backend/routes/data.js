// bfar-backend/routes/data.js
const express = require('express');
const router = express.Router();
const prisma = require('../db'); // Central database connection

// =========================================================================
// 1. TIME LOGS & ATTENDANCE RECORD PIPELINES (Untouched Core Logic)
// =========================================================================
router.get('/timelogs', async (req, res) => {
  try {
    const logs = await prisma.timelogs.findMany({ orderBy: { DateLog: 'desc' } });
    res.json(logs);
  } catch (error) {
    console.error("PRISMA ERROR:", error);
    res.status(500).json({ error: "Failed to fetch timelogs" });
  }
});

router.get('/dtr', async (req, res) => {
  try {
    const dtr = await prisma.tblattendance.findMany();
    res.json(dtr);
  } catch (error) {
    console.error("PRISMA ERROR:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});


// =========================================================================
// 2. EMPLOYEES ENDPOINTS (Relational Stitching Layer)
// =========================================================================

// Keeps Attendance tab working with raw flat array formatting
router.get('/employees', async (req, res) => {
  try {
    const employees = await prisma.tblemployees.findMany();
    res.json(employees);
  } catch (error) {
    console.error("PRISMA ERROR:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Dedicated to User Management screen (Explicit CamelCase Mapping)
router.get('/extended-employees', async (req, res) => {
  try {
    const [employees, sections, divisions, stations, positions] = await Promise.all([
      prisma.tblemployees.findMany(),
      prisma.tblsections.findMany().catch(() => []),
      prisma.tbldivisions.findMany().catch(() => []),
      prisma.tblstations.findMany().catch(() => []),
      prisma.tblpositions.findMany().catch(() => [])
    ]);

    const posMap = {}; positions.forEach(p => posMap[p.id] = p);
    const staMap = {}; stations.forEach(s => staMap[s.id] = s);
    const divMap = {}; divisions.forEach(d => divMap[d.id] = d);
    const secMap = {}; sections.forEach(s => secMap[s.id] = s);

    const extendedEmployees = employees.map(emp => {
      const sId = emp.sectionId || emp.section_id || emp.SectionId || emp.SectionID;
      const pId = emp.positionId || emp.position_id || emp.PositionId || emp.PositionID;
      const stId = emp.stationId || emp.station_id || emp.StationId || emp.StationID;
      const dId = emp.divisionId || emp.division_id || emp.DivisionId || emp.DivisionID;

      const divisionObj = divMap[dId] || null;
      let sectionObj = secMap[sId] ? { ...secMap[sId] } : null;

      if (!sectionObj && divisionObj) {
        sectionObj = { id: 0, name: "General", fullname: "General Unit / Section" };
      }

      if (sectionObj) {
        sectionObj.division = divisionObj;
        sectionObj.tbldivisions = divisionObj;
      }

      const positionObj = posMap[pId] || null;
      const stationObj = staMap[stId] || null;

      return {
        ...emp,
        position: positionObj,
        tblpositions: positionObj,
        station: stationObj,
        tblstations: stationObj,
        section: sectionObj,
        tblsections: sectionObj,
        user: []
      };
    });

    return res.json({ data: extendedEmployees });
  } catch (error) {
    console.error("Stitching Layer Exception:", error);
    try {
      const flatEmployees = await prisma.tblemployees.findMany();
      return res.json({ data: flatEmployees });
    } catch (finalErr) {
      return res.json({ data: [] });
    }
  }
});

// --- Employee Mutations ---
router.post("/employees", async (req, res) => {
  try {
    const data = req.body;
    const newEmployee = await prisma.tblemployees.create({
      data: {
        employeeId: data.employeeId,
        biometricId: parseInt(data.biometricId) || 0,
        surname: data.surname,
        firstname: data.firstname,
        middlename: data.middlename || "",
        extensionname: data.extensionname || "N/A",
        positionId: parseInt(data.positionId) || 0,
        stationId: parseInt(data.stationId) || 0,
        divisionId: parseInt(data.divisionId) || 0,
        sectionId: parseInt(data.sectionId) || 0,
        status: data.status || "ACTIVE",
        role: data.role || "USER",
      }
    });
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error("Error creating employee record:", error);
    res.status(500).json({ error: "Failed to compile employee data" });
  }
});

router.put("/employees", async (req, res) => {
  try {
    const data = req.body;
    const updatedEmployee = await prisma.tblemployees.update({
      where: { id: parseInt(data.id) },
      data: {
        employeeId: data.employeeId,
        biometricId: parseInt(data.biometricId) || 0,
        surname: data.surname,
        firstname: data.firstname,
        middlename: data.middlename || "",
        extensionname: data.extensionname || "N/A",
        positionId: parseInt(data.positionId) || 0,
        stationId: parseInt(data.stationId) || 0,
        divisionId: parseInt(data.divisionId) || 0,
        sectionId: parseInt(data.sectionId) || 0,
        status: data.status || "ACTIVE",
        role: data.role || "USER",
      }
    });
    res.json(updatedEmployee);
  } catch (error) {
    console.error("Error modifying employee profile:", error);
    res.status(500).json({ error: "Failed to apply profile changes" });
  }
});

router.delete("/employees/:id", async (req, res) => {
  try {
    await prisma.tblemployees.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: "Employee successfully deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to erase employee record" });
  }
});


// =========================================================================
// 3. DIVISIONS & SECTIONS PIPELINES
// =========================================================================
router.get("/divisions", async (req, res) => {
  try {
    const [divisions, sections] = await Promise.all([
      prisma.tbldivisions.findMany(),
      prisma.tblsections.findMany()
    ]);

    const stitchedDivisions = divisions.map(div => {
      const subSections = sections.filter(sec => {
        const dId = sec.divisionId || sec.division_id || sec.DivisionId || sec.DivisionID;
        return dId && dId.toString() === div.id.toString();
      });

      return {
        ...div,
        tblsections: subSections,
        sections: subSections
      };
    });

    res.json({ data: stitchedDivisions });
  } catch (err) {
    console.error("Divisions Fetch Error:", err);
    res.json({ data: [] });
  }
});

router.post("/divisions", async (req, res) => {
  try {
    const newDiv = await prisma.tbldivisions.create({ data: { name: req.body.name, fullname: req.body.fullname } });
    res.status(201).json(newDiv);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate new division" });
  }
});

router.put("/divisions", async (req, res) => {
  try {
    const updatedDiv = await prisma.tbldivisions.update({
      where: { id: parseInt(req.body.id) },
      data: { name: req.body.name, fullname: req.body.fullname }
    });
    res.json(updatedDiv);
  } catch (error) {
    res.status(500).json({ error: "Failed to update division parameters" });
  }
});

router.delete("/divisions/:id", async (req, res) => {
  try {
    await prisma.tbldivisions.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove division container" });
  }
});

router.post("/sections", async (req, res) => {
  try {
    const newSection = await prisma.tblsections.create({
      data: { name: req.body.name, fullname: req.body.fullname, divisionId: parseInt(req.body.divisionId) }
    });
    res.status(201).json(newSection);
  } catch (error) {
    res.status(500).json({ error: "Failed to construct new sub-section" });
  }
});

router.put("/sections", async (req, res) => {
  try {
    // 🛠️ FIXED: Included 'divisionId' update payload so department shifts persist
    const updatedSec = await prisma.tblsections.update({
      where: { id: parseInt(req.body.id) },
      data: { 
        name: req.body.name, 
        fullname: req.body.fullname,
        divisionId: parseInt(req.body.divisionId) || undefined 
      }
    });
    res.json(updatedSec);
  } catch (error) {
    console.error("Sections modification error context:", error);
    res.status(500).json({ error: "Failed to edit section assignments" });
  }
});

router.delete("/sections/:id", async (req, res) => {
  try {
    await prisma.tblsections.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to break sub-section context" });
  }
});


// =========================================================================
// 4. MASONRY STATIONS CRUD
// =========================================================================
router.get("/stations", async (req, res) => {
  try {
    const stations = await prisma.tblstations.findMany();
    res.json({ data: stations });
  } catch {
    res.json({ data: [] });
  }
});

router.post("/stations", async (req, res) => {
  try {
    const newStation = await prisma.tblstations.create({
      data: { name: req.body.name, fullname: req.body.fullname, address: req.body.address }
    });
    res.status(201).json(newStation);
  } catch (error) {
    res.status(500).json({ error: "Failed to create physical base station" });
  }
});

router.put("/stations", async (req, res) => {
  try {
    const updatedStation = await prisma.tblstations.update({
      where: { id: parseInt(req.body.id) },
      data: { name: req.body.name, fullname: req.body.fullname, address: req.body.address }
    });
    res.json(updatedStation);
  } catch (error) {
    res.status(500).json({ error: "Failed to apply changes to station records" });
  }
});

router.delete("/stations/:id", async (req, res) => {
  try {
    await prisma.tblstations.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to disconnect target branch station" });
  }
});


// =========================================================================
// 5. EMPLOYEE POSITIONS REFERENCE DATA LOOKUPS
// =========================================================================
router.get("/positions", async (req, res) => {
  try {
    const positions = await prisma.tblpositions.findMany();
    res.json({ data: positions });
  } catch {
    res.json({ data: [] });
  }
});


// =========================================================================
// 6. CREDENTIAL SECURITY MODALS CONTROLLERS
// =========================================================================
router.get('/user/:username', async (req, res) => {
  try {
    const userExists = await prisma.tblusers.findFirst({ where: { username: req.params.username } });
    res.json(userExists);
  } catch (error) {
    res.status(500).json({ error: "Failed database user security query" });
  }
});

router.post('/user', async (req, res) => {
  try {
    const { username, password, employeeId } = req.body;
    
    // 🛠️ FIXED: Standardized target relational mapping fields to integers
    const newUser = await prisma.tblusers.create({
      data: { 
        username, 
        password, 
        employeeId: parseInt(employeeId) || 0, 
        status: true, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      }
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Account creation failure error context:", error);
    res.status(500).json({ error: "Failed account instantiation profile setup" });
  }
});

router.put('/user', async (req, res) => {
  try {
    const { command, id, status, password } = req.body;

    if (command === "changeStatus") {
      const updatedUser = await prisma.tblusers.update({
        where: { id: parseInt(id) },
        data: { status: status, updatedAt: new Date() }
      });
      return res.json(updatedUser);
    }

    if (command === "changePassword") {
      const updatedUser = await prisma.tblusers.update({
        where: { id: parseInt(id) },
        data: { password: password, updatedAt: new Date() }
      });
      return res.json(updatedUser);
    }
    res.status(400).json({ error: "Invalid context operational parameters action" });
  } catch (error) {
    res.status(500).json({ error: "Failed configuration updates execution profile" });
  }
});

module.exports = router;