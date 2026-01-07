import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom' // 假設您使用 React Router
import { supabase } from '../../supabaseClient'

import DataTable from 'datatables.net-react'
import DT from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'

DataTable.use(DT)

export default function DeviceTaskOverview() {
    const { deviceId } = useParams() // 從網址取得 ID
    const navigate = useNavigate()
    const [asset, setAsset] = useState(null)
    const [tasks, setTasks] = useState([])
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })

    useEffect(() => {
        if (deviceId) {
            fetchAssetDetails()
            fetchDeviceTasks()
        }
    }, [deviceId])

    const fetchAssetDetails = async () => {
        const { data } = await supabase.from('assets').select('*').eq('id', deviceId).single()
        if (data) setAsset(data)
    }

    const fetchDeviceTasks = async () => {
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('asset_id', deviceId)
            .order('assigned_date', { ascending: false })

        if (data) {
            setTasks(data)
            // 計算統計數據
            const pending = data.filter(t => t.status !== 'completed').length
            setStats({
                total: data.length,
                pending: pending,
                completed: data.length - pending
            })
        }
    }

    const getFrequencyBadge = (freq) => {
        switch (freq) {
            case 'daily': return <span>日檢</span>
            case 'monthly': return <span>月檢</span>
            case 'yearly': return <span>年檢</span>
            default: return <span>單次</span>
        }
    }

    const tableOptions = {
        language: {
            processing: "處理中...",
            loadingRecords: "載入中...",
            lengthMenu: "顯示 _MENU_ 項結果",
            zeroRecords: "沒有符合的結果",
            info: "顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
            infoEmpty: "顯示第 0 至 0 項結果，共 0 項",
            infoFiltered: "(從 _MAX_ 項結果中過濾)",
            search: "搜尋:",
            paginate: {
                first: "<<",
                previous: "<",
                next: ">",
                last: ">>"
            }
        },
        order: [[0, 'desc']],
        autoWidth: false,
        columnDefs: [
            {
                targets: 0,
                className: 'dt-head-left dt-body-left'
            }
        ]
    }

    if (!asset) return <div className="p-4">載入中...</div>

    return (
        <div className="container-fluid p-0">
            {/* 頂部導航與標題 */}
            <div className="d-flex align-items-center mb-4">
                <button className="btn btn-secondary me-3" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> 返回
                </button>
                <h4 className="mb-0 fw-bold">設備任務總攬</h4>
            </div>

            <div className="row g-4">
                {/* 左側：設備資訊卡片 */}
                <div className="col-md-4 col-lg-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                {asset.image_url ? (
                                    <img src={asset.image_url} className="img-fluid rounded" alt={asset.name} style={{ maxHeight: '200px', objectFit: 'cover' }} />
                                ) : (
                                    <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '150px' }}>
                                        <i className="bi bi-image text-muted fs-1"></i>
                                    </div>
                                )}
                            </div>
                            <h5 className="card-title fw-bold">{asset.name}</h5>
                            <span className="badge bg-secondary mb-3">{asset.type === 'field' ? '場域' : '設備'}</span>

                            <ul className="list-group list-group-flush text-start mt-3">
                                <li className="list-group-item d-flex justify-content-between">
                                    <span className="text-muted">位置</span>
                                    <span className="fw-bold">{asset.location || '-'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <span className="text-muted">建立日期</span>
                                    <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 右側：任務統計與列表 */}
                <div className="col-md-8 col-lg-9">
                    {/* 統計小卡 */}
                    <div className="row g-3 mb-4">
                        <div className="col-4">
                            <div className="card bg-primary text-white h-100">
                                <div className="card-body">
                                    <h6 className="card-title opacity-75">總任務數</h6>
                                    <h2 className="mb-0">{stats.total}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="card bg-warning text-dark h-100">
                                <div className="card-body">
                                    <h6 className="card-title opacity-75">待巡檢</h6>
                                    <h2 className="mb-0">{stats.pending}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="card bg-success text-white h-100">
                                <div className="card-body">
                                    <h6 className="card-title opacity-75">已完成</h6>
                                    <h2 className="mb-0">{stats.completed}</h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 任務列表 */}
                    <div className="card shadow-sm">
                        <div className="card-header py-3">
                            <h5 className="mb-0"><i className="bi bi-list-task me-2"></i>任務歷程</h5>
                        </div>
                        <div className="card-body">
                            <DataTable key={tasks.length} options={tableOptions} className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>日期</th>
                                        <th>週期類型</th>
                                        <th>指派人員</th>
                                        <th>描述</th>
                                        <th>狀態</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map(task => (
                                        <tr key={task.id}>
                                            <td className="text-nowrap">{task.assigned_date}</td>
                                            <td>{getFrequencyBadge(task.frequency)}</td>
                                            <td>{task.assigned_user || '-'}</td>
                                            <td>{task.description || <span className="text-muted small">無</span>}</td>
                                            <td>
                                                {task.status === 'completed' ? (
                                                    <span>已完成</span>
                                                ) : (
                                                    <span>待巡檢</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}