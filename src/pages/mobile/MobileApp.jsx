import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import MobileView from './MobileView'
import ThemeToggle from '../../components/ThemeToggle'

export default function MobileApp() {
    const navigate = useNavigate()
    const [isAdmin, setIsAdmin] = useState(false) // 用來判斷是否顯示後台按鈕

    // 檢查權限
    useEffect(() => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                if (data?.role === 'admin') {
                    setIsAdmin(true)
                }
            }
        }
        checkRole()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="bg-body-tertiary min-vh-100">
            <nav className="navbar sticky-top shadow-sm px-3">
                <span className="navbar-brand mb-0 h1">每日巡檢</span>
                <div className="d-flex align-items-center gap-2">
                    <ThemeToggle />
                    {/* 只有 Admin 才看得到這個按鈕 */}
                    {isAdmin && (
                        <Link to="/admin" className="btn btn-info btn-sm text-white">
                            <i className="bi bi-pc-display"></i> 後台
                        </Link>
                    )}
                    <button onClick={handleLogout} className="btn btn-primary border-white btn-sm">
                        登出
                    </button>
                </div>
            </nav>

            <MobileView />
        </div>
    )
}