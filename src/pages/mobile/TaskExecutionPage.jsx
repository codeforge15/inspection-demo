import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function TaskExecutionPage() {
    const { taskId } = useParams()
    const navigate = useNavigate()

    const [task, setTask] = useState(null)
    const [items, setItems] = useState([]) // 儲存任務的所有檢查項
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchTaskAndItems()
    }, [taskId])

    const fetchTaskAndItems = async () => {
        setLoading(true)
        // 1. 撈取任務與設備基本資訊
        const { data: taskData } = await supabase
            .from('tasks')
            .select(`*, assets(name, location)`)
            .eq('id', taskId)
            .single()

        // 2. 撈取該任務底下的所有檢查細項
        const { data: itemsData } = await supabase
            .from('task_items')
            .select('*')
            .eq('task_id', taskId)
            .order('id', { ascending: true })

        if (taskData) setTask(taskData)
        if (itemsData) {
            // 初始化表單狀態，確保每個項目都有 result 和 notes 欄位
            const initializedItems = itemsData.map(item => ({
                ...item,
                result: item.result || '',
                notes: item.notes || ''
            }))
            setItems(initializedItems)
        }
        setLoading(false)
    }

    // 處理欄位變更
    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    const handleSubmit = async () => {
        // 檢查是否所有項目都已選擇/填寫
        const incomplete = items.some(item => !item.result)
        if (incomplete) {
            alert('請完成所有檢查項目的結果選擇')
            return
        }

        setIsSubmitting(true)
        try {
            // 1. 逐一更新 task_items 的結果與備註
            for (const item of items) {
                await supabase
                    .from('task_items')
                    .update({ result: item.result, notes: item.notes })
                    .eq('id', item.id)
            }

            // 2. 在 records 寫入一筆總結紀錄
            // 判定：若有 'fail' 或 '異常'，總體標記為 fail
            const isFail = items.some(i => i.result === 'fail' || i.result === '異常')

            await supabase.from('records').insert([{
                task_id: taskId,
                result: isFail ? 'fail' : 'pass',
                notes: `行動端提交：完成 ${items.length} 項檢查項目`,
                submitted_at: new Date()
            }])

            // 3. 更新主任務狀態為 'completed'
            await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId)

            alert('巡檢完成，資料已成功上傳！')
            navigate('/mobile')
        } catch (error) {
            console.error(error)
            alert('提交失敗，請檢查網路連線')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return <div className="text-center p-5">載入中...</div>

    return (
        <div className="container-fluid pb-5 bg-light min-vh-100 p-0">
            {/* 導覽列 */}
            <div className="bg-white sticky-top py-3 px-3 border-bottom mb-3 shadow-sm d-flex align-items-center">
                <button className="btn btn-link p-0 me-3 text-dark" onClick={() => navigate(-1)}>
                    <i className="bi bi-chevron-left fs-4"></i>
                </button>
                <h5 className="mb-0 fw-bold">執行巡檢</h5>
            </div>

            <div className="container">
                {/* 設備資訊卡片 */}
                <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-body">
                        <h4 className="fw-bold text-primary mb-1">{task?.assets?.name}</h4>
                        <div className="text-muted small">
                            <i className="bi bi-geo-alt me-1"></i>{task?.assets?.location}
                        </div>
                    </div>
                </div>

                {/* 檢查項目列表 */}
                <div className="row g-3">
                    {items.map((item, index) => (
                        <div className="col-12" key={item.id}>
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between mb-3">
                                        <span className="fw-bold">{index + 1}. {item.name}</span>
                                        <span className="badge bg-light text-secondary border">
                                            {item.item_type === 'number' ? '數值' :
                                                item.item_type === 'select' ? '單選' : '判定'}
                                        </span>
                                    </div>

                                    {/* 下方根據類型顯示不同的輸入控制件 */}
                                    <div className="mb-3">

                                        {/* 類型 1: 數值輸入 */}
                                        {item.item_type === 'number' && (
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="輸入數值"
                                                value={item.result}
                                                onChange={(e) => handleItemChange(item.id, 'result', e.target.value)}
                                            />
                                        )}

                                        {/* 類型 2: 下拉選單 (針對 select 型態) */}
                                        {item.item_type === 'select' && (
                                            <select
                                                className="form-select border-primary"
                                                value={item.result}
                                                onChange={(e) => handleItemChange(item.id, 'result', e.target.value)}
                                            >
                                                <option value="">-- 請選擇結果 --</option>
                                                {item.options?.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}

                                        {/* 類型 3: 合格/不合格 (針對 pass_fail 型態) */}
                                        {item.item_type === 'pass_fail' && (
                                            <div className="btn-group w-100">
                                                <button
                                                    className={`btn ${item.result === 'pass' ? 'btn-success' : 'btn-outline-success'}`}
                                                    onClick={() => handleItemChange(item.id, 'result', 'pass')}
                                                >合格</button>
                                                <button
                                                    className={`btn ${item.result === 'fail' ? 'btn-danger' : 'btn-outline-danger'}`}
                                                    onClick={() => handleItemChange(item.id, 'result', 'fail')}
                                                >不合格</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 備註欄 */}
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text bg-light border-0"><i className="bi bi-chat-left-text"></i></span>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0"
                                            placeholder="備註說明..."
                                            value={item.notes}
                                            onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 提交按鈕 */}
                <div className="py-5">
                    <button
                        className="btn btn-primary btn-lg w-100 fw-bold shadow"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '提交中...' : '確認提交巡檢結果'}
                    </button>
                </div>
            </div>
        </div>
    )
}