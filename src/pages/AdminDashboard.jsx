import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Outlet, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'

export default function AdminDashboard() {
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="d-flex min-vh-100 bg-body-tertiary">
            <Sidebar collapsed={collapsed} />

            <div className="flex-grow-1 d-flex flex-column" style={{ maxHeight: '100vh' }}>
                <nav className="navbar navbar-expand-lg border-bottom layout-header">
                    <div className="container-fluid">
                        <button className="btn border-0 btn-sm p-0" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "展開選單" : "收合選單"}>
                            <i className={`bi ${collapsed ? 'bi-text-indent-left' : 'bi-text-indent-right'} fs-4`}></i>
                        </button>

                        <div className="d-flex align-items-center gap-3">
                            <ThemeToggle />
                            <Link to="/mobile" className="btn btn-sm btn-info">
                                <i className="bi bi-phone me-1"></i>
                                進入手機端
                            </Link>
                            <button onClick={handleLogout} className="btn btn-sm btn-danger">
                                <i className="bi bi-box-arrow-right me-1"></i>
                                登出
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="flex-grow-1 container-fluid py-4 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
