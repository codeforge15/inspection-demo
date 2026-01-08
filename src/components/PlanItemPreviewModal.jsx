import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function PlanItemPreviewModal({ show, onClose, plan }) {
    const [items, setItems] = useState([])
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [source, setSource] = useState('') // 紀錄資料來源：計畫或模板

    useEffect(() => {
        if (show && plan) {
            fetchPreviewData()
        }
    }, [show, plan])

    const fetchPreviewData = async () => {
        setLoading(true)
        try {
            // 1. 取得資產底圖 (優先權最高)
            const { data: asset } = await supabase
                .from('assets')
                .select('image_url')
                .eq('id', plan.asset_id)
                .single()

            if (asset?.image_url) {
                setImageUrl(asset.image_url)
            } else if (plan.templates?.image_url) {
                // 若資產沒圖，改用模板底圖
                setImageUrl(plan.templates.image_url)
            }

            // 2. 決定檢查項目來源 (優先讀取計畫專屬點位)
            const { data: planItems } = await supabase
                .from('plan_items')
                .select('*')
                .eq('plan_id', plan.id)
                .order('id', { ascending: true })

            if (planItems && planItems.length > 0) {
                setItems(planItems)
                setSource('計畫專屬自訂')
            } else if (plan.template_id) {
                // 若計畫沒點位，才去抓模板點位
                const { data: templateItems } = await supabase
                    .from('template_items')
                    .select('*')
                    .eq('template_id', plan.template_id)
                    .order('id', { ascending: true })

                setItems(templateItems || [])
                setSource(`引用模板: ${plan.templates?.name}`)
            } else {
                setItems([])
                setSource('尚無設定項目')
            }
        } catch (err) {
            console.error("預覽載入失敗:", err)
        } finally {
            setLoading(false)
        }
    }

    if (!show) return null

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-dark text-white py-3">
                        <h5 className="modal-title fw-bold">
                            <i className="bi bi-geo-fill me-2"></i>巡檢點位預覽
                        </h5>
                        <span className="ms-3 badge bg-secondary">{source}</span>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-0">
                        <div className="row g-0">
                            {/* 左側：圖片點位標註 */}
                            <div className="col-lg-8 bg-light border-end position-relative d-flex align-items-center justify-content-center p-3" style={{ minHeight: '500px' }}>
                                {loading ? (
                                    <div className="spinner-border text-primary" role="status"></div>
                                ) : imageUrl ? (
                                    <div className="position-relative d-inline-block shadow-sm rounded overflow-hidden">
                                        <img src={imageUrl} alt="Preview" className="img-fluid" style={{ maxHeight: '70vh' }} />
                                        {items.map((item, index) => (
                                            item.x !== null && (
                                                <div key={item.id || index}
                                                    className="position-absolute bg-primary text-white rounded-circle d-flex align-items-center justify-content-center border border-2 border-white shadow"
                                                    style={{
                                                        width: '26px',
                                                        height: '26px',
                                                        left: `${item.x}%`,
                                                        top: `${item.y}%`,
                                                        transform: 'translate(-50%, -50%)',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                    {index + 1}
                                                </div>
                                            )
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted">
                                        <i className="bi bi-image fs-1 mb-2"></i>
                                        <p>此資產或模板未上傳示意圖</p>
                                    </div>
                                )}
                            </div>

                            {/* 右側：題目清單表格 */}
                            <div className="col-lg-4 d-flex flex-column">
                                <div className="p-3 bg-white border-bottom fw-bold">
                                    項目清單 ({items.length})
                                </div>
                                <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '500px' }}>
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light sticky-top">
                                            <tr className="small text-uppercase">
                                                <th className="ps-3" style={{ width: '60px' }}>#</th>
                                                <th>項目名稱</th>
                                                <th className="pe-3 text-end">類型</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={item.id || index}>
                                                    <td className="ps-3 fw-bold text-primary">{index + 1}</td>
                                                    <td className="small">{item.name}</td>
                                                    <td className="pe-3 text-end">
                                                        <span className="badge bg-light text-dark border">
                                                            {item.item_type === 'pass_fail' ? '正常/異常' :
                                                                item.item_type === 'number' ? '數值' : '文字'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {items.length === 0 && !loading && (
                                                <tr>
                                                    <td colSpan="3" className="text-center py-5 text-muted italic">
                                                        此計畫尚未設定任何點位項目
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-3 bg-light border-top text-end">
                                    <button className="btn btn-secondary btn-sm" onClick={onClose}>關閉預覽</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}