import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import TaskDetailModal from '../../components/TaskDetailModal'

// --- DataTables 相關引用 ---
import DataTable from 'datatables.net-react'
import DT from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'

DataTable.use(DT)

export default function TasksManagement() {
    const [tasks, setTasks] = useState([])
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
            search: "搜尋任務:",
            paginate: { first: "<<", previous: "<", next: ">", last: ">>" }
        },
        order: [[0, 'desc']], // 預設按日期降序
        autoWidth: false,
        columnDefs: [
            { targets: [4], orderable: false } // 操作 (4) 不開放排序
        ]
    }

    useEffect(() => { fetchTasks() }, [])

    const fetchTasks = async () => {
        const { data } = await supabase
            .from('tasks')
            .select(`*, assets(name, location)`)
            .order('assigned_date', { ascending: false })
        if (data) setTasks(data)
    }

    const handleViewDetails = async (task) => {
        setViewTask(task)
        const { data } = await supabase.from('task_items').select('*').eq('task_id', task.id)
        setViewItems(data || [])
        setShowDetailModal(true)
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold"><i className="bi bi-activity me-2"></i>巡檢任務執行進度</h5>
            </div>
            <div className="card-body">
                <DataTable key={tasks.length} options={tableOptions} className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>執行日期</th>
                            <th>巡檢對象</th>
                            <th>執行人</th>
                            <th>狀態</th>
                            <th style={{ width: '120px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id}>
                                <td>{task.assigned_date}</td>
                                <td>{task.assets?.name}</td>
                                <td>{task.assigned_user}</td>
                                <td>
                                    <span className={`badge ${task.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                        {task.status === 'completed' ? '已完成' : '待巡檢'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-primary" onClick={() => handleViewDetails(task)}>查看詳情</button>
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