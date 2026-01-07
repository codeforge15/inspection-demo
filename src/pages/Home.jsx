import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import PCView from '../components/PCView'
import MobileView from '../components/MobileView'

export default function Home() {
    const [profile, setProfile] = useState(null)
    const [viewMode, setViewMode] = useState('pc') // pc | mobile
    const navigate = useNavigate()

    useEffect(() => {
        const getProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/login')
                return
            }
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            if (data) setProfile(data)
        }
        getProfile()
    }, [navigate])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    if (!profile) return null

    return (
        <div className="min-vh-100">
            {/* Top Navigation */}
            <nav className="navbar navbar-dark bg-dark sticky-top shadow-sm">
                <div className="container-fluid">
                    <span className="navbar-brand mb-0 h1">巡檢系統</span>

                    <div className="d-flex gap-2 align-items-center">
                        {/* View Switcher */}
                        <div className="btn-group me-3" role="group">
                            <button
                                type="button"
                                className={`btn btn-sm ${viewMode === 'pc' ? 'btn-light' : 'btn-light'}`}
                                onClick={() => setViewMode('pc')}
                            >
                                電腦端
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${viewMode === 'mobile' ? 'btn-light' : 'btn-light'}`}
                                onClick={() => setViewMode('mobile')}
                            >
                                手機端
                            </button>
                        </div>

                        <button onClick={handleLogout} className="btn btn-secondary btn-sm text-light">
                            登出
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className={viewMode === 'pc' ? 'container mt-4' : ''}>
                {viewMode === 'pc' ? <PCView /> : <MobileView />}
            </div>
        </div>
    )
}