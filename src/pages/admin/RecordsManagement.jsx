import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import TaskDetailModal from '../../components/TaskDetailModal'

// --- DataTables 相關引用 ---
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
            processing: "處理中...",
            loadingRecords: "載入中...",
            lengthMenu: "顯示 _MENU_ 項結果",
            zeroRecords: "沒有符合的結果",
            info: "顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
            infoEmpty: "顯示第 0 至 0 項結果，共 0 項",
            infoFiltered: "(從 _MAX_ 項結果中過濾)",
            search: "搜尋紀錄:",
            paginate: { first: "<<", previous: "<", next: ">", last: ">>" }
        },
        order: [[0, 'desc']], // 預設按提交時間倒序
        autoWidth: false,
        columnDefs: [
            { targets: [5], orderable: false } // 操作 (5) 不開放排序
        ]
    }

    useEffect(() => { fetchRecords() }, [])

    const fetchRecords = async () => {
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
                <h5 className="mb-0 fw-bold"><i className="bi bi-journal-text me-2"></i>巡檢紀錄總覽</h5>
            </div>
            <div className="card-body">
                <DataTable key={records.length} options={tableOptions} className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>提交時間</th>
                            <th>巡檢對象</th>
                            <th>巡檢人員</th>
                            <th>判定結果</th>
                            <th>備註</th>
                            <th style={{ width: '80px' }}>細節</th>
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
                                <td className="small text-muted">{record.notes}</td>
                                <td>
                                    <button className="btn btn-sm btn-link" onClick={() => handleViewDetails(record)}>詳情</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            </div>
            <TaskDetailModal show={showDetailModal} onClose={() => setShowDetailModal(false)} task={viewTask} items={viewItems} />
        </div>
    )
}