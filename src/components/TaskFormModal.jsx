import React, { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import { supabase } from '../supabaseClient'

export default function TaskFormModal({ show, onClose, onSuccess, assets, templates, initialData }) {
    const modalRef = useRef(null)
    const [modalInstance, setModalInstance] = useState(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)
    const [currentAssetImage, setCurrentAssetImage] = useState(null)

    // 表單資料
    const [formData, setFormData] = useState({
        asset_id: '',
        assigned_date: new Date().toISOString().split('T')[0],
        description: '',
        assigned_user: '',
        frequency: 'specific'
    })
    const [checkItems, setCheckItems] = useState([])

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
        resetItemInputs()
        if (initialData) {
            setFormData({
                asset_id: initialData.asset_id,
                assigned_date: initialData.assigned_date,
                description: initialData.description || '',
                assigned_user: initialData.assigned_user || '',
                frequency: initialData.frequency || 'specific'
            })
            const asset = assets.find(a => a.id === initialData.asset_id)
            setCurrentAssetImage(asset?.image_url || null)
            const items = (initialData.task_items || []).map(i => ({
                name: i.name, type: i.item_type, options: i.options || [], x: i.x || null, y: i.y || null
            }))
            setCheckItems(items)
        } else {
            const defaultAssetId = assets.length > 0 ? assets[0].id : ''
            setFormData({
                asset_id: defaultAssetId,
                assigned_date: new Date().toISOString().split('T')[0],
                description: '',
                assigned_user: '',
                frequency: 'specific'
            })
            const asset = assets.find(a => a.id === defaultAssetId)
            setCurrentAssetImage(asset?.image_url || null)
            setCheckItems([])
        }
    }

    const resetItemInputs = () => {
        setNewItemName('')
        setNewItemType('pass_fail')
        setNewItemOptions('')
        setTempPoint(null)
    }

    const handleAssetChange = (e) => {
        const assetId = e.target.value
        const asset = assets.find(a => a.id == assetId)
        setFormData({ ...formData, asset_id: assetId })
        setCurrentAssetImage(asset?.image_url || null)
    }

    const handleApplyTemplate = async (templateId) => {
        if (!templateId) return
        const { data } = await supabase.from('template_items').select('*').eq('template_id', templateId)
        if (data) {
            const items = data.map(i => ({
                name: i.name, type: i.item_type || 'pass_fail', options: i.options || [], x: i.x || null, y: i.y || null
            }))
            if (checkItems.length > 0) {
                if (window.confirm('是否要清空目前已有的項目並套用模板？(取消則為追加)')) {
                    setCheckItems(items)
                } else {
                    setCheckItems([...checkItems, ...items])
                }
            } else {
                setCheckItems(items)
            }
        }
    }

    const handleImageClick = (e) => {
        const rect = e.target.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setTempPoint({ x, y })
        document.getElementById('newItemNameInput')?.focus()
    }

    // --- 修改核心：加入列表並判斷是否有座標 ---
    const handleAddItem = () => {
        // 1. 檢查名稱
        if (!newItemName.trim()) {
            alert('請輸入項目名稱')
            document.getElementById('newItemNameInput')?.focus()
            return
        }

        // 2. ★★★ 強制檢查：如果有圖片，但沒有選點，禁止加入 ★★★
        if (currentAssetImage && !tempPoint) {
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

        setCheckItems([...checkItems, newItem])
        resetItemInputs()
    }

    const handleRemoveItem = (index) => {
        setCheckItems(checkItems.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (checkItems.length === 0) return alert('請至少新增一個檢查項目')
        setLoading(true)
        try {
            let taskId = initialData?.id
            const taskPayload = {
                asset_id: formData.asset_id,
                assigned_date: formData.assigned_date,
                description: formData.description,
                assigned_user: formData.assigned_user,
                frequency: formData.frequency,
                status: initialData ? initialData.status : 'pending'
            }
            if (initialData) {
                await supabase.from('tasks').update(taskPayload).eq('id', taskId)
                await supabase.from('task_items').delete().eq('task_id', taskId)
            } else {
                const { data, error } = await supabase.from('tasks').insert([taskPayload]).select().single()
                if (error) throw error
                taskId = data.id
            }
            const itemsToInsert = checkItems.map(item => ({
                task_id: taskId, name: item.name, item_type: item.type, options: item.options, x: item.x, y: item.y, result: null
            }))
            const { error: itemsError } = await supabase.from('task_items').insert(itemsToInsert)
            if (itemsError) throw itemsError
            onSuccess()
            onClose()
        } catch (error) {
            alert('操作失敗: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const renderStep1 = () => (
        <div className="space-y-3">
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">1. 巡檢對象</label>
                    <select className="form-select" value={formData.asset_id} onChange={handleAssetChange} disabled={initialData}>
                        <option value="" disabled>請選擇...</option>
                        {assets.map(asset => (<option key={asset.id} value={asset.id}>{asset.name} ({asset.type === 'field' ? '場域' : '設備'})</option>))}
                    </select>
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">2. 任務週期</label>
                    <select className="form-select" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}>
                        <option value="specific">特定日期 (單次)</option>
                        <option value="daily">日檢 (Daily)</option>
                        <option value="monthly">月檢 (Monthly)</option>
                        <option value="yearly">年檢 (Yearly)</option>
                    </select>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">3. 指派人員</label>
                    <input type="text" className="form-control" placeholder="輸入人員名稱" value={formData.assigned_user} onChange={(e) => setFormData({ ...formData, assigned_user: e.target.value })} />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">4. 預計日期</label>
                    <input type="date" className="form-control" value={formData.assigned_date} onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })} required />
                </div>
            </div>
            <div className="mb-3">
                <label className="form-label">5. 套用模板 (選填)</label>
                <select className="form-select" defaultValue="" onChange={(e) => handleApplyTemplate(e.target.value)}>
                    <option value="" disabled>選擇模板以快速帶入項目...</option>
                    {templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label">6. 備註/描述</label>
                <textarea className="form-control" rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div>
            {/* 圖片與提示區域 (Flex Column 置中) */}
            <div className="d-flex flex-column align-items-center mb-3">

                {/* 1. 圖片容器 */}
                <div className="position-relative d-inline-block rounded" style={{ minHeight: '300px' }}>
                    {currentAssetImage ? (
                        <div className="position-relative">
                            <img
                                src={currentAssetImage}
                                alt="Asset Map"
                                className="img-fluid rounded shadow-sm"
                                style={{ height: '380px', cursor: 'crosshair' }} // 最大高度 480px
                                onClick={handleImageClick}
                            />
                            {/* 已加入的點位 (紅色) */}
                            {checkItems.map((item, index) => (
                                item.x !== null && item.y !== null && (
                                    <div key={index} className="position-absolute bg-danger text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-white"
                                        style={{ width: '24px', height: '24px', fontSize: '12px', left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10 }}>
                                        {index + 1}
                                    </div>
                                )
                            ))}
                            {/* 暫存點位 (黃色閃爍) */}
                            {tempPoint && (
                                <div className="position-absolute bg-warning text-dark rounded-circle shadow-sm border border-white placeholder-glow"
                                    style={{ width: '24px', height: '24px', left: `${tempPoint.x}%`, top: `${tempPoint.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 11 }}>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted flex-column p-5" style={{ minWidth: '300px' }}>
                            <i className="bi bi-image-alt fs-1 mb-3 text-secondary"></i>
                            <p>此資產未上傳圖片，無法使用點位功能。</p>
                        </div>
                    )}
                </div>

                {/* 2. 提示訊息 (移至圖片下方) */}
                <div className="mt-2 text-center" style={{ minHeight: '40px' }}>
                    {currentAssetImage && !tempPoint && (
                        <div className="alert alert-info py-1 px-3 mb-0 d-inline-block shadow-sm">
                            <i className="bi bi-hand-index-thumb me-2"></i>請先在圖片上點擊位置，再輸入資訊
                        </div>
                    )}
                    {tempPoint && (
                        <div className="alert alert-warning py-1 px-3 mb-0 d-inline-block shadow-sm border-warning">
                            <i className="bi bi-pencil-fill me-2"></i>已標記位置，請在下方輸入項目名稱並加入
                        </div>
                    )}
                </div>
            </div>

            {/* 輸入工具列 (置於圖片下方) */}
            <div className={`card mb-3 shadow-sm transition-all`}>
                <div className="card-body p-2">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-5">
                            <label className="small text-muted mb-1">項目名稱 <span className="text-danger">*</span></label>
                            <input
                                id="newItemNameInput"
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="例: 檢查壓力錶"
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
                            {/* 按鈕樣式會根據是否有選點改變 */}
                            <button
                                className={`btn btn-sm w-100 ${tempPoint ? 'btn-warning' : 'btn-secondary'}`}
                                type="button"
                                onClick={handleAddItem}
                                disabled={currentAssetImage && !tempPoint} // 如果有圖但沒選點，按鈕禁用 (或者靠 handleAddItem 跳 alert)
                            >
                                <i className={`bi ${tempPoint ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                                {tempPoint ? '確認加入' : '加入列表'}
                            </button>
                        </div>
                    </div>
                    {newItemType === 'select' && (
                        <div className="mt-2">
                            <input type="text" className="form-control form-control-sm" placeholder="選項 (用逗號分隔, 例: 正常,故障,維修中)" value={newItemOptions} onChange={(e) => setNewItemOptions(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* 項目列表 */}
            <div className="list-group list-group-flush border-top" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {checkItems.map((item, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center py-2 px-2 hover-bg-light">
                        <div className="text-truncate">
                            <span className="badge bg-secondary me-2">{index + 1}</span>
                            <span className="fw-bold">{item.name}</span>
                            <span className="text-muted small ms-2">
                                <span className={`badge ${item.type === 'pass_fail' ? 'bg-success' : 'bg-info text-dark'} scale-75 me-1`}>
                                    {item.type === 'pass_fail' ? '檢查' : item.type === 'number' ? '數值' : '選單'}
                                </span>
                                {item.x !== null ? <i className="bi bi-geo-alt-fill text-danger" title="已標記於圖面"></i> : ''}
                            </span>
                        </div>
                        <button type="button" className="btn btn-sm text-danger" onClick={() => handleRemoveItem(index)} title="移除">
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                ))}
                {checkItems.length === 0 && <div className="text-center text-muted small py-4">尚未新增任何檢查項目</div>}
            </div>
        </div>
    )

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {initialData ? '編輯巡檢任務' : '指派新任務'}
                            <span className="p-2 rounded ms-2 fs-6 border">步驟 {step}/2</span>
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
                                <i className="bi bi-arrow-left me-1"></i> 回上一步
                            </button>
                        )}

                        {step === 1 ? (
                            <button type="button" className="btn btn-primary" onClick={() => { if (!formData.asset_id) return alert('請選擇巡檢對象'); setStep(2); }}>
                                下一步 <i className="bi bi-arrow-right ms-1"></i>
                            </button>
                        ) : (
                            <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                                {loading ? '處理中...' : '確認指派任務'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}