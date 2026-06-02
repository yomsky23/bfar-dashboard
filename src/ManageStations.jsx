'use client'
import React, { useCallback, useEffect, useState } from "react"
import { Edit2, Trash2, Search, X, Flag, MapPin, Menu } from "lucide-react"
import useSWR from "swr"

// ✅ Self-contained port-5000 targeted data pipeline fetcher
const fetcher = (url) => fetch(`http://localhost:5000${url}`).then((res) => res.json());

const ManageStations = ({ isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [ID, setID] = useState(null)
  const [stationCode, setStationCode] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [search, setSearch] = useState("")
  const [loadedData, setLoadedData] = useState([])
  const [btnCommand, setBTNCommand] = useState("add")

  const {
    data: stations,
    error,
    isLoading,
    mutate,
  } = useSWR("/api/stations", fetcher)

  // Modal display toggles
  const handleOpen = () => setIsOpen(true)
  const handleClose = () => {
    setIsOpen(false)
    setID(null)
    setStationCode("")
    setDescription("")
    setAddress("")
    setBTNCommand("add")
  }

  // Type-safe search matching engine
  const searchCallback = useCallback(() => {
    const records = Array.isArray(stations) ? stations : (stations?.data || [])
    if (!records) return

    if (search) {
      const filteredData = records.filter((station) => {
        return (
          String(station.name || "").toLowerCase().includes(search.toLowerCase()) ||
          String(station.fullname || "").toLowerCase().includes(search.toLowerCase()) ||
          String(station.address || "").toLowerCase().includes(search.toLowerCase())
        )
      })
      setLoadedData(filteredData)
    } else {
      setLoadedData(records)
    }
  }, [search, stations])

  useEffect(() => {
    searchCallback()
  }, [search, searchCallback])

  useEffect(() => {
    const records = Array.isArray(stations) ? stations : (stations?.data || [])
    if (records.length > 0 || !isLoading) {
      setLoadedData(records)
    }
  }, [stations, isLoading])

  if (error) return <p className="text-red-400 p-5">Error loading base station topologies: {error.message}</p>

  const onSave = async (e) => {
    e.preventDefault()
    if (!stationCode || !description || !address) return

    const payload = {
      name: stationCode.toUpperCase(),
      fullname: description,
      address: address
    }

    if (btnCommand === "update") {
      payload.id = ID
    }

    try {
      const response = await fetch(`http://localhost:5000/api/stations`, {
        method: btnCommand === "add" ? "POST" : "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (response.ok) {
        mutate()
        handleClose()
      }
    } catch (err) {
      console.error("Station data push operation failed:", err)
    }
  }

  const handleDeleteStation = async (id, name) => {
    if (!window.confirm(`⚠️ Warning: Are you sure you want to completely remove ${name || "this station"}? Proceeding will break personnel location references.`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/stations/${id}`, { method: "DELETE" })
      if (res.ok) mutate()
    } catch (err) {
      console.error(err)
    }
  }

  // SUB-COMPONENT: Structural Organization Grid Panel Card
  const CardStation = ({ station }) => {
    const handleEditClick = () => {
      setID(station.id)
      setStationCode(station.name)
      setDescription(station.fullname)
      setAddress(station.address)
      setBTNCommand("update")
      handleOpen()
    }

    return (
      <div className="w-full bg-[#121212] border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden group hover:border-slate-700 transition-all">
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-center w-full mb-3">
            <div className="flex items-center space-x-2">
              <Flag className="h-4 w-4 text-blue-500" />
              <h1 className="font-extrabold text-white text-sm tracking-wide uppercase">{station.name}</h1>
            </div>
            <div className="flex items-center space-x-2 bg-[#1a1a1a] p-1 rounded border border-slate-800">
              <button 
                type="button"
                title="Edit Station Parameters"
                onClick={handleEditClick}
                className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button 
                type="button"
                title="Delete Base Station"
                onClick={() => handleDeleteStation(station.id, station.name)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          
          <div className="border-b border-slate-800/60 pb-2 mb-3">
            <p className="text-xs text-gray-400 font-medium italic">Full Name Description:</p>
            <p className="text-xs text-gray-200 mt-0.5 font-medium">{station.fullname || "—"}</p>
          </div>

          <div className="w-full flex-1 flex flex-col justify-end">
            <div className="flex items-start space-x-1.5 text-gray-400 bg-[#161617]/40 border border-slate-800 rounded-lg p-2.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Address</p>
                <p className="text-xs text-gray-300 mt-0.5 font-medium leading-relaxed break-words">{station.address || "No address declared."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full select-none text-gray-200 flex flex-col gap-4">
      
      {/* Localized styles injection for customized thin theme scrollbar sync */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-workspace-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-workspace-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-workspace-scrollbar::-webkit-scrollbar-thumb { background: #2b2d37; border-radius: 9999px; }
        .custom-workspace-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f4252; }
        .custom-workspace-scrollbar { scrollbar-width: thin; scrollbar-color: #2b2d37 transparent; }
      `}} />

      {/* Synchronized show menu hamburger display bar */}
      {isSidebarCollapsed && (
        <div className="flex items-center gap-2 px-1 select-none animate-in fade-in duration-150">
          <Menu 
            className="text-gray-400 cursor-pointer hover:text-white transition-colors" 
            size={18} 
            onClick={() => setIsSidebarCollapsed(false)} 
          />
          <span className="text-[11px] font-bold text-gray-500 tracking-wider">SHOW MENU</span>
        </div>
      )}
      
      {/* Filters & Actions Control Bar Panel */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#121212] p-4 rounded-xl border border-slate-800 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search station nomenclature, descriptions or addresses..."
            className="w-full bg-[#232323] border border-slate-700 text-gray-200 text-sm rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 font-medium placeholder:text-gray-500"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold">✕</button>}
        </div>
        <button
          type="button"
          onClick={() => { setBTNCommand("add"); handleOpen(); }}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md shadow-blue-900/20 whitespace-nowrap"
        >
          New Station
        </button>
      </div>

      {/* Grid Container Matrix */}
      <div className="gap-4 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 custom-workspace-scrollbar overflow-y-auto">
        {isLoading ? (
          <p className="text-xs text-gray-500 italic p-2 animate-pulse">Loading spatial base station topologies...</p>
        ) : !loadedData || loadedData.length === 0 ? (
          <p className="text-xs text-gray-500 italic p-2">No base stations matched your lookup parameters.</p>
        ) : (
          loadedData.map((station) => (
            <CardStation key={station.id} station={station} />
          ))
        )}
      </div>

      {/* CLEAN SEMANTIC DIALOG FORM MODAL CONTAINER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1d24] w-full max-w-md rounded-xl shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#23272f]">
              <h2 className="font-bold text-sm tracking-wide text-white uppercase">
                {btnCommand === "add" ? "Add New Station" : "Update Station Parameters"}
              </h2>
              <button 
                type="button" 
                onClick={handleClose} 
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSave}>
              <div className="p-4 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Station Code <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g., PFO-CAGAYAN"
                    value={stationCode}
                    onChange={(e) => setStationCode(e.target.value)}
                    className="w-full bg-[#232323] border border-slate-700 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-blue-500 font-semibold uppercase placeholder:text-gray-600"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="Full Station Name Designation"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#232323] border border-slate-700 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-blue-500 placeholder:text-gray-600"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address Location <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="Geographic street or building deployment marker"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#232323] border border-slate-700 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-blue-500 placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="flex justify-end items-center space-x-2 p-4 bg-[#23272f] border-t border-gray-700">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  className="px-4 py-2 bg-transparent hover:bg-slate-800 text-gray-400 hover:text-white text-xs font-semibold rounded-md border border-slate-700 transition-colors"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
                >
                  Save
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}

export default ManageStations;