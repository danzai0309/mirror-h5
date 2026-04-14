import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import SharePage from './pages/SharePage.jsx'
import ParticleBG from './components/ParticleBG.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#09090F] text-[#E8E8F0] relative overflow-hidden">
        {/* 全局粒子背景 */}
        <ParticleBG />
        {/* 路由 */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/conflict/:taskId" element={<ReportPage />} />
          <Route path="/share/:shareId" element={<SharePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
