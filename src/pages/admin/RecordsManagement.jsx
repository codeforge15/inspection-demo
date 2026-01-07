import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import TaskDetailModal from '../../components/TaskDetailModal'

// DataTables 相關引用
import DataTable from 'datatables.net-react'
import DT from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'

DataTable.use(DT)

export default function RecordsManagement() {
    const [records, setRecords] = useState([])
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [viewTask, setViewTask] = useState(null)
    const [viewItems, setViewItems] = useState([])

    const tableOptions = {
        language: {
            search: "搜尋紀錄:",
            lengthMenu: "顯示 _MENU_ 項",
            info: "共 _TOTAL_ 筆歷史紀錄",
            paginate: { previous: "上一頁", next: "下一頁" }
        },
        order: [[0, 'desc']] // 預設按提交時間倒序排列
    }

    useEffect(() => {
        fetchRecords()
    }, [])

    const fetchRecords = async () => {
        // 深度關聯 records -> tasks -> assets
        const { data } = await supabase
            .from('records')
            .select(`*, tasks (*, assets (name, location))`)
            .order('submitted_at', { ascending: false })
        if (data) setRecords(data)
    }

    const handleViewDetails = async (record) => {
        setViewTask(record.tasks)
        const { data } = await supabase.from('task_items').select('*').eq('task_id', record.task_id)
        if (data) setViewItems(data)
        setShowDetailModal(true)
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold"><i className="bi bi-journal-text me-2 text-success"></i>巡檢紀錄歷史</h5>
            </div>
            <div className="card-body">
                <DataTable options={tableOptions} className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>提交時間</th>
                            <th>巡檢對象</th>
                            <th>巡檢人員</th>
                            <th>判定結果</th>
                            <th>備註</th>
                            <th data-orderable="false">細節</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => (
                            <tr key={record.id}>
                                <td className="small">{new Date(record.submitted_at).toLocaleString()}</td>
                                <td>{record.tasks?.assets?.name}</td>
                                <td>{record.tasks?.assigned_user}</td>
                                <td>
                                    <span className={`badge ${record.result === 'pass' ? 'bg-success' : 'bg-danger'}`}>
                                        {record.result === 'pass' ? '合格' : '不合格'}
                                    </span>
                                </td>
                                <td className="small text-muted text-truncate" style={{ maxWidth: '150px' }}>
                                    {record.notes}
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-link" onClick={() => handleViewDetails(record)}>詳情</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            </div>
            {/* 使用現有的彈窗顯示每一項的具體數值 */}
            <TaskDetailModal show={showDetailModal} onClose={() => setShowDetailModal(false)} task={viewTask} items={viewItems} />
        </div>
    )
}