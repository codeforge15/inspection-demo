import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function PlanPointEditor({ planId, assetId, onBack, onSave }) {
    const [items, setItems] = useState([])
    const [assetImage, setAssetImage] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchData()
    }, [planId])

    const fetchData = async () => {
        setLoading(true)
        // 1. 取得資產圖片 (作為點位標註的底圖) 
        const { data: asset } = await supabase.from('assets').select('image_url').eq('id', assetId).single()
        if (asset) setAssetImage(asset.image_url)

        // 2. 取得此計畫已有的項目
        const { data: planItems } = await supabase.from('plan_items').select('*').eq('plan_id', planId).order('id', { ascending: true })
        if (planItems && planItems.length > 0) {
            setItems(planItems)
        }
        setLoading(false)
    }

    // 點擊圖片新增點位
    const handleImageClick = (e) => {
        const rect = e.target.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        const newItem = {
            plan_id: planId,
            name: `新點位 ${items.length + 1}`,
            item_type: 'pass_fail',
            x: x.toFixed(2),
            y: y.toFixed(2)
        }
        setItems([...items, newItem])
    }

    const handleSave = async () => {
        setLoading(true)
        // 先刪除舊有的，再寫入新的 (簡易覆蓋法)
        await supabase.from('plan_items').delete().eq('plan_id', planId)
        const { error } = await supabase.from('plan_items').insert(items)

        if (error) alert(error.message)
        else onSave()
        setLoading(false)
    }

    return (
        <div className="p-3">
            <div className="row">
                <div className="col-lg-8 border-end">
                    <h6 className="fw-bold mb-3">步驟 2: 點位標註 (點擊圖片新增點位)</h6>
                    <div className="position-relative bg-light rounded overflow-hidden" style={{ cursor: 'crosshair' }}>
                        {assetImage ? (
                            <>
                                <img
                                    src={assetImage}
                                    className="w-100 h-auto"
                                    onClick={handleImageClick}
                                    alt="Asset Layout"
                                />
                                {items.map((item, idx) => (
                                    <div key={idx} className="position-absolute bg-primary text-white rounded-circle shadow"
                                        style={{ width: '24px', height: '24px', left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                        {idx + 1}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="p-5 text-center text-muted border border-dashed">該資產未設定圖片，僅能使用清單模式</div>
                        )}
                    </div>
                </div>
                <div className="col-lg-4">
                    <h6 className="fw-bold mb-3">項目清單</h6>
                    <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                        {items.map((item, idx) => (
                            <div key={idx} className="card mb-2 p-2 shadow-sm border-0 bg-light">
                                <div className="d-flex gap-2">
                                    <span className="badge bg-dark h-50">{idx + 1}</span>
                                    <div className="flex-grow-1">
                                        <input
                                            className="form-control form-control-sm mb-1"
                                            value={item.name}
                                            onChange={(e) => {
                                                const newItems = [...items]
                                                newItems[idx].name = e.target.value
                                                setItems(newItems)
                                            }}
                                        />
                                        <select
                                            className="form-select form-select-sm"
                                            value={item.item_type}
                                            onChange={(e) => {
                                                const newItems = [...items]
                                                newItems[idx].item_type = e.target.value
                                                setItems(newItems)
                                            }}
                                        >
                                            <option value="pass_fail">正常/異常</option>
                                            <option value="number">數值輸入</option>
                                            <option value="text">備註說明</option>
                                        </select>
                                    </div>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
                <button className="btn btn-secondary" onClick={onBack}>回上一步</button>
                <button className="btn btn-primary px-5" onClick={handleSave} disabled={loading}>
                    {loading ? '儲存中...' : '完成並儲存計畫'}
                </button>
            </div>
        </div>
    )
}