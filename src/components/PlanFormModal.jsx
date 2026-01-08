import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function PlanFormModal({ show, onClose, onSuccess, initialData }) {
    // --- 狀態管理 ---
    const [step, setStep] = useState(1); // 1: 基本資料, 2: 點位設定
    const [loading, setLoading] = useState(false);
    const [planId, setPlanId] = useState(null);

    const [assets, setAssets] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [users, setUsers] = useState([]);
    const [assetImage, setAssetImage] = useState('');

    const [formData, setFormData] = useState({
        asset_id: '',
        template_id: '',
        frequency: 'daily',
        assigned_user: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        description: '',
        is_active: true
    });

    const [items, setItems] = useState([]);

    // --- 初始化 ---
    useEffect(() => {
        if (show) {
            fetchOptions();
            if (initialData) {
                setFormData(initialData);
                setPlanId(initialData.id);
                fetchPlanItems(initialData.id);
                setStep(1);
            } else {
                resetForm();
            }
        }
    }, [show, initialData]);

    const resetForm = () => {
        setFormData({
            asset_id: '', template_id: '', frequency: 'daily',
            assigned_user: '', start_date: new Date().toISOString().split('T')[0],
            end_date: '', description: '', is_active: true
        });
        setItems([]);
        setPlanId(null);
        setStep(1);
    };

    // --- 資料讀取 ---
    const fetchOptions = async () => {
        try {
            const { data: a } = await supabase.from('assets').select('id, name, image_url').order('name');
            const { data: t } = await supabase.from('templates').select('id, name').order('name');
            const { data: p } = await supabase.from('profiles').select('full_name, email').order('full_name');

            if (a) setAssets(a);
            if (t) setTemplates(t);
            if (p) setUsers(p.filter(u => u.full_name)); // 僅顯示有姓名的帳號 
        } catch (err) {
            console.error("選單載入失敗", err);
        }
    };

    const fetchPlanItems = async (id) => {
        const { data } = await supabase.from('plan_items').select('*').eq('plan_id', id).order('id', { ascending: true });
        if (data) setItems(data);
    };

    // --- 邏輯處理：第一步 (儲存計畫) ---
    const handleNextStep = async (e) => {
        e.preventDefault();
        setLoading(true);

        const submitData = {
            ...formData,
            end_date: formData.end_date === "" ? null : formData.end_date, // 避免空字串日期錯誤
            asset_id: parseInt(formData.asset_id),
            template_id: formData.template_id ? parseInt(formData.template_id) : null
        };

        try {
            let currentPlanId = planId;
            if (planId) {
                await supabase.from('plans').update(submitData).eq('id', planId);
            } else {
                const { data, error } = await supabase.from('plans').insert([submitData]).select().single();
                if (error) throw error;
                currentPlanId = data.id;
                setPlanId(data.id);

                // 如果有選模板且目前沒點位，自動從模板載入預設項目 
                if (formData.template_id && items.length === 0) {
                    const { data: tItems } = await supabase.from('template_items').select('*').eq('template_id', formData.template_id);
                    if (tItems) {
                        const newPlanItems = tItems.map(ti => ({
                            plan_id: data.id, name: ti.name, item_type: ti.item_type,
                            options: ti.options, x: ti.x, y: ti.y
                        }));
                        setItems(newPlanItems);
                    }
                }
            }

            const selectedAsset = assets.find(a => a.id === parseInt(formData.asset_id));
            if (selectedAsset) setAssetImage(selectedAsset.image_url);
            setStep(2);
        } catch (err) {
            alert('儲存失敗：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- 邏輯處理：第二步 (標註點位) ---
    const handleImageClick = (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newItem = {
            plan_id: planId,
            name: `檢查項 ${items.length + 1}`,
            item_type: 'pass_fail',
            x: parseFloat(x.toFixed(2)), // 確保存入的是數字型態 
            y: parseFloat(y.toFixed(2))
        };
        setItems([...items, newItem]);
    };

    const handleFinalSave = async () => {
        setLoading(true);
        try {
            // 1. 儲存計畫項目 (plan_items)
            await supabase.from('plan_items').delete().eq('plan_id', planId);
            if (items.length > 0) {
                const { error: itemsError } = await supabase.from('plan_items').insert(items);
                if (itemsError) throw itemsError;
            }

            // 2. 判斷是否需要立即產生今日任務
            const today = new Date().toISOString().split('T')[0];
            if (formData.start_date === today && formData.is_active) {
                await triggerInitialTask(planId, formData);
            }

            onSuccess();
            onClose();
            alert('計畫已儲存，並已為今日產生初始任務！');
        } catch (err) {
            alert('儲存失敗：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 產生初始任務的輔助函式
    const triggerInitialTask = async (pId, pData) => {
        // A. 建立 Task 主檔
        const { data: newTask, error: taskError } = await supabase
            .from('tasks')
            .insert([{
                plan_id: pId,
                asset_id: pData.asset_id,
                assigned_user: pData.assigned_user,
                assigned_date: pData.start_date,
                status: 'pending',
                frequency: pData.frequency
            }])
            .select()
            .single();

        if (taskError) throw taskError;

        // B. 複製點位項目到 task_items
        // 優先從剛剛存好的 items (即 plan_items) 複製
        if (items.length > 0) {
            const taskItems = items.map(item => ({
                task_id: newTask.id,
                name: item.name,
                item_type: item.item_type,
                options: item.options,
                x: item.x,
                y: item.y
            }));
            await supabase.from('task_items').insert(taskItems);
        }
    };


    if (!show) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className={`modal-dialog modal-dialog-centered ${step === 2 ? 'modal-xl' : 'modal-lg'}`}>
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title fw-bold">
                            {step === 1 ? 'Step 1: 編輯排程計畫' : 'Step 2: 點位標註與項目設定'}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4">
                        {step === 1 ? (
                            <form id="planForm" onSubmit={handleNextStep}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">巡檢對象 (資產)</label>
                                        <select className="form-select" required value={formData.asset_id} onChange={e => setFormData({ ...formData, asset_id: e.target.value })}>
                                            <option value="">-- 選擇資產 --</option>
                                            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">參考模板 (選填)</label>
                                        <select className="form-select" value={formData.template_id} onChange={e => setFormData({ ...formData, template_id: e.target.value })}>
                                            <option value="">-- 自訂點位 (不使用模板) --</option>
                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">週期</label>
                                        <select className="form-select" value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })}>
                                            <option value="daily">每日</option>
                                            <option value="weekly">每週</option>
                                            <option value="monthly">每月</option>
                                        </select>
                                    </div>
                                    <div className="col-md-8">
                                        <label className="form-label fw-bold">預設指派人員</label>
                                        <select className="form-select" required value={formData.assigned_user} onChange={e => setFormData({ ...formData, assigned_user: e.target.value })}>
                                            <option value="">-- 選擇巡檢員 --</option>
                                            {users.map(u => <option key={u.email} value={u.full_name}>{u.full_name} ({u.email})</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-primary">開始日期</label>
                                        <input type="date" className="form-control" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-danger">結束日期 (選填)</label>
                                        <input type="date" className="form-control" value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">計畫備註</label>
                                        <textarea className="form-control" rows="2" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="row">
                                <div className="col-lg-8 border-end text-center">
                                    <div className="alert alert-secondary py-1 small">點擊圖片標註巡檢點位</div>
                                    <div className="position-relative bg-light rounded border overflow-hidden d-inline-block shadow-sm" style={{ cursor: 'crosshair' }}>
                                        {assetImage ? (
                                            <>
                                                <img src={assetImage} className="img-fluid" onClick={handleImageClick} alt="Map" style={{ maxHeight: '600px' }} />
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="position-absolute bg-primary text-white rounded-circle shadow border border-2 border-white d-flex align-items-center justify-content-center"
                                                        style={{ width: '28px', height: '28px', left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold' }}>
                                                        {idx + 1}
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="p-5 text-muted">此資產未設定底圖，請至場域管理上傳圖片。</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <h6 className="fw-bold mb-3">檢查項目 ({items.length})</h6>
                                    <div className="overflow-auto pe-2" style={{ maxHeight: '550px' }}>
                                        {items.map((item, idx) => (
                                            <div key={idx} className="card mb-2 p-2 border-start border-4 border-primary shadow-sm">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <span className="badge bg-dark">{idx + 1}</span>
                                                    <input className="form-control form-control-sm" value={item.name} onChange={e => {
                                                        const n = [...items]; n[idx].name = e.target.value; setItems(n);
                                                    }} />
                                                    <button className="btn btn-sm text-danger p-0" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                                <select className="form-select form-select-sm" value={item.item_type} onChange={e => {
                                                    const n = [...items]; n[idx].item_type = e.target.value; setItems(n);
                                                }}>
                                                    <option value="pass_fail">正常/異常</option>
                                                    <option value="number">數值錄入</option>
                                                    <option value="text">文字備註</option>
                                                </select>
                                            </div>
                                        ))}
                                        {items.length === 0 && <div className="text-center py-5 text-muted small">尚未新增任何項目</div>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer bg-light border-0">
                        {step === 1 ? (
                            <>
                                <button type="button" className="btn btn-link text-secondary" onClick={onClose}>取消</button>
                                <button type="submit" form="planForm" className="btn btn-primary px-4 fw-bold">
                                    下一步：設定點位內容 <i className="bi bi-arrow-right ms-1"></i>
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(1)} disabled={loading}>回上一步</button>
                                <button type="button" className="btn btn-success px-5 fw-bold" onClick={handleFinalSave} disabled={loading}>
                                    <i className="bi bi-check-lg me-1"></i> {loading ? '儲存中...' : '確認並儲存計畫'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}