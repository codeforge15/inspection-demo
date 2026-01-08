import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import PlanFormModal from '../../components/PlanFormModal'
import PlanItemPreviewModal from '../../components/PlanItemPreviewModal'

// --- DataTables 相關引用 ---
import DataTable from 'datatables.net-react'
import DT from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'

DataTable.use(DT)

export default function TaskPlans() {
    const [plans, setPlans] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingPlan, setEditingPlan] = useState(null)

    // --- 關鍵修正 1：預覽狀態改為儲存整個 plan 物件 ---
    const [previewTemplate, setPreviewTemplate] = useState({ show: false, plan: null })

    const tableOptions = {
        language: {
            processing: "處理中...",
            loadingRecords: "載入中...",
            lengthMenu: "顯示 _MENU_ 項結果",
            zeroRecords: "沒有符合的結果",
            info: "顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
            infoEmpty: "顯示第 0 至 0 項結果，共 0 項",
            infoFiltered: "(從 _MAX_ 項結果中過濾)",
            search: "搜尋計畫:",
            paginate: { first: "<<", previous: "<", next: ">", last: ">>" }
        },
        order: [[0, 'asc']],
        autoWidth: false,
        columnDefs: [
            { targets: [5], orderable: false }
        ]
    }

    useEffect(() => { fetchPlans() }, [])

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('plans')
            .select(`*, assets(name, location, image_url), templates(name, image_url)`) // 確保撈取關聯資料
            .order('created_at', { ascending: false })
        if (data) setPlans(data)
    }

    const handleDelete = async (id, assetName) => {
        if (!window.confirm(`確定要刪除「${assetName}」的巡檢計畫嗎？\n這將會連同該計畫設定的點位一併刪除。`)) return;
        try {
            const { error } = await supabase.from('plans').delete().eq('id', id);
            if (error) throw error;
            fetchPlans();
        } catch (error) {
            alert('刪除失敗：' + error.message);
        }
    }

    const handleCreate = () => {
        setEditingPlan(null)
        setShowModal(true)
    }

    const handleEdit = (plan) => {
        setEditingPlan(plan)
        setShowModal(true)
    }

    // --- 關鍵修正 2：點擊時傳入整個 plan 物件 ---
    const handleViewItems = (plan) => {
        setPreviewTemplate({
            show: true,
            plan: plan
        })
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-primary">
                    <i className="bi bi-calendar-check me-2"></i>巡檢計畫管理 (母檔)
                </h5>
                <button className="btn btn-primary btn-sm px-3 shadow-sm" onClick={handleCreate}>
                    <i className="bi bi-plus-lg me-1"></i>建立排程計畫
                </button>
            </div>
            <div className="card-body">
                <DataTable key={plans.length} options={tableOptions} className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>巡檢對象</th>
                            <th>對應模板</th>
                            <th>週期</th>
                            <th>預設指派</th>
                            <th>狀態</th>
                            <th style={{ width: '180px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(plan => (
                            <tr key={plan.id}>
                                <td>
                                    <div className="fw-bold">{plan.assets?.name}</div>
                                    <small className="text-muted">{plan.assets?.location}</small>
                                </td>
                                <td>
                                    <button className="btn btn-link btn-sm p-0 text-decoration-none fw-bold" onClick={() => handleViewItems(plan)}>
                                        {plan.templates?.name || '自訂點位'}
                                    </button>
                                </td>
                                <td>{plan.frequency === 'daily' ? '每日' : plan.frequency === 'weekly' ? '每週' : '每月'}</td>
                                <td>{plan.assigned_user}</td>
                                <td>
                                    {plan.is_active ?
                                        <span className="badge bg-success-subtle text-success border border-success-subtle">執行中</span> :
                                        <span className="badge bg-light text-secondary border">暫停</span>
                                    }
                                </td>
                                <td>
                                    <div className="btn-group">
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(plan)} title="編輯">
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button className="btn btn-sm btn-outline-info" onClick={() => handleViewItems(plan)} title="查看項目">
                                            <i className="bi bi-list-ul"></i>
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(plan.id, plan.assets?.name)} title="刪除">
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            </div>

            {/* --- 關鍵修正 3：對應新的 Props 傳遞 --- */}
            <PlanItemPreviewModal
                show={previewTemplate.show}
                onClose={() => setPreviewTemplate({ show: false, plan: null })}
                plan={previewTemplate.plan}
            />

            <PlanFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchPlans}
                initialData={editingPlan}
            />
        </div>
    )
}