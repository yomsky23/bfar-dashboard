// src/AttendanceManagement.jsx
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import TableEmployee from './TableEmployee'; 
import TableRecords from './TableRecords'; 

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState('records');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Database States ---
  const [timeLogs, setTimeLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dtrRecords, setDtrRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Sync & Upload States ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch Data Function
  const fetchDatabaseRecords = async () => {
    try {
      setIsLoading(true);
      const logsRes = await fetch('http://localhost:5000/api/timelogs');
      setTimeLogs(await logsRes.json());

      const empRes = await fetch('http://localhost:5000/api/employees');
      setEmployees(await empRes.json());
      
      const dtrRes = await fetch('http://localhost:5000/api/dtr');
      setDtrRecords(await dtrRes.json());
    } catch (error) {
      console.error("Failed to connect to backend:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on initial load
  useEffect(() => {
    fetchDatabaseRecords();
  }, []);

  // 🛠️ KEYBOARD DIRECTIONAL NAVIGATION LISTENER
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement?.tagName;
      if (activeEl === "INPUT" || activeEl === "SELECT" || activeEl === "TEXTAREA") {
        return;
      }

      if (e.key === "ArrowLeft") {
        window.dispatchEvent(new CustomEvent("attendance-page-prev"));
      } else if (e.key === "ArrowRight") {
        window.dispatchEvent(new CustomEvent("attendance-page-next"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Automated CrossChex Sync Handler (Date Range)
  const handleDownloadCrossChex = async () => {
    if (!startDate || !endDate) {
      alert("⚠️ Please select both a start date and an end date.");
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('http://localhost:5000/api/sync-crosschex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        fetchDatabaseRecords(); 
      } else {
        alert(`❌ Failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error("Download Error:", error);
      alert("⚠️ Network error: Could not connect to the server.");
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Manual File Upload Handlers (BAK.KQ)
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      alert("⚠️ Please choose a BAK.KQ file first.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('bakFile', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/api/upload-bak', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        setSelectedFile(null); 
        fetchDatabaseRecords(); 
      } else {
        alert(`❌ Failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("⚠️ Network error: Could not connect to the server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0a0a0a]">
      
      {/* Left Sidebar */}
      <aside className={`bg-black border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-56' : 'w-16'}`}>
        <div className={`flex items-center p-4 border-b border-slate-800 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {isSidebarOpen && <h2 className="font-bold text-white text-sm tracking-wide whitespace-nowrap">Time Attendance</h2>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white transition-colors focus:outline-none">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col p-2 space-y-1 overflow-hidden">
          {isSidebarOpen && (
            <>
              <button onClick={() => setActiveTab('records')} className={`px-4 py-2 text-sm text-left rounded transition-colors ${activeTab === 'records' ? 'text-white bg-slate-800' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}>Records</button>
              <button onClick={() => setActiveTab('dtr')} className={`px-4 py-2 text-sm text-left rounded transition-colors ${activeTab === 'dtr' ? 'text-white bg-slate-800' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}>DTR</button>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        
        {/* Tab 1: Records View Dashboard */}
        {activeTab === 'records' && (
          <div>
            <div className="mb-8 space-y-6">
              {/* Automated Sync Section */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Download Records Manage Devices and Employees in <a href="https://us.crosschexcloud.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline cursor-pointer">CrossChex Cloud</a></p>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-[#18181b] border border-slate-700 rounded px-3 py-1.5">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isSyncing} className="bg-transparent text-sm text-gray-300 outline-none" />
                    <span className="text-gray-500 mx-2">-</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isSyncing} className="bg-transparent text-sm text-gray-300 outline-none" />
                  </div>
                  <button onClick={handleDownloadCrossChex} disabled={isSyncing} className="px-5 py-2 bg-[#2a2a2b] hover:bg-[#3f3f46] text-white text-sm font-medium rounded border border-slate-700 transition-colors disabled:opacity-50">
                    {isSyncing ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>

              {/* Manual Upload Section */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Manual uploading record using the BAK.KQ file from the device.</p>
                <div className="flex items-center space-x-3">
                  <input type="file" accept=".kq, .bak, .csv" onChange={handleFileChange} disabled={isUploading} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#2a2a2b] file:text-white hover:file:bg-[#3f3f46] bg-[#18181b] border border-slate-700 rounded cursor-pointer transition-colors disabled:opacity-50" />
                  <button onClick={handleUploadClick} disabled={isUploading || !selectedFile} className="px-5 py-2 bg-[#2a2a2b] hover:bg-[#3f3f46] text-white text-sm font-medium rounded border border-slate-700 transition-colors disabled:opacity-50">
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>

            <TableRecords timeLogs={timeLogs} isLoading={isLoading} />
          </div>
        )}

        {/* Tab 2: Daily Time Records (DTR) Personnel Grid */}
        {activeTab === 'dtr' && (
          <div>
            <h2 className="text-lg font-medium text-white mb-6">Daily Time Record/s</h2>
            <TableEmployee employees={employees} dtrRecords={dtrRecords} isLoading={isLoading} />
          </div>
        )}
      </div>
    </div>
  );
}