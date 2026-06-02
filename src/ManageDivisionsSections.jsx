// src/ManageDivisionsSections.jsx
'use client'
import React, { useCallback, useEffect, useState } from "react"
import { Edit2, Trash2, PlusSquare, Search, X, Folder, Layers, Menu } from "lucide-react"
import useSWR from "swr"

const fetcher = (url) => fetch(`http://localhost:5000${url}`).then((res) => res.json());

const ManageDivisionsSections = ({ isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [ID, setID] = useState(null)
  const [divisionCode, setDivisionCode] = useState("")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [loadedData, setLoadedData] = useState([])
  const [btnCommand, setBTNCommand] = useState("add")

  const [sectionID, setSectionID] = useState(null)
  const [sectionCode, setSectionCode] = useState("")
  const [sectionDesc, setSectionDesc] = useState("")

  const {
    data: divisions,
    error,
    isLoading,
    mutate,
  } = useSWR("/api/divisions", fetcher)

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => {
    setIsOpen(false)
    setDivisionCode("")
    setDescription("")
    setSectionCode("")
    setSectionDesc("")
  }

  const searchCallback = useCallback(() => {
    if (!divisions?.data) return

    if (search) {
      const filteredData = divisions.data.filter((division) => {
        const matchesDivision = 
          division.name?.toLowerCase().includes(search.toLowerCase()) ||
          division.fullname?.toLowerCase().includes(search.toLowerCase());
        
        const matchesSection = division.sections?.some((section) => 
          section.name?.toLowerCase().includes(search.toLowerCase()) ||
          section.fullname?.toLowerCase().includes(search.toLowerCase())
        );

        return matchesDivision || matchesSection;
      })
      setLoadedData(filteredData)
    } else {
      setLoadedData(divisions.data)
    }
  }, [search, divisions])

  useEffect(() => {
    searchCallback()
  }, [search, searchCallback])

  useEffect(() => {
    if (divisions?.data) {
      setLoadedData(divisions.data)
    }
  }, [divisions])

  if (error) return <p className="text-red-400 p-5">Error loading organization topology layout: {error.message}</p>

  const onSave = async (e) => {
    e.preventDefault()
    
    if (btnCommand === "add" || btnCommand === "update") {
      if (!divisionCode || !description) return
    } else {
      if (!sectionCode || !sectionDesc) return
    }

    // ✅ FIXED: Targeted absolute backend port 5000 address
    let endpoint = "http://localhost:5000/api/divisions"
    let method = "POST"
    let bodyPayload = {}

    if (btnCommand === "add") {
      bodyPayload = { name: divisionCode.toUpperCase(), fullname: description }
    } else if (btnCommand === "update") {
      method = "PUT"
      bodyPayload = { id: ID, name: divisionCode.toUpperCase(), fullname: description }
    } else if (btnCommand === "addSection") {
      endpoint = "http://localhost:5000/api/sections"
      bodyPayload = { name: sectionCode.toUpperCase(), fullname: sectionDesc, divisionId: ID }
    } else if (btnCommand === "updateSection") {
      endpoint = "http://localhost:5000/api/sections"
      method = "PUT"
      bodyPayload = { id: sectionID, name: sectionCode.toUpperCase(), fullname: sectionDesc, divisionId: ID }
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      })
      
      if (response.ok) {
        mutate()
        setBTNCommand("add")
        setID(null)
        handleClose()
      }
    } catch (err) {
      console.error("Mutation failure state error:", err)
    }
  }

  const handleDeleteDivision = async (id) => {
    if (!window.confirm("⚠️ Warning: Deleting this division will break references for assigned units and personnel. Proceed?")) return
    try {
      // ✅ FIXED: Targeted absolute backend port 5000 address
      const res = await fetch(`http://localhost:5000/api/divisions/${id}`, { method: "DELETE" })
      if (res.ok) mutate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteSection = async (id) => {
    if (!window.confirm("Are you sure you want to remove this section?")) return
    try {
      // ✅ FIXED: Targeted absolute backend port 5000 address
      const res = await fetch(`http://localhost:5000/api/sections/${id}`, { method: "DELETE" })
      if (res.ok) mutate()
    } catch (err) {
      console.error(err)
    }
  }

  const onAddSection = (id) => {
    setID(id)
    setBTNCommand("addSection")
    handleOpen()
  }

  const CardDivision = ({ division }) => {
    const handleEditClick = () => {
      setID(division.id)
      setDivisionCode(division.name)
      setDescription(division.fullname)
      setBTNCommand("update")
      handleOpen()
    }

    return (
      <div className="w-full bg-[#121212] border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden group hover:border-slate-700 transition-all">
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-center w-full mb-3">
            <div className="flex items-center space-x-2">
              <Folder className="h-4 w-4 text-blue-500" />
              <h1 className="font-extrabold text-white text-sm tracking-wide uppercase">{division.name}</h1>
            </div>
            <div className="flex items-center space-x-2 bg-[#1a1a1a] p-1 rounded border border-slate-800">
              <button 
                type="button"
                title="Edit Division"
                onClick={handleEditClick}
                className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button 
                type="button"
                title="Delete Division"
                onClick={() => handleDeleteDivision(division.id)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          
          <div className="border-b border-slate-800/60 pb-2 mb-3">
            <p className="text-xs text-gray-400 font-medium italic">Description:</p>
            <p className="text-xs text-gray-200 mt-0.5 font-medium">{division.fullname || "—"}</p>
          </div>

          <div className="w-full flex-1 flex flex-col">
            <div className="flex bg-[#232323] w-full justify-between items-center px-3 py-1.5 rounded-t border border-slate-700 font-bold text-white text-xs tracking-wider">
              <div className="flex items-center space-x-1.5">
                <Layers className="h-3 w-3 text-emerald-400" />
                <span>UNIT / SECTIONS</span>
              </div>
              <button 
                type="button"
                title="Add New Section"
                onClick={() => onAddSection(division.id)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <PlusSquare className="h-4 w-4" />
              </button>
            </div>

            {/* ✅ CONNECTED: Replaced standard tracking engine class with the unified scroll class */}
            <div className="border border-t-0 border-slate-700 rounded-b divide-y divide-slate-800 bg-[#161617]/40 max-h-[180px] overflow-y-auto custom-workspace-scrollbar">
              {!division.sections || division.sections.length === 0 ? (
                <p className="text-center text-[11px] text-gray-600 italic py-4">No sections allocated.</p>
              ) : (
                division.sections.map((section) => (
                  <div key={section.id} className="flex w-full justify-between items-center p-2.5 hover:bg-[#1a1a1c] transition-colors group/sec">
                    <div className="overflow-hidden pr-2">
                      <p className="font-bold text-xs text-white tracking-wide uppercase">{section.name}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{section.fullname}</p>
                    </div>
                    <div className="flex items-center space-x-1 opacity-40 group-hover/sec:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => {
                          setSectionCode(section.name)
                          setSectionDesc(section.fullname)
                          setID(division.id)
                          setSectionID(section.id)
                          setBTNCommand("updateSection")
                          handleOpen()
                        }}
                        className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full select-none text-gray-200 flex flex-col gap-4">
      
      {/* 🧬 UNIFIED ULTRA-THIN WORKSPACE SCROLLBAR DESCRIPTIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-workspace-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-workspace-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-workspace-scrollbar::-webkit-scrollbar-thumb { background: #2b2d37; border-radius: 9999px; }
        .custom-workspace-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f4252; }
        .custom-workspace-scrollbar { scrollbar-width: thin; scrollbar-color: #2b2d37 transparent; }
      `}} />

      {/* Hamburger menu layout row toggler */}
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
      
      {/* Main Filter Command Search Bar Ribbon Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#121212] p-4 rounded-xl border border-slate-800 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search divisions or sub-sections..."
            className="w-full bg-[#232323] border border-slate-700 text-gray-200 text-sm rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 font-medium placeholder:text-gray-500"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold">✕</button>}
        </div>
        <button
          type="button"
          onClick={() => { setBTNCommand("add"); handleOpen(); }}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md shadow-blue-900/20 whitespace-nowrap"
        >
          New Division
        </button>
      </div>

      {/* Division Cards Output Matrix Area Grid */}
      <div className="gap-4 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-xs text-gray-500 italic p-2 animate-pulse">Loading divisions framework topology...</p>
        ) : (
          loadedData && loadedData.map((division) => (
            <CardDivision key={division.id} division={division} />
          ))
        )}
      </div>

      {/* WORKSPACE ACTIONS MODAL PORTAL SHEET */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1d24] w-full max-w-md rounded-xl shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#23272f]">
              <h2 className="font-bold text-sm tracking-wide text-white uppercase">
                {btnCommand === "add" && "Add New Division"}
                {btnCommand === "update" && "Update Division parameters"}
                {btnCommand === "addSection" && "Add New Unit Section"}
                {btnCommand === "updateSection" && "Update Section Data"}
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
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {(btnCommand === "add" || btnCommand === "update") ? "Division Code" : "Section Code"} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder={(btnCommand === "add" || btnCommand === "update") ? "e.g., FMRED" : "e.g., HRMS"}
                    value={(btnCommand === "add" || btnCommand === "update") ? divisionCode : sectionCode}
                    onChange={(e) => (btnCommand === "add" || btnCommand === "update") ? setDivisionCode(e.target.value) : setSectionCode(e.target.value)}
                    className="w-full bg-[#232323] border border-slate-700 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-blue-500 font-semibold uppercase placeholder:text-gray-600"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="Full Structural Description Name"
                    value={(btnCommand === "add" || btnCommand === "update") ? description : sectionDesc}
                    onChange={(e) => (btnCommand === "add" || btnCommand === "update") ? setDescription(e.target.value) : setSectionDesc(e.target.value)}
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

export default ManageDivisionsSections;