// src/TableRecords.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TableRecords({ timeLogs, isLoading }) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const logsArray = Array.isArray(timeLogs) ? timeLogs : [];
  
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentLogs = logsArray.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(logsArray.length / rowsPerPage);

  useEffect(() => {
    const handlePrevPageSignal = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPageSignal = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1));

    window.addEventListener("attendance-page-prev", handlePrevPageSignal);
    window.addEventListener("attendance-page-next", handleNextPageSignal);
    return () => {
      window.removeEventListener("attendance-page-prev", handlePrevPageSignal);
      window.removeEventListener("attendance-page-next", handleNextPageSignal);
    };
  }, [totalPages]);

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
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap table-fixed">
          <thead className="bg-[#232323] text-xs text-white font-semibold border-b border-slate-700">
            <tr>
              <th className="w-[10%] px-5 py-4">ID</th>
              <th className="w-[20%] px-5 py-4">User ID</th>
              <th className="w-[25%] px-5 py-4">DateLog</th>
              <th className="w-[25%] px-5 py-4">TimeLog</th>
              <th className="w-[20%] px-5 py-4">Reader ID</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" className="px-5 py-12 text-center text-gray-500 italic bg-[#1a1a1a]">Loading database records...</td></tr>
            ) : currentLogs.length > 0 ? (
              currentLogs.map((log, index) => (
                <tr key={log.id || index} className="border-b border-slate-800 hover:bg-[#1f1f1f] transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-500">{log.id || (indexOfFirstRow + index + 1)}</td>
                  <td className="px-5 py-4 font-bold text-white tracking-wide">{log.userId || log.user_id || log.UserId || "—"}</td>
                  <td className="px-5 py-4 font-medium text-blue-400">{log.dateLog || log.datelog || log.DateLog || "—"}</td>
                  <td className="px-5 py-4 font-medium text-gray-400">{log.timeLog || log.timelog || log.TimeLog || "—"}</td>
                  <td className="px-5 py-4 font-semibold text-zinc-500">{log.readerId || log.reader_id || log.ReaderId || "BAK.KQ"}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="px-5 py-12 text-center text-gray-500 italic bg-[#1a1a1a]">No biometric logs available.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-1.5 mt-6">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2b] disabled:opacity-30 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          {getPageNumbers().map((number, idx) => (
            number === '...' ? <span key={`ellipsis-${idx}`} className="px-2 text-gray-500 font-bold text-xs">...</span> :
            <button key={`page-${number}`} onClick={() => setCurrentPage(number)} className={`min-w-[28px] h-7 px-1.5 flex items-center justify-center rounded-md text-xs font-bold transition-all ${currentPage === number ? 'bg-blue-600 text-white shadow-md font-extrabold scale-105' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2b]'}`}>{number}</button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2b] disabled:opacity-30 transition-colors"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}