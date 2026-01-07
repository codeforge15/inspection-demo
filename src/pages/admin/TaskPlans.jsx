import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

// DataTables 相關引用
import DataTable from 'datatables.net-react'
import DT from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'

DataTable.use(DT)

export default function TaskPlans() {
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)

    // DataTables 設定語系與排序
    const tableOptions = {
        language: {
            search: "搜尋計畫:",
            lengthMenu: "顯示 _MENU_ 項結果",
            info: "顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
            paginate: { first: "<<", previous: "<", next: ">", last: ">>" }
        },
        order: [[0, 'asc']] // 按對象名稱排序
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        setLoading(true)
        // 撈取計畫並關聯資產與模板
        const { data } = await supabase
            .from('plans')
            .select(`*, assets(name, location), templates(name)`)
        if (data) setPlans(data)
        setLoading(false)
    }

    const getFreqBadge = (f) => {
        const colors = { daily: 'bg-info text-dark', weekly: 'bg-primary', monthly: 'bg-dark' }
        const names = { daily: '每日', weekly: '每週', monthly: '每月' }
        return <span className={`badge ${colors[f] || 'bg-secondary'}`}>{names[f] || f}</span>
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold"><i className="bi bi-calendar-check me-2 text-primary"></i>巡檢計畫設定 (母檔)</h5>
                <button className="btn btn-primary btn-sm px-3">+ 新增計畫</button>
            </div>
            <div className="card-body">
                <DataTable options={tableOptions} className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>巡檢對象</th>
                            <th>對應模板</th>
                            <th>週期</th>
                            <th>預設指派</th>
                            <th>狀態</th>
                            <th data-orderable="false">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(plan => (
                            <tr key={plan.id}>
                                <td>{plan.assets?.name} <small className="text-muted">({plan.assets?.location})</small></td>
                                <td>{plan.templates?.name || '通用模板'}</td>
                                <td>{getFreqBadge(plan.frequency)}</td>
                                <td>{plan.assigned_user}</td>
                                <td>
                                    {plan.is_active ? <span className="text-success">啟用中</span> : <span className="text-muted">停用</span>}
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-outline-secondary">編輯</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            </div>
        </div>
    )
}