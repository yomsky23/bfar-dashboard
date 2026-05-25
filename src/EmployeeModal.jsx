// src/EmployeeModal.jsx
import React, { useMemo } from "react";

export default function EmployeeModal({
  isOpen,
  onClose,
  btnCommand,
  onSave,
  
  // Database Collections Feeds
  stations,
  divisions,
  positions,

  // Managed Form States
  status, setStatus,
  selectedStation, setSelectedStation,
  selectedDivision, setSelectedDivision,
  selectedSection, setSelectedSection,
  selectedPosition, setSelectedPosition,
  selectedRole, setSelectedRole,
  empID, setEmpID,
  bioID, setBioID,
  surname, setSurname,
  firstname, setFirstname,
  middlename, setMiddlename,
  extensionname, setExtensionname
}) {

  // If the modal isn't flagged open, strip it from the virtual DOM instantly
  if (!isOpen) return null;

  const labelClasses = "text-gray-700 font-bold text-[11px] tracking-wide flex items-center pl-1 select-none";
  
  // Dynamic Input Capsule Styling Blueprint
  const inputClasses = "w-full bg-[#25262c] text-white text-sm font-semibold tracking-wide rounded-[14px] h-11 px-4 shadow-inner outline-none border-none placeholder:text-gray-500 transition-colors focus:bg-[#2d2e36]";
  
  // Custom Select Dropdown Styling (Includes custom SVG arrow indicator layer)
  const selectClasses = "w-full bg-[#25262c] text-white text-sm font-semibold tracking-wide rounded-[14px] h-11 px-4 shadow-inner outline-none border-none cursor-pointer appearance-none transition-colors focus:bg-[#2d2e36]";

  const stationRows = Array.isArray(stations) ? stations : (stations?.data || []);
  const divisionRows = Array.isArray(divisions) ? divisions : (divisions?.data || []);
  const positionRows = Array.isArray(positions) ? positions : (positions?.data || []);

  const filteredSections = useMemo(() => {
    if (!selectedDivision) return [];
    const activeDiv = divisionRows.find(d => d.id.toString() === selectedDivision.toString());
    return activeDiv?.tblsections || activeDiv?.sections || [];
  }, [divisionRows, selectedDivision]);

  return (
    // 🌍 FIXED OVERLAY CONTAINER BACKDROP CONTAINER
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      
      {/* MODAL CANVAS FRAME BOX */}
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[500px] overflow-hidden transform transition-all animate-scale-up">
        
        <form onSubmit={onSave} className="outline-none border-none m-0 p-0">
          
          {/* Header Banner */}
          <div className="flex justify-between items-center px-6 py-4 bg-[#75889e] text-white select-none">
            <span className="font-bold text-md tracking-wide">
              {btnCommand === "add" ? "Add New Employee" : "Update Employee"}
            </span>
            
            {/* Custom Interactive Toggle Switch */}
            <div 
              className="flex items-center gap-2 cursor-pointer select-none py-1 group"
              onClick={() => setStatus(!status)}
            >
              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 relative flex items-center ${status ? 'bg-[#22c55e]' : 'bg-gray-400'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${status ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-bold text-white tracking-wide uppercase">Status</span>
            </div>
          </div>

          {/* Form Inputs Content Area */}
          <div className="px-6 py-5 flex flex-col gap-3.5 bg-white max-h-[calc(100vh-160px)] overflow-y-auto">
            
            {/* Row 1: Station selection */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className={labelClasses}>Station <span className="text-red-500 ml-0.5">*</span></label>
              <div className="relative">
                <select 
                  required
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className={selectClasses}
                >
                  <option value="" disabled hidden>Select Station</option>
                  {stationRows.map((st) => (
                    <option key={st.id.toString()} value={st.id.toString()} className="bg-[#17181d] text-white font-medium">{st.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Row 2: Cascading Division & Sections */}
            <div className="flex gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className={labelClasses}>Division <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative">
                  <select 
                    required
                    value={selectedDivision}
                    onChange={(e) => {
                      setSelectedDivision(e.target.value);
                      setSelectedSection("");
                    }}
                    className={selectClasses}
                  >
                    <option value="" disabled hidden>Select Division</option>
                    {divisionRows.map((div) => (
                      <option key={div.id.toString()} value={div.id.toString()} className="bg-[#17181d] text-white font-medium">{div.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className={labelClasses}>Section/Unit <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative">
                  <select 
                    required
                    disabled={!selectedDivision}
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className={`${selectClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="" disabled hidden>{selectedDivision ? "Select Section" : "Choose Division First"}</option>
                    {filteredSections.map((sec) => (
                      <option key={sec.id.toString()} value={sec.id.toString()} className="bg-[#17181d] text-white font-medium">{sec.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Positions & System Access Roles */}
            <div className="flex gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className={labelClasses}>Position <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative">
                  <select 
                    required
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="" disabled hidden>Select Position</option>
                    {positionRows.map((pos) => (
                      <option key={pos.id.toString()} value={pos.id.toString()} className="bg-[#17181d] text-white font-medium">{pos.fullname || pos.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className={labelClasses}>System Role <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative">
                  <select 
                    required
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="ADMINISTRATOR" className="bg-[#17181d] text-white font-medium">ADMINISTRATOR</option>
                    <option value="USER" className="bg-[#17181d] text-white font-medium">USER</option>
                    <option value="HEAD" className="bg-[#17181d] text-white font-medium">HEAD</option>
                    <option value="OPERATOR" className="bg-[#17181d] text-white font-medium">OPERATOR</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Key Identifiers Split Row */}
            <div className="flex gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className={labelClasses}>Employee ID <span className="text-red-500 ml-0.5">*</span></label>
                <input 
                  required 
                  type="text"
                  value={empID} 
                  placeholder="e.g. BFAR-RO2-001"
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase(); 
                    setEmpID(val);
                    
                    let prefix = "";
                    if (val.startsWith("BFAR-")) prefix = "1";
                    else if (val.startsWith("C-")) prefix = "2";
                    else if (val.startsWith("G-")) prefix = "3";
                    else if (val.startsWith("OJT-")) prefix = new Date().getFullYear().toString();
                    
                    if (prefix) {
                      const parts = val.split('-');
                      const lastPart = parts[parts.length - 1] || "";
                      const digits = lastPart.replace(/[^0-9]/g, '');
                      setBioID(prefix + digits);
                    }
                  }} 
                  className={inputClasses}
                />
              </div>
              
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className={labelClasses}>Biometric ID <span className="text-red-500 ml-0.5">*</span></label>
                <input 
                  required 
                  type="text"
                  value={bioID?.toString() || ""} 
                  placeholder="e.g. 1001"
                  onChange={(e) => setBioID(e.target.value)} 
                  className={inputClasses}
                />
              </div>
            </div>

            <hr className="border-none h-[1px] bg-gray-100 my-0.5" />

            {/* Rows 5 - 8: Personal Profile Core Identity Strings */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className={labelClasses}>Surname <span className="text-red-500 ml-0.5">*</span></label>
              <input required type="text" placeholder="Enter Surname" value={surname} onChange={(e) => setSurname(e.target.value.toUpperCase())} className={inputClasses} />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className={labelClasses}>First Name <span className="text-red-500 ml-0.5">*</span></label>
              <input required type="text" placeholder="Enter First Name" value={firstname} onChange={(e) => setFirstname(e.target.value.toUpperCase())} className={inputClasses} />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className={labelClasses}>Middle Name</label>
              <input type="text" placeholder="Enter Middle Name" value={middlename} onChange={(e) => setMiddlename(e.target.value.toUpperCase())} className={inputClasses} />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className={labelClasses}>Name Extension</label>
              <input type="text" placeholder="e.g. JR, III, N/A" value={extensionname} onChange={(e) => setExtensionname(e.target.value.toUpperCase())} className={inputClasses} />
            </div>
          </div>

          {/* Bottom Actions Row Bar */}
          <div className="px-6 py-4 bg-white flex justify-end items-center gap-4 rounded-b-[24px]">
            <button 
              type="button"
              className="text-pink-500 hover:text-pink-600 font-bold text-sm bg-transparent border-none outline-none cursor-pointer transition-colors" 
              onClick={onClose}
            >
              Close
            </button>
            <button 
              type="submit" 
              className="bg-[#0070f3] hover:bg-[#0061d5] text-white font-bold text-sm rounded-[10px] px-6 h-9 shadow-sm transition-colors cursor-pointer outline-none border-none"
            >
              Save
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}