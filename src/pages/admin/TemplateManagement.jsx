import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import TemplateFormModal from '../../components/TemplateFormModal'

// --- DataTables 相關引用 ---
import DataTable from 'datatables.net-react'
import DT from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'

// 註冊 Bootstrap 5 樣式
DataTable.use(DT)

export default function TemplateManagement() {
    const [templates, setTemplates] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [loading, setLoading] = useState(true)

    // DataTables 設定項目
    const tableOptions = {
        language: {
            processing: "處理中...",
            loadingRecords: "載入中...",
            lengthMenu: "顯示 _MENU_ 項結果",
            zeroRecords: "沒有符合的結果",
            info: "顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
            infoEmpty: "顯示第 0 至 0 項結果，共 0 項",
            infoFiltered: "(從 _MAX_ 項結果中過濾)",
            search: "搜尋模板:",
            paginate: {
                first: "<<",
                previous: "<",
                next: ">",
                last: ">>"
            }
        },
        order: [[2, 'desc']], // 預設按建立時間降序排列
        autoWidth: false,
        columnDefs: [
            { targets: [0, 3], orderable: false } // 示意圖 (0) 與 操作 (3) 不開放排序
        ]
    }

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setTemplates(data)
        setLoading(false)
    }

    const handleCreate = () => {
        setEditingTemplate(null)
        setShowModal(true)
    }

    const handleEdit = (template) => {
        setEditingTemplate(template)
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此模板嗎？這將無法復原。')) return
        const { error } = await supabase.from('templates').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchTemplates()
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 fw-bold">
                    <i className="bi bi-file-earmark-text me-2 text-primary"></i>檢查模板管理
                </h5>
                <button className="btn btn-primary btn-sm px-3 shadow-sm" onClick={handleCreate}>
                    <i className="bi bi-plus-lg me-1"></i>建立新模板
                </button>
            </div>
            <div className="card-body">
                {/* 使用 DataTable 組件。
                    key={templates.length} 用於在資料更新時強制 DataTables 重新渲染。
                */}
                <DataTable
                    key={templates.length}
                    options={tableOptions}
                    className="table table-bordered table-hover align-middle"
                >
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: '80px' }}>示意圖</th>
                            <th>模板名稱</th>
                            <th>建立時間</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.map(template => (
                            <tr key={template.id}>
                                <td className="text-center">
                                    {template.image_url ? (
                                        <img
                                            src={template.image_url}
                                            alt="icon"
                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    ) : (
                                        <i className="bi bi-image text-muted fs-4"></i>
                                    )}
                                </td>
                                <td className="fw-bold">{template.name}</td>
                                <td className="text-muted small">
                                    {new Date(template.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                    <div className="btn-group">
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(template)}>
                                            編輯
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(template.id)}>
                                            刪除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            </div>

            <TemplateFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchTemplates}
                initialData={editingTemplate}
            />
        </div>
    )
}