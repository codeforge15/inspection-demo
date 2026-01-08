import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import AssetFormModal from '../../components/AssetFormModal'

// --- DataTables 相關引用 ---
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

DataTable.use(DT);

export default function FieldManagement() {
    const [fields, setFields] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    const tableOptions = {
        language: {
            processing: "處理中...",
            loadingRecords: "載入中...",
            lengthMenu: "顯示 _MENU_ 項結果",
            zeroRecords: "沒有符合的結果",
            info: "顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
            infoEmpty: "顯示第 0 至 0 項結果，共 0 項",
            infoFiltered: "(從 _MAX_ 項結果中過濾)",
            search: "搜尋場域:",
            paginate: {
                first: "<<",
                previous: "<",
                next: ">",
                last: ">>"
            }
        },
        order: [[1, 'asc']], // 按場域名稱排序
        autoWidth: false,
        columnDefs: [
            { targets: [0, 3], orderable: false } // 縮圖 (0) 與 操作 (3) 不開放排序
        ]
    }

    useEffect(() => { fetchFields() }, [])

    const fetchFields = async () => {
        const { data } = await supabase
            .from('assets')
            .select('*')
            .eq('type', 'field')
            .order('created_at', { ascending: false })
        if (data) setFields(data)
    }

    const handleCreate = () => {
        setEditingItem(null)
        setShowModal(true)
    }

    const handleEdit = (item) => {
        setEditingItem(item)
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此場域嗎？')) return
        const { error } = await supabase.from('assets').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchFields()
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold"><i className="bi bi-geo-alt me-2"></i>場域管理</h5>
                <button className="btn btn-success btn-sm px-3 shadow-sm" onClick={handleCreate}>
                    <i className="bi bi-plus-lg me-1"></i>新增場域
                </button>
            </div>
            <div className="card-body">
                <DataTable key={fields.length} options={tableOptions} className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: '100px' }}>縮圖</th>
                            <th>場域名稱</th>
                            <th>位置描述</th>
                            <th style={{ width: '150px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map(item => (
                            <tr key={item.id}>
                                <td className="text-center">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt="field" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        <i className="bi bi-building text-muted fs-3"></i>
                                    )}
                                </td>
                                <td className="fw-bold text-primary">{item.name}</td>
                                <td>{item.location || <span className="text-muted small">未填寫</span>}</td>
                                <td>
                                    <div className="btn-group">
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(item)}>編輯</button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>刪除</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            </div>
            <AssetFormModal show={showModal} onClose={() => setShowModal(false)} onSuccess={fetchFields} initialData={editingItem} fixedType="field" />
        </div>
    )
}