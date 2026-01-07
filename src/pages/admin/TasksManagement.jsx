import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import TaskDetailModal from '../../components/TaskDetailModal'
import DataTable from 'datatables.net-react'

export default function TasksManagement() {
    const [tasks, setTasks] = useState([])
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [viewTask, setViewTask] = useState(null)
    const [viewItems, setViewItems] = useState([])

    useEffect(() => { fetchTasks() }, [])

    const fetchTasks = async () => {
        // 僅撈取任務執行個體
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
                <h5 className="mb-0 fw-bold text-success">巡檢任務執行進度</h5>
            </div>
            <div className="card-body">
                <DataTable className="table table-bordered align-middle">
                    <thead>
                        <tr>
                            <th>執行日期</th>
                            <th>巡檢對象</th>
                            <th>執行人</th>
                            <th>狀態</th>
                            <th>操作</th>
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