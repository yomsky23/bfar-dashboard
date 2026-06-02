// src/UserManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button, useDisclosure } from "@nextui-org/react";
import { SearchIcon, Menu } from "lucide-react";
import useSWR from "swr";
import EmployeeModal from "./EmployeeModal"; 
import TableUser from "./TableUser";
import ManageStations from "./ManageStations"; 
// ✅ STEP 1: Imported the pure JavaScript divisions and sections module layout
import ManageDivisionsSections from "./ManageDivisionsSections";

const fetcher = (url) => fetch(`http://localhost:5000${url}`).then((res) => res.json());

export default function UserManagement() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // ✅ STEP 2: Main workspace view router tracking state variable
  const [activeTab, setActiveTab] = useState("employees");

  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose, onOpenChange: onAddOpenChange } = useDisclosure();
  const { isOpen: isAccountOpen, onOpen: onAccountOpen, onClose: onAccountClose, onOpenChange: onAccountOpenChange } = useDisclosure();

  const [filterValue, setFilterValue] = useState("");
  
  // 🔢 PAGINATION STATES
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Managed Form States
  const [btnCommand, setBTNCommand] = useState("add");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStation, setSelectedStation] = useState("12");
  const [selectedPosition, setSelectedPosition] = useState("26");
  const [selectedRole, setSelectedRole] = useState("USER");
  const [ID, setID] = useState();
  const [empID, setEmpID] = useState("");
  const [bioID, setBioID] = useState("");
  const [surname, setSurname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [extensionname, setExtensionname] = useState("");
  const [status, setStatus] = useState(true);
  const [selectedUser, setSelectedUser] = useState();

  // Primary SWR Data Pipelines
  const { data: employees, isLoading, mutate } = useSWR("/api/extended-employees", fetcher);
  const { data: divisions } = useSWR("/api/divisions", fetcher);
  const { data: positions } = useSWR("/api/positions", fetcher);
  const { data: stations } = useSWR("/api/stations", fetcher);

  useEffect(() => {
    setPage(1);
  }, [filterValue]);

  const filteredItems = useMemo(() => {
    const baseEmployees = Array.isArray(employees) ? employees : (employees?.data || []);
    if (!filterValue.trim()) return baseEmployees;

    const searchStr = filterValue.toLowerCase();
    return baseEmployees.filter((d) => {
      const empIdStr = (d.employeeId || d.EmployeeID || d.employee_id || "").toString().toLowerCase();
      const sName = (d.surname || d.lastname || d.LastName || "").toString().toLowerCase();
      const fName = (d.firstname || d.FirstName || "").toString().toLowerCase();
      return empIdStr.includes(searchStr) || sName.includes(searchStr) || fName.includes(searchStr);
    });
  }, [filterValue, employees]);

  const pages = useMemo(() => {
    return filteredItems.length ? Math.ceil(filteredItems.length / rowsPerPage) : 0;
  }, [filteredItems]);

  const dataPage = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [page, filteredItems]);

  // 🛠️ KEYBOARD NAVIGATION ENGINE: Turns pagination layers using Left & Right physical arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // CRITICAL GUARD: Bypass pagination flip triggers if the user is typing inside form elements
      const activeEl = document.activeElement?.tagName;
      if (activeEl === "INPUT" || activeEl === "SELECT" || activeEl === "TEXTAREA") {
        return;
      }

      // Safeguard keyword navigation logic so arrow key updates only execute on the employee table tab view matrix layer
      if (activeTab !== "employees") return;

      if (e.key === "ArrowLeft") {
        setPage((prev) => Math.max(prev - 1, 1));
      } else if (e.key === "ArrowRight") {
        setPage((prev) => Math.min(prev + 1, pages));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pages, activeTab]);

  const handleAddNew = () => {
    setBTNCommand("add");
    setID(-1); setEmpID(""); setBioID(""); setSurname(""); setFirstname(""); setMiddlename(""); setExtensionname("");
    setSelectedDivision(""); setSelectedPosition("26"); setSelectedRole("USER"); setSelectedSection(""); setSelectedStation("12");
    setStatus(true);
    onAddOpen();
  };

  const handleEditClick = (employee) => {
    setBTNCommand("update");
    setID(employee.id);
    setEmpID(employee.employeeId || "—");
    setBioID(employee.biometricId || "—");
    setSurname(employee.surname || "");
    setFirstname(employee.firstname || "");
    setMiddlename(employee.middlename || "");
    setExtensionname(employee.extensionname || "");
    setSelectedDivision(employee.divisionId || employee.division_id || ""); 
    setSelectedSection(employee.sectionId || employee.section_id || "");
    setSelectedStation(employee.stationId || employee.station_id || "12"); 
    setSelectedPosition(employee.positionId || employee.position_id || "26");
    setSelectedRole(employee.role || "USER");
    setStatus((employee.status || "ACTIVE") === "ACTIVE");
    onAddOpen();
  };

  const handleAccountClick = (employee) => {
    setSelectedUser({ employeeId: employee.employeeId || "—" });
    onAccountOpen();
  };

  const handleDeleteClick = async (id, fullName) => {
    const confirmDelete = window.confirm(`Are you absolutely sure you want to delete ${fullName || "this employee"}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) mutate();
      else alert("Failed to delete the employee record.");
    } catch (error) {
      console.error("Delete failure error context:", error);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    const payload = {
      employeeId: empID, biometricId: bioID, surname, firstname, middlename, extensionname,
      positionId: selectedPosition, stationId: selectedStation, divisionId: selectedDivision,
      sectionId: selectedSection, status: status ? "ACTIVE" : "INACTIVE", role: selectedRole,
    };

    if (btnCommand === "update") payload.id = ID;

    await fetch(`http://localhost:5000/api/employees`, {
      method: btnCommand === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    mutate();
    onAddClose();
  };

  return (
    <div className="flex flex-1 overflow-hidden h-screen w-full bg-[#0d0e12]">
      
      {/* SIDEBAR NAVIGATION CONTROLS FRAME */}
      <aside className={`bg-[#14151a] border-r border-[#1f2129] flex flex-col shadow-xl z-10 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden border-none" : "w-64"}`}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f2129] whitespace-nowrap">
          <h2 className="font-bold text-white text-md tracking-wide leading-tight">Employee<br />Management</h2>
          <Menu className="text-gray-400 cursor-pointer hover:text-white transition-colors" size={20} onClick={() => setIsSidebarCollapsed(true)} />
        </div>
        <nav className="flex flex-col p-3 space-y-1 mt-2 whitespace-nowrap">
          
          {/* ✅ TAB 1 CONTROL LINK BUTTON */}
          <button 
            type="button"
            onClick={() => setActiveTab("employees")}
            className={`px-4 py-2.5 text-sm text-left rounded shadow-sm font-medium transition-all ${
              activeTab === "employees" 
                ? "text-white bg-[#222530]" 
                : "text-gray-400 hover:text-white hover:bg-[#222530]/50"
            }`}
          >
            Employees
          </button>
          
          {/* ✅ TAB 2 CONTROL LINK BUTTON */}
          <button 
            type="button"
            onClick={() => setActiveTab("divisions")}
            className={`px-4 py-2.5 text-sm text-left rounded font-medium transition-all ${
              activeTab === "divisions" 
                ? "text-white bg-[#222530]" 
                : "text-gray-400 hover:text-white hover:bg-[#222530]/50"
            }`}
          >
            Division & Sections
          </button>
          
          {/* ✅ TAB 3 CONTROL LINK BUTTON */}
          <button 
            type="button"
            onClick={() => setActiveTab("stations")}
            className={`px-4 py-2.5 text-sm text-left rounded font-medium transition-all ${
              activeTab === "stations" 
                ? "text-white bg-[#222530]" 
                : "text-gray-400 hover:text-white hover:bg-[#222530]/50"
            }`}
          >
            Stations
          </button>
        </nav>
      </aside>

      {/* MAIN CANVAS WORKSPACE VIEWPORT LAYER */}
      <div className="flex-1 p-6 overflow-y-auto w-full flex flex-col gap-4">
        
        {/* =========================================================================
            SUB-VIEW RENDER CHANNEL 1: PRIMARY EMPLOYEE MANAGEMENT REGISTRY TABLES
            ========================================================================= */}
        {activeTab === "employees" && (
          <>
            {/* TOP FILTER BAR */}
            <div className="flex justify-between items-center bg-[#14161d] px-6 py-3.5 rounded-xl border border-white/5 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center gap-4 w-full md:w-2/3">
                {isSidebarCollapsed && <Menu className="text-gray-400 cursor-pointer hover:text-white transition-colors mr-1 flex-shrink-0" size={20} onClick={() => setIsSidebarCollapsed(false)} />}
                <span className="text-xs font-bold text-gray-400 tracking-wider">FILTER</span>
                <div className="w-full max-w-[450px] flex items-center bg-[#202026] hover:bg-[#26262d] rounded-full h-10 px-4 transition-colors">
                  <SearchIcon className="text-gray-400 mr-2.5 flex-shrink-0" size={16} />
                  <input type="text" placeholder="Search Employee..." value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-full bg-transparent text-white text-sm placeholder:text-gray-500 outline-none border-none focus:ring-0 p-0 h-full font-medium" />
                  {filterValue && <button onClick={() => setFilterValue("")} className="text-gray-400 hover:text-white text-xs font-bold pl-1">✕</button>}
                </div>
              </div>
              <Button onPress={handleAddNew} variant="bordered" radius="full" className="border-1 border-slate-600 text-white hover:bg-white/5 font-semibold text-sm tracking-wide px-6 h-10 rounded-full">New Employee</Button>
            </div>

            {/* DATA CONTAINER TABLE */}
            <div className="bg-[#14161d] border border-white/5 rounded-xl p-1 shadow-2xl animate-in fade-in duration-200">
              <TableUser 
                dataPage={dataPage}
                isLoading={isLoading}
                page={page}
                setPage={setPage}
                pages={pages}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onAccount={handleAccountClick}
              />
            </div>

            {/* REUSABLE SEPARATED EMPLOYEE FORM MODAL */}
            <EmployeeModal 
              isOpen={isAddOpen} 
              onOpenChange={onAddOpenChange} 
              onClose={onAddClose}
              btnCommand={btnCommand} 
              onSave={onSave}
              stations={stations} 
              divisions={divisions} 
              positions={positions}
              status={status} setStatus={setStatus}
              selectedStation={selectedStation} setSelectedStation={setSelectedStation}
              selectedDivision={selectedDivision} setSelectedDivision={setSelectedDivision}
              selectedSection={selectedSection} setSelectedSection={setSelectedSection}
              selectedPosition={selectedPosition} setSelectedPosition={setSelectedPosition}
              selectedRole={selectedRole} setSelectedRole={setSelectedRole}
              empID={empID} setEmpID={setEmpID}
              bioID={bioID} setBioID={setBioID}
              surname={surname} setSurname={setSurname}
              firstname={firstname} setFirstname={setFirstname}
              middlename={middlename} setMiddlename={setMiddlename}
              extensionname={extensionname} setExtensionname={setExtensionname}
            />
          </>
        )}

        {/* =========================================================================
            SUB-VIEW RENDER CHANNEL 2: ROUTE TO DIVISIONS & UNIT SECTIONS WORKSPACE
            ========================================================================= */}
        {activeTab === "divisions" && (
          <div className="animate-in fade-in duration-200">
            {/* Sidebar toggle button helper trigger overlay display if menu context container is hidden */}
            {isSidebarCollapsed && (
              <div className="flex items-center gap-2 mb-2 px-2">
                <Menu className="text-gray-400 cursor-pointer hover:text-white transition-colors" size={20} onClick={() => setIsSidebarCollapsed(false)} />
                <span className="text-xs font-bold text-gray-500 tracking-wider">SHOW MENU</span>
              </div>
            )}
            <ManageDivisionsSections />
          </div>
        )}

        {/* =========================================================================
            SUB-VIEW RENDER CHANNEL 3: STATIONS BACKUP WORKSPACE HOOK CHANNELS
            ========================================================================= */}
        {/* STATIONS REFERENCE CONTAINER (OLD PLACEHOLDER CODE REMOVED) */}
      {activeTab === "stations" && (
  <div className="flex flex-col gap-4 animate-in fade-in duration-150">
    {/* ✅ ADDED THIS FORWARDING PORT ROUTE HERE: */}
    <ManageStations 
      isSidebarCollapsed={isSidebarCollapsed} 
      setIsSidebarCollapsed={setIsSidebarCollapsed} 
    />
  </div>
)}

      </div>
    </div>
  );
}