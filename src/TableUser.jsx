// src/TableUser.jsx
import React, { useMemo } from "react";
import { LockIcon, EditIcon, Trash2Icon, ChevronLeft, ChevronRight } from "lucide-react";

export default function TableUser({ 
  dataPage, 
  isLoading, 
  page, 
  setPage, 
  pages, 
  onEdit, 
  onDelete, 
  onAccount 
}) {

  // 🛠️ CUSTOM PAGINATION STRIP BUILDER: Replicates standard navigation dots layout smoothly
  const paginationRange = useMemo(() => {
    const range = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }, [page, pages]);

  return (
    <div className="w-full overflow-x-auto select-none">
      {/* ⚡ PURE SEMANTIC STRUCTURE: Browser naturally locks row/header dimensions together */}
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="border-b border-slate-800 bg-[#1c1e24]/60">
            <th className="w-[15%] py-3.5 px-6 text-left text-[11px] font-bold tracking-widest text-gray-400 uppercase rounded-l-xl">
              Employee ID
            </th>
            <th className="w-[25%] py-3.5 px-6 text-left text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              Name
            </th>
            <th className="w-[30%] py-3.5 px-6 text-left text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              Division
            </th>
            <th className="w-[10%] py-3.5 px-6 text-center text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              Role
            </th>
            <th className="w-[10%] py-3.5 px-6 text-center text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              Status
            </th>
            <th className="w-[10%] py-3.5 px-6 text-center text-[11px] font-bold tracking-widest text-gray-400 uppercase rounded-r-xl">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="py-16 text-center">
                {/* Custom Tailwind Hardware-Accelerated Spinner */}
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-500 border-t-white" />
              </td>
            </tr>
          ) : dataPage.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-gray-500 font-medium">
                No user accounts found.
              </td>
            </tr>
          ) : (
            dataPage.map((employee) => {
              const empIdStr = employee.employeeId || "—";
              const bioIdStr = employee.biometricId || "—";
              const lastName = employee.surname || "";
              const firstName = employee.firstname || "";
              const middleName = employee.middlename || "";
              const ext = employee.extensionname && employee.extensionname !== "N/A" ? ` ${employee.extensionname}` : "";
              const fullName = `${lastName}${ext}, ${firstName} ${middleName}`;
              const currentRole = employee.role || "USER";
              const currentStatus = (employee.status || "ACTIVE").toUpperCase();
              const positionLabel = employee.tblpositions?.fullname || employee.position?.fullname || "No Position Assigned";
              
              const sData = employee.tblsections || employee.section;
              const dData = employee.tbldivisions || employee.division || sData?.tbldivisions || sData?.division;
              const stData = employee.tblstations || employee.station;
              const divNameStr = dData?.name || "";
              const isRetiredOrResigned = divNameStr.toLowerCase().includes("retire") || divNameStr.toLowerCase().includes("resign");

              return (
                <tr 
                  key={employee.id || employee.employeeId} 
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Column 1: Identifiers */}
                  <td className="py-4 px-6 align-middle">
                    <div className="flex flex-col text-left justify-center">
                      <span className="text-sm font-bold text-white tracking-wide">{empIdStr}</span>
                      <span className="text-xs text-gray-500 mt-0.5 font-semibold">{bioIdStr}</span>
                    </div>
                  </td>

                  {/* Column 2: Personal Info Profile */}
                  <td className="py-4 px-6 align-middle">
                    <div className="flex items-center gap-3 text-left justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#2a2b36] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-[#343542] transition-colors">
                        {lastName ? lastName.charAt(0) : "E"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white tracking-wide">{fullName}</span>
                        <span className="text-xs text-gray-400 mt-0.5 font-medium">{positionLabel}</span>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Corporate Placement */}
                  <td className="py-4 px-6 align-middle">
                    {dData ? (
                      <div className="flex flex-col text-left justify-center">
                        <span className="text-sm font-medium text-white">
                          {divNameStr} {sData?.name && sData.name !== "General" && !isRetiredOrResigned ? ` - ${sData.name}` : ""}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5 font-medium">{stData?.name || "No Station Assigned"}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 font-medium">—</span>
                    )}
                  </td>

                  {/* Column 4: Access System Roles */}
                  <td className="py-4 px-6 text-center align-middle">
                    <span className="text-sm font-semibold text-white tracking-wide">{currentRole}</span>
                  </td>

                  {/* Column 5: High-Contrast Pure Tailwind Status Chips */}
                  <td className="py-4 px-6 text-center align-middle">
                    <span className={`inline-flex items-center justify-center rounded-md text-[10px] font-bold px-2 py-0.5 tracking-wide uppercase border ${
                      currentStatus === "ACTIVE" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {currentStatus}
                    </span>
                  </td>

                  {/* Column 6: Custom Tooltip Action Icons */}
                  <td className="py-4 px-6 text-center align-middle">
                    <div className="flex justify-center items-center gap-4">
                      
                      {/* Tooltip Link 1 */}
                      <div className="relative group/tip">
                        <button 
                          type="button"
                          onClick={() => onAccount(employee)} 
                          className="text-amber-500 hover:text-amber-400 transition-colors p-1 hover:bg-white/5 rounded focus:outline-none"
                        >
                          <LockIcon size={16} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:block bg-zinc-800 border border-white/10 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-xl whitespace-nowrap pointer-events-none z-50">
                          Account
                        </span>
                      </div>

                      {/* Tooltip Link 2 */}
                      <div className="relative group/tip">
                        <button 
                          type="button"
                          onClick={() => onEdit(employee)} 
                          className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded focus:outline-none"
                        >
                          <EditIcon size={16} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:block bg-zinc-800 border border-white/10 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-xl whitespace-nowrap pointer-events-none z-50">
                          Edit user
                        </span>
                      </div>

                      {/* Tooltip Link 3 */}
                      <div className="relative group/tip">
                        <button 
                          type="button"
                          onClick={() => onDelete(employee.id, fullName)} 
                          className="text-rose-500 hover:text-rose-400 transition-colors p-1 hover:bg-rose-500/10 rounded focus:outline-none"
                        >
                          <Trash2Icon size={16} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:block bg-rose-600 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-xl whitespace-nowrap pointer-events-none z-50">
                          Delete user
                        </span>
                      </div>

                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* 🔢 PURE TAILWIND PAGINATION CONSOLE ROW (Perfect clone of image 250 grid style) */}
      {pages > 1 && (
        <div className="flex w-full justify-center items-center gap-1.5 pt-5 pb-2 border-t border-white/5 mt-3">
          {/* Arrow Back */}
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors focus:outline-none"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Dynamic Numeric Range */}
          {paginationRange.map((item, idx) => {
            if (item === "...") {
              return (
                <span key={`dots-${idx}`} className="px-2 text-gray-500 font-bold text-xs">
                  ...
                </span>
              );
            }
            return (
              <button
                key={`page-${item}`}
                type="button"
                onClick={() => setPage(item)}
                className={`min-w-[28px] h-7 px-1.5 flex items-center justify-center text-xs font-bold rounded-lg transition-all focus:outline-none ${
                  page === item 
                    ? "bg-[#0070f3] text-white shadow-md font-extrabold scale-105" 
                    : "bg-transparent text-gray-400 hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          })}

          {/* Arrow Next */}
          <button
            type="button"
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors focus:outline-none"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}