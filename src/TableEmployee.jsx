// src/TableEmployee.jsx
import React, { useState, useEffect } from 'react';
import { Search, Printer, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import PdfDTR from './PdfDTR';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

export default function TableEmployee({ employees, dtrRecords, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedYear, setSelectedYear] = useState('2026');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // 🛠️ FIXED: Placed explicitly here at the top so it's guaranteed to be in scope for the rows
  const handleViewDTR = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, selectedYear]);

  // Safe fallback guard type verification check
  const employeeDataArray = Array.isArray(employees) ? employees : [];

  // ==========================================
  // FIXED FILTER LOGIC
  // ==========================================
  const filteredEmployees = employeeDataArray.filter((emp) => {
    if (!emp) return false;
    const search = searchTerm.toLowerCase();
    
    if (!search) return true;

    return (
      (emp.EmployeeId && emp.EmployeeId.toLowerCase().includes(search)) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(search)) ||
      (emp.Surname && emp.Surname.toLowerCase().includes(search)) ||
      (emp.surname && emp.surname.toLowerCase().includes(search)) ||
      (emp.FirstName && emp.FirstName.toLowerCase().includes(search)) ||
      (emp.firstname && emp.firstname.toLowerCase().includes(search)) ||
      (emp.BioId && emp.BioId.toString().includes(search)) ||
      (emp.biometricId && emp.biometricId.toString().includes(search))
    );
  });

  // Calculate current rows to show
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  // BROADCATCHER EVENT HOOK: Listens for parent window signals to flip pages with arrow keys
  useEffect(() => {
    const handlePrevPageSignal = () => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPageSignal = () => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1));
    };

    window.addEventListener("attendance-page-prev", handlePrevPageSignal);
    window.addEventListener("attendance-page-next", handleNextPageSignal);

    return () => {
      window.removeEventListener("attendance-page-prev", handlePrevPageSignal);
      window.removeEventListener("attendance-page-next", handleNextPageSignal);
    };
  }, [totalPages]);

  // Helper to generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-[#121212] rounded-xl border border-slate-800 p-5 select-none">
      
      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <span className="text-sm font-medium text-gray-400 tracking-wider">FILTER</span>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Biometric ID, by Employee Id, by Surname or Firstname..." 
            className="w-full bg-[#232323] border border-slate-700 text-gray-200 text-sm rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <button type="button" onClick={() => setSearchTerm('')} className="px-6 py-2 bg-[#2a2a2b] hover:bg-[#3f3f46] text-gray-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors">
          Clear
        </button>
      </div>

      {/* Dropdowns & Print All */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-3">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-[#232323] border border-slate-700 text-gray-200 text-sm rounded-lg py-2 px-4 pr-8 focus:outline-none focus:border-blue-500 appearance-none min-w-[160px] cursor-pointer font-semibold">
            {MONTHS.map(month => <option key={month} value={month}>{month}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-[#232323] border border-slate-700 text-gray-200 text-sm rounded-lg py-2 px-4 pr-8 focus:outline-none focus:border-blue-500 appearance-none min-w-[160px] cursor-pointer font-semibold">
            {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <button type="button" className="flex items-center px-6 py-2 bg-[#2a2a2b] hover:bg-[#3f3f46] text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors">
          <Printer className="h-4 w-4 mr-2" /> Print All
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap table-fixed">
          <thead className="bg-[#232323] text-xs text-white font-semibold border-b border-slate-700">
            <tr>
              <th className="w-[8%] px-5 py-4">ID</th>
              <th className="w-[17%] px-5 py-4">Employee ID</th>
              <th className="w-[10%] px-5 py-4">Bio ID</th>
              <th className="w-[18%] px-5 py-4">Surname</th>
              <th className="w-[18%] px-5 py-4">First Name</th>
              <th className="w-[14%] px-5 py-4">Middle Name</th>
              <th className="w-[10%] px-5 py-4">Status</th>
              <th className="w-[10%] px-5 py-4 text-center">Print DTR</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="8" className="px-5 py-12 text-center text-gray-500 italic bg-[#1a1a1a]">Loading employees...</td></tr>
            ) : currentEmployees.length > 0 ? (
              currentEmployees.map((emp, index) => {
                const currentStatus = (emp.Status || emp.status || "ACTIVE").toUpperCase();

                return (
                  <tr key={emp.id || index} className="border-b border-slate-800 hover:bg-[#1f1f1f] transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-500">{emp.id || (indexOfFirstRow + index + 1)}</td>
                    <td className="px-5 py-4 font-bold text-white tracking-wide">{emp.EmployeeId || emp.employeeId}</td>
                    <td className="px-5 py-4 font-semibold">{emp.BioId || emp.biometricId || emp.bioId}</td>
                    <td className="px-5 py-4 font-medium">{emp.Surname || emp.surname}</td>
                    <td className="px-5 py-4 font-medium">{emp.FirstName || emp.firstname}</td>
                    <td className="px-5 py-4 font-medium">{emp.MiddleName || emp.middlename || "—"}</td>
                    
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${
                        currentStatus === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {currentStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button 
                        type="button" 
                        onClick={() => handleViewDTR(emp)} 
                        className="p-2 bg-[#2a2a2b] hover:bg-[#3f3f46] rounded border border-slate-700 transition-colors outline-none focus:outline-none cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-gray-300" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="8" className="px-5 py-12 text-center text-gray-500 italic bg-[#1a1a1a]">No employees match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-1.5 mt-6">
          <button type="button" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2b] disabled:opacity-30 transition-colors focus:outline-none"><ChevronLeft className="h-4 w-4" /></button>
          {getPageNumbers().map((number, idx) => (
            number === '...' ? <span key={`ellipsis-${idx}`} className="px-2 text-gray-500 font-bold text-xs">...</span> :
            <button type="button" key={`page-${number}`} onClick={() => setCurrentPage(number)} className={`min-w-[28px] h-7 px-1.5 flex items-center justify-center rounded-md text-xs font-bold transition-all focus:outline-none ${currentPage === number ? 'bg-blue-600 text-white shadow-md font-extrabold scale-105' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2b]'}`}>{number}</button>
          ))}
          <button type="button" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2b] disabled:opacity-30 transition-colors focus:outline-none"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      <PdfDTR 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employee={selectedEmployee} 
        month={selectedMonth} 
        year={selectedYear} 
        dtrRecords={dtrRecords} 
      />
    </div>
  );
}