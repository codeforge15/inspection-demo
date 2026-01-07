import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom' // 用於頁面跳轉
import { supabase } from '../../supabaseClient'
import Pagination from '../../components/Pagination'

export default function MobileView() {
    const navigate = useNavigate()

    // --- 狀態管理 ---
    const [activeTab, setActiveTab] = useState('daily') // 'daily' | 'history'
    const [pendingTasks, setPendingTasks] = useState([])
    const [historyRecords, setHistoryRecords] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [loading, setLoading] = useState(false)

    // --- 初始化讀取 ---
    useEffect(() => {
        refreshData()
    }, [activeTab])

    const refreshData = () => {
        if (activeTab === 'daily') {
            fetchPendingTasks()
        } else {
            fetchHistory()
        }
    }

    // 撈取待辦任務 (status = 'pending')
    const fetchPendingTasks = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('tasks')
            .select(`*, assets(name, location, type)`)
            .eq('status', 'pending')
            .order('assigned_date', { ascending: true })

        if (!error && data) setPendingTasks(data)
        setLoading(false)
    }

    // 撈取歷史紀錄 (由 records 表關聯 tasks)
    const fetchHistory = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('records')
            .select(`*, tasks(assigned_date, assets(name))`)
            .order('submitted_at', { ascending: false })

        if (!error && data) setHistoryRecords(data)
        setLoading(false)
    }

    // --- 事件處理 ---
    const handleInspect = (taskId) => {
        // 跳轉至巡檢執行頁面，並帶上任務 ID
        navigate(`/inspect/${taskId}`)
    }

    // 計算分頁資料
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentTasks = pendingTasks.slice(indexOfFirstItem, indexOfLastItem)

    return (
        <div className="pb-5 bg-light min-vh-100">
            {/* 頂部固定頁籤 (Sticky Tabs) */}
            <div className="bg-white sticky-top border-bottom mb-3 pt-2 shadow-sm">
                <ul className="nav nav-pills nav-fill">
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-0 ${activeTab === 'daily' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('daily')
                                setCurrentPage(1)
                            }}
                        >
                            <i className="bi bi-clipboard-check me-2"></i>每日任務
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-0 ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <i className="bi bi-clock-history me-2"></i>任務紀錄
                        </button>
                    </li>
                </ul>
            </div>

            <div className="container">
                {loading ? (
                    <div className="text-center mt-5">載入中...</div>
                ) : (
                    <>
                        {/* 1. 每日任務列表 */}
                        {activeTab === 'daily' && (
                            <div className="row g-3">
                                {pendingTasks.length === 0 ? (
                                    <div className="text-center text-muted mt-5">目前無待辦任務</div>
                                ) : (
                                    currentTasks.map(task => (
                                        <div className="col-12" key={task.id}>
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h5 className="card-title text-primary mb-0">{task.assets?.name}</h5>
                                                        <span className="badge bg-secondary-subtle text-secondary">{task.assets?.type}</span>
                                                    </div>
                                                    <p className="card-text mb-1 text-dark">
                                                        <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                                                        {task.assets?.location || '無位置資訊'}
                                                    </p>
                                                    <p className="card-text text-muted small">
                                                        預計日期: {task.assigned_date}
                                                    </p>
                                                    <button
                                                        className="btn btn-primary w-100 mt-2 py-2 fw-bold"
                                                        onClick={() => handleInspect(task.id)}
                                                    >
                                                        開始巡檢
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* 分頁組件 */}
                                {pendingTasks.length > itemsPerPage && (
                                    <div className="col-12 pb-4">
                                        <Pagination
                                            itemsPerPage={itemsPerPage}
                                            totalItems={pendingTasks.length}
                                            paginate={(num) => setCurrentPage(num)}
                                            currentPage={currentPage}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. 歷史紀錄列表 */}
                        {activeTab === 'history' && (
                            <div className="list-group shadow-sm">
                                {historyRecords.length === 0 ? (
                                    <div className="text-center text-muted mt-5">無歷史紀錄</div>
                                ) : (
                                    historyRecords.map(record => (
                                        <div key={record.id} className="list-group-item list-group-item-action border-0 border-bottom py-3">
                                            <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                                                <h6 className="mb-0 fw-bold">{record.tasks?.assets?.name}</h6>
                                                <small className="text-muted">
                                                    {new Date(record.submitted_at).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <p className="mb-0 small text-muted">
                                                    結果：
                                                    <span className={record.result === 'pass' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                                        {record.result === 'pass' ? '合格' : '不合格'}
                                                    </span>
                                                </p>
                                                {record.notes && <small className="text-muted italic">{record.notes}</small>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}