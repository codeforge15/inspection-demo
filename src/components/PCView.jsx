import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Modal } from 'bootstrap'

export default function PCView({ activeTab }) {
    const [assets, setAssets] = useState([])
    const [tasks, setTasks] = useState([])

    // 新增資產相關 State
    const [modalInstance, setModalInstance] = useState(null)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        type: 'field',
        location: ''
    })

    useEffect(() => {
        fetchAssets()
        fetchTasks()

        // 初始化 Modal
        const modalEl = document.getElementById('assetModal')
        if (modalEl) {
            setModalInstance(new Modal(modalEl))
        }
    }, [])

    const fetchAssets = async () => {
        const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false })
        if (data) setAssets(data)
    }

    const fetchTasks = async () => {
        const { data } = await supabase
            .from('tasks')
            .select(`*, assets(name, type)`)
            .order('assigned_date', { ascending: false })
        if (data) setTasks(data)
    }

    // 表單處理
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleOpenModal = () => {
        setFormData({ name: '', type: 'field', location: '' })
        modalInstance?.show()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.from('assets').insert([formData])

        if (error) {
            alert(error.message)
        } else {
            fetchAssets()
            modalInstance?.hide()
        }
        setLoading(false)
    }

    return (
        <div className="card shadow-sm">
            <div className="card-body">
                {activeTab === 'assets' && (
                    <div>
                        <div className="d-flex justify-content-between mb-3">
                            <h5 className="card-title text-primary">
                                <i className="bi bi-building-gear me-2"></i>
                                場域與設備列表
                            </h5>
                            <button className="btn btn-primary btn-sm" onClick={handleOpenModal}>
                                <i className="bi bi-plus-lg me-1"></i>
                                新增資產
                            </button>
                        </div>
                        <table className="table table-bordered align-middle">
                            <thead>
                                <tr>
                                    <th>名稱</th>
                                    <th>類型</th>
                                    <th>位置</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map(asset => (
                                    <tr key={asset.id}>
                                        <td>{asset.name}</td>
                                        <td>
                                            <span>
                                                {asset.type === 'field' ? '場域' : '設備'}
                                            </span>
                                        </td>
                                        <td>{asset.location || '-'}</td>
                                        <td>
                                            <button className="btn btn-sm btn-primary me-2">編輯</button>
                                            <button className="btn btn-sm btn-danger">刪除</button>
                                        </td>
                                    </tr>
                                ))}
                                {assets.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted p-4">尚無資產資料</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div>
                        <div className="d-flex justify-content-between mb-3">
                            <h5 className="card-title text-primary">
                                <i className="bi bi-list-check me-2"></i>
                                巡檢任務列表
                            </h5>
                            <button className="btn btn-primary btn-sm">
                                <i className="bi bi-plus-lg me-1"></i>
                                指派新任務
                            </button>
                        </div>
                        <table className="table table-bordered align-middle">
                            <thead>
                                <tr>
                                    <th>預計日期</th>
                                    <th>巡檢對象</th>
                                    <th>類型</th>
                                    <th>狀態</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id}>
                                        <td>{task.assigned_date}</td>
                                        <td>{task.assets?.name}</td>
                                        <td>
                                            <span>
                                                {task.assets?.type === 'field' ? '場域' : '設備'}
                                            </span>
                                        </td>
                                        <td>
                                            <span>
                                                {task.status === 'completed' ? '已完成' : '待巡檢'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-primary">詳情</button>
                                        </td>
                                    </tr>
                                ))}
                                {tasks.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted p-4">尚無任務資料</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal 組件 */}
            <div className="modal fade" id="assetModal" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">新增資產</h5>
                            <button type="button" className="btn-close" onClick={() => modalInstance?.hide()}></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">名稱</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">類型</label>
                                    <select
                                        name="type"
                                        className="form-select"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                    >
                                        <option value="field">場域</option>
                                        <option value="device">設備</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">位置描述</label>
                                    <input
                                        type="text"
                                        name="location"
                                        className="form-control"
                                        placeholder="例如: A棟3樓"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => modalInstance?.hide()}>取消</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? '儲存中...' : '確認新增'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}