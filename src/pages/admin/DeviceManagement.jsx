import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import AssetFormModal from '../../components/AssetFormModal'
import QRCode from 'react-qr-code' // 引入 QR Code 套件

export default function DeviceManagement() {
    const [devices, setDevices] = useState([])
    const [filteredDevices, setFilteredDevices] = useState([]) // 儲存搜尋過後的資料
    const [searchTerm, setSearchTerm] = useState('') // 搜尋關鍵字
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    useEffect(() => {
        fetchDevices()
    }, [])

    // 當 devices 或 searchTerm 改變時，自動過濾資料
    useEffect(() => {
        const results = devices.filter(device =>
            device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (device.location && device.location.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        setFilteredDevices(results)
    }, [searchTerm, devices])

    const fetchDevices = async () => {
        const { data } = await supabase
            .from('assets')
            .select('*')
            .eq('type', 'device')
            .order('created_at', { ascending: false })
        if (data) {
            setDevices(data)
            setFilteredDevices(data)
        }
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
        if (!window.confirm('確定要刪除此設備嗎？')) return
        const { error } = await supabase.from('assets').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchDevices()
    }

    // 產生 QR Code 的內容 (例如連結到設備總攬頁面)
    const getQrValue = (id) => {
        // 這裡假設您的網站 domain，開發時可能是 localhost
        const baseUrl = window.location.origin
        return `${baseUrl}/admin/device/${id}`
    }

    return (
        <div className="container-fluid p-0">
            {/* 標題與工具列 */}
            <div className="card shadow-sm mb-4">
                <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h5 className="card-title mb-0 fw-bold text-primary">
                        <i className="bi bi-tools me-2"></i>設備管理
                    </h5>

                    <div className="d-flex gap-2">
                        {/* 搜尋框 */}
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="搜尋設備名稱或位置..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button className="btn btn-primary text-nowrap" onClick={handleCreate}>
                            <i className="bi bi-plus-lg me-1"></i>新增設備
                        </button>
                    </div>
                </div>
            </div>

            {/* 卡片列表區域 */}
            <div className="row g-4">
                {filteredDevices.map(item => (
                    <div className="col-12 col-md-6 col-lg-4 col-xl-3" key={item.id}>
                        <div className="card h-100 shadow-sm border-0 hover-shadow transition-all">

                            <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        className="card-img-top w-100 h-100"
                                        alt={item.name}
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted">
                                        <div className="text-center">
                                            <i className="bi bi-hdd-rack display-4"></i>
                                            <p className="small mb-0">無圖片</p>
                                        </div>
                                    </div>
                                )}
                                <div className="position-absolute top-0 end-0 m-2">
                                    <span className="badge bg-white text-dark shadow-sm border">正常運作</span>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h5 className="card-title fw-bold mb-1">{item.name}</h5>
                                        <p className="card-text text-muted small">
                                            <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
                                            {item.location || '未設定位置'}
                                        </p>
                                    </div>
                                    {/* QR Code 顯示區 (點擊可放大或其他操作) */}
                                    <div className="p-1 bg-white border rounded" title="掃描前往總攬">
                                        <QRCode
                                            value={getQrValue(item.id)}
                                            size={48}
                                            level="L"
                                        />
                                    </div>
                                </div>

                                <hr className="my-2 opacity-25" />

                                <div className="d-flex justify-content-between align-items-center mt-3 gap-2">
                                    <button
                                        className="btn btn-info btn-sm flex-grow-1"
                                        onClick={() => window.location.href = `/admin/device/${item.id}`}
                                    >
                                        <i className="bi bi-activity me-1"></i> 總攬
                                    </button>
                                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(item)} title="編輯">
                                        <i className="bi bi-pencil-square"></i>
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)} title="刪除">
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredDevices.length === 0 && (
                    <div className="col-12 text-center py-5">
                        <div className="text-muted">
                            <i className="bi bi-search fs-1"></i>
                            <p className="mt-2">找不到符合的設備</p>
                        </div>
                    </div>
                )}
            </div>

            <AssetFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchDevices}
                initialData={editingItem}
                fixedType="device"
            />
        </div>
    )
}