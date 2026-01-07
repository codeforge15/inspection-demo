import { NavLink, Link } from 'react-router-dom'

export default function Sidebar({ collapsed }) {
    // 定義選單內容
    const menu = [
        { path: '/admin/plans', name: '巡檢計畫設定', icon: 'bi bi-calendar-check' },
        { path: '/admin/tasks', name: '任務執行進度', icon: 'bi bi-activity' },
        { path: '/admin/records', name: '巡檢紀錄總覽', icon: 'bi bi-journal-text' },
        { path: '/admin/templates', name: '模板管理', icon: 'bi bi-file-earmark-text' },
        { path: '/admin/field', name: '場域管理', icon: 'bi bi-geo-alt' },
        { path: '/admin/device', name: '設備管理', icon: 'bi bi-tools' },
    ]

    return (
        <div className="d-flex flex-column flex-shrink-0 bg-body-tertiary border-end vh-100"
            style={{ width: collapsed ? '80px' : '280px', transition: 'width 0.3s' }}>
            <nav className="navbar border-bottom px-2">
                <Link to="/admin" className="d-flex align-items-center link-body-emphasis text-decoration-none">
                    <i className="bi bi-shield-lock-fill fs-4 text-primary"></i>
                    {!collapsed && <span className="fw-bold fs-5 ms-2">巡檢系統</span>}
                </Link>
            </nav>
            <ul className="nav nav-pills flex-column mb-auto p-3">
                {menu.map((item) => (
                    <li className="nav-item" key={item.path}>
                        <NavLink to={item.path} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-body-emphasis'}`}>
                            <i className={`${item.icon} ${collapsed ? 'fs-4' : 'me-2'}`}></i>
                            {!collapsed && item.name}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    )
}