import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        // 1. 執行登入
        const { data: { session }, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert(error.message)
            setLoading(false)
            return
        }

        // 2. 登入成功後，查詢角色權限
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        // 3. 根據角色導向不同頁面
        if (profile?.role === 'admin') {
            navigate('/admin') // 管理員去後台
        } else {
            navigate('/mobile') // 一般員工去手機端
        }

        setLoading(false)
    }

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-body-tertiary position-relative">
            <div className="position-absolute top-0 end-0 p-3">
                <ThemeToggle />
            </div>

            <div className="card shadow border-0 p-4" style={{ width: '400px' }}>
                <h4 className="text-center mb-4 text-primary">巡檢系統登入</h4>
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label text-muted">Email</label>
                        <input
                            type="email"
                            className="form-control form-control-lg"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label text-muted">密碼</label>
                        <input
                            type="password"
                            className="form-control form-control-lg"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
                        {loading ? '處理中...' : '登入系統'}
                    </button>
                </form>
            </div>
        </div>
    )
}
