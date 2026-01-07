import React, { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import { supabase } from '../supabaseClient'

export default function TemplateFormModal({ show, onClose, onSuccess, initialData }) {
    const modalRef = useRef(null)
    const [modalInstance, setModalInstance] = useState(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    // 表單資料
    const [name, setName] = useState('')
    const [items, setItems] = useState([])
    const [templateImage, setTemplateImage] = useState(null) // 儲存資料庫中的圖片 URL
    const [selectedFile, setSelectedFile] = useState(null)   // 儲存新選擇的檔案物件
    const [previewUrl, setPreviewUrl] = useState('')         // 顯示用的圖片網址 (包含本地預覽或遠端)

    // 新增項目輸入暫存
    const [newItemName, setNewItemName] = useState('')
    const [newItemType, setNewItemType] = useState('pass_fail')
    const [newItemOptions, setNewItemOptions] = useState('')

    // 暫存座標
    const [tempPoint, setTempPoint] = useState(null)

    useEffect(() => {
        if (modalRef.current) {
            setModalInstance(new Modal(modalRef.current, { backdrop: 'static', keyboard: false }))
        }
    }, [])

    useEffect(() => {
        if (show && modalInstance) {
            initializeForm()
            modalInstance.show()
        } else if (!show && modalInstance) {
            modalInstance.hide()
        }
    }, [show, modalInstance, initialData])

    const initializeForm = () => {
        setStep(1)
        setSelectedFile(null)
        setPreviewUrl('')
        resetItemInputs()

        if (initialData) {
            setName(initialData.name)
            setTemplateImage(initialData.image_url || null)
            setPreviewUrl(initialData.image_url || '') // 如果有舊圖，設為預覽
            fetchTemplateItems(initialData.id)
        } else {
            setName('')
            setItems([])
            setTemplateImage(null)
            setPreviewUrl('')
        }
    }

    const resetItemInputs = () => {
        setNewItemName('')
        setNewItemType('pass_fail')
        setNewItemOptions('')
        setTempPoint(null)
    }

    const fetchTemplateItems = async (templateId) => {
        const { data } = await supabase.from('template_items').select('*').eq('template_id', templateId).order('id', { ascending: true })
        if (data) {
            setItems(data.map(i => ({
                name: i.name, type: i.item_type, options: i.options || [], x: i.x || null, y: i.y || null
            })))
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file)) // 建立本地預覽
        }
    }

    const uploadImage = async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `template_${Date.now()}.${fileExt}`
        const filePath = fileName
        // 這裡假設您共用 'asset-images' bucket，若有獨立 bucket 請自行修改
        const { error: uploadError } = await supabase.storage.from('asset-images').upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('asset-images').getPublicUrl(filePath)
        return data.publicUrl
    }

    // --- 圖片點擊 ---
    const handleImageClick = (e) => {
        const rect = e.target.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setTempPoint({ x, y })
        // 自動聚焦到名稱輸入框
        document.getElementById('templateItemInput')?.focus()
    }

    // --- 加入列表 ---
    const handleAddItem = () => {
        if (!newItemName.trim()) {
            alert('請輸入項目名稱')
            document.getElementById('templateItemInput')?.focus()
            return
        }

        // ★★★ 強制檢查：如果有圖片 (previewUrl) 但沒有選點 (tempPoint)，禁止加入 ★★★
        if (previewUrl && !tempPoint) {
            alert('請先在圖片上點擊一個位置，設定此項目的檢查點！')
            return
        }

        let parsedOptions = []
        if (newItemType === 'select') {
            parsedOptions = newItemOptions.split(',').map(s => s.trim()).filter(s => s !== '')
        }

        const newItem = {
            name: newItemName,
            type: newItemType,
            options: parsedOptions,
            x: tempPoint ? tempPoint.x : null,
            y: tempPoint ? tempPoint.y : null
        }

        setItems([...items, newItem])
        resetItemInputs()
    }

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (items.length === 0) return alert('請至少加入一個檢查項目')
        setLoading(true)
        try {
            let finalImageUrl = templateImage // 預設使用舊圖

            // 如果有選擇新檔案，則上傳並更新網址
            if (selectedFile) {
                finalImageUrl = await uploadImage(selectedFile)
            }

            let templateId = initialData?.id
            const templateData = { name, image_url: finalImageUrl }

            if (initialData) {
                await supabase.from('templates').update(templateData).eq('id', templateId)
                await supabase.from('template_items').delete().eq('template_id', templateId)
            } else {
                const { data, error } = await supabase.from('templates').insert([templateData]).select().single()
                if (error) throw error
                templateId = data.id
            }

            const itemsToInsert = items.map(item => ({
                template_id: templateId, name: item.name, item_type: item.type, options: item.options, x: item.x, y: item.y
            }))

            const { error: itemsError } = await supabase.from('template_items').insert(itemsToInsert)
            if (itemsError) throw itemsError

            onSuccess()
            onClose()
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="mb-3">
                <label className="form-label">模板名稱</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：消防設備檢查表" required />
            </div>
            <div className="mb-3">
                <label className="form-label">示意底圖 (選填)</label>
                <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                <div className="form-text">上傳一張通用的設備或場域示意圖，以便設定檢查點位。</div>
                {previewUrl && (
                    <div className="mt-3 text-center border p-2 rounded">
                        <p className="text-muted small mb-1">預覽圖片</p>
                        <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                    </div>
                )}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div>
            {/* 圖片與提示區域 (Flex Column 置中) */}
            <div className="d-flex flex-column align-items-center mb-3">

                {/* 1. 圖片容器 */}
                <div className="p-2 position-relative d-inline-block" style={{ minHeight: '300px' }}>
                    {previewUrl ? (
                        <div className="position-relative">
                            <img
                                src={previewUrl}
                                alt="Template Map"
                                className="img-fluid rounded shadow-sm"
                                style={{ height: '380px', cursor: 'crosshair' }} // 最大高度 480px
                                onClick={handleImageClick}
                            />
                            {/* 已確認點位 (藍色) */}
                            {items.map((item, index) => (
                                item.x !== null && item.y !== null && (
                                    <div key={index} className="position-absolute bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-white"
                                        style={{ width: '24px', height: '24px', fontSize: '12px', left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10 }}>
                                        {index + 1}
                                    </div>
                                )
                            ))}
                            {/* 暫存點位 (黃色閃爍) */}
                            {tempPoint && (
                                <div className="position-absolute bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-white placeholder-glow"
                                    style={{ width: '24px', height: '24px', left: `${tempPoint.x}%`, top: `${tempPoint.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 11 }}>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted flex-column p-5" style={{ minWidth: '300px' }}>
                            <i className="bi bi-image fs-1 mb-2 text-secondary"></i>
                            <p>未上傳示意圖，僅能使用列表模式新增項目。</p>
                        </div>
                    )}
                </div>

                {/* 2. 提示訊息 (移至圖片下方) */}
                <div className="mt-2 text-center" style={{ minHeight: '40px' }}>
                    {previewUrl && !tempPoint && (
                        <div className="alert alert-info py-1 px-3 mb-0 d-inline-block shadow-sm">
                            <i className="bi bi-hand-index-thumb me-2"></i>請點擊圖片設定位置
                        </div>
                    )}
                    {tempPoint && (
                        <div className="alert alert-warning py-1 px-3 mb-0 d-inline-block shadow-sm border-warning">
                            <i className="bi bi-pencil-fill me-2"></i>已標記位置，請在下方輸入資訊並加入
                        </div>
                    )}
                </div>
            </div>

            {/* 輸入工具列 */}
            <div className={`card mb-3 shadow-sm transition-all`}>
                <div className="card-body p-2">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-5">
                            <label className="small text-muted mb-1">項目名稱 <span className="text-danger">*</span></label>
                            <input
                                id="templateItemInput"
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="項目名稱"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="small text-muted mb-1">類型</label>
                            <select className="form-select form-select-sm" value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
                                <option value="pass_fail">正常/異常 (檢查)</option>
                                <option value="number">數值紀錄</option>
                                <option value="select">選項清單</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            {/* 按鈕狀態根據是否有圖片與是否有選點改變 */}
                            <button
                                className={`btn btn-sm w-100 ${tempPoint ? 'btn-warning' : 'btn-secondary'}`}
                                type="button"
                                onClick={handleAddItem}
                                disabled={previewUrl && !tempPoint} // 如果有圖但沒選點，禁止點擊
                            >
                                <i className={`bi ${tempPoint ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                                {tempPoint ? '確認加入' : '加入列表'}
                            </button>
                        </div>
                    </div>
                    {newItemType === 'select' && (
                        <div className="mt-2">
                            <input type="text" className="form-control form-control-sm" placeholder="選項 (逗號分隔)" value={newItemOptions} onChange={(e) => setNewItemOptions(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* 項目列表 */}
            <div className="list-group list-group-flush border-top" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {items.map((item, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center py-2 px-2 hover-bg-light">
                        <div className="text-truncate">
                            <span className="badge bg-secondary me-2">{index + 1}</span>
                            <span className="fw-bold">{item.name}</span>
                            <span className="text-muted small ms-2">
                                <span className={`badge ${item.type === 'pass_fail' ? 'bg-success' : 'bg-info text-dark'} scale-75 me-1`}>
                                    {item.type === 'pass_fail' ? '檢查' : item.type === 'number' ? '數值' : '選單'}
                                </span>
                                {item.x !== null ? <i className="bi bi-geo-alt-fill text-primary" title="已標記於圖面"></i> : ''}
                            </span>
                        </div>
                        <button type="button" className="btn btn-sm text-danger" onClick={() => handleRemoveItem(index)}>✕</button>
                    </div>
                ))}
                {items.length === 0 && <div className="text-center text-muted small py-4">尚未新增任何檢查項目</div>}
            </div>
        </div>
    )

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {initialData ? '編輯檢查模板' : '建立新模板'}
                            <span className="badge bg-light text-dark ms-2 fs-6 border">步驟 {step}/2</span>
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {step === 1 ? renderStep1() : renderStep2()}
                    </div>

                    <div className="modal-footer d-flex justify-content-between">
                        {step === 1 ? (
                            <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
                        ) : (
                            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                                <i className="bi bi-arrow-left me-1"></i> 上一步
                            </button>
                        )}

                        {step === 1 ? (
                            <button type="button" className="btn btn-primary" onClick={() => { if (!name.trim()) return alert('請輸入模板名稱'); setStep(2); }}>
                                下一步 <i className="bi bi-arrow-right ms-1"></i>
                            </button>
                        ) : (
                            <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                                {loading ? '儲存中...' : '確認儲存'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}