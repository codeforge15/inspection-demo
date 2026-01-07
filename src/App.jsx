import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// --- 基礎頁面 ---
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'

// --- Admin 管理端頁面 ---
import TaskPlans from './pages/admin/TaskPlans'           // 新增：巡檢計畫設定 (設定清單)
import TasksManagement from './pages/admin/TasksManagement' // 調整：巡檢任務執行 (進度清單)
import RecordsManagement from './pages/admin/RecordsManagement' // 新增：巡檢紀錄總覽 (歷史紀錄)
import TemplateManagement from './pages/admin/TemplateManagement'
import FieldManagement from './pages/admin/FieldManagement'
import DeviceManagement from './pages/admin/DeviceManagement'
import DeviceTaskOverview from './pages/admin/DeviceTaskOverview'

// --- Mobile 行動端頁面 (位於 pages/mobile/) ---
import MobileApp from './pages/mobile/MobileApp'
import TaskExecutionPage from './pages/mobile/TaskExecutionPage'

/**
 * ProtectedRoute 路由守衛
 * 負責檢查登入狀態與角色權限
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSession(session)
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setRole(data?.role || 'user')
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/mobile" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>
        {/* 登入路由 */}
        <Route path="/login" element={<Login />} />

        {/* --- Admin 管理端路由組 --- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          {/* 預設導向計畫設定，區分開「設定」與「任務」 */}
          <Route index element={<Navigate to="plans" replace />} />

          {/* 巡檢核心模組 */}
          <Route path="plans" element={<TaskPlans />} />
          <Route path="tasks" element={<TasksManagement />} />
          <Route path="records" element={<RecordsManagement />} />

          {/* 基本資料管理 */}
          <Route path="templates" element={<TemplateManagement />} />
          <Route path="field" element={<FieldManagement />} />
          <Route path="device" element={<DeviceManagement />} />
          <Route path="device/:deviceId" element={<DeviceTaskOverview />} />
        </Route>

        {/* --- Mobile 行動端路由組 --- */}
        <Route
          path="/mobile"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user']}>
              <MobileApp />
            </ProtectedRoute>
          }
        />

        {/* 獨立的巡檢執行頁面 */}
        <Route
          path="/inspect/:taskId"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user']}>
              <TaskExecutionPage />
            </ProtectedRoute>
          }
        />

        {/* 萬用重定向 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App