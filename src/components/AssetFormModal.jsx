import React, { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import { supabase } from '../supabaseClient'

// fixedType: 'field' | 'device' (強制指定類型)
export default function AssetFormModal({ show, onClose, onSuccess, initialData, fixedType }) {
    const modalRef = useRef(null)
    const [modalInstance, setModalInstance] = useState(null)
    const [loading, setLoading] = useState(false)

    // 圖片相關
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        image_url: ''
    })

    useEffect(() => {
        if (modalRef.current) {
            setModalInstance(new Modal(modalRef.current, { backdrop: 'static' }))
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
        setSelectedFile(null)
        setPreviewUrl('')

        if (initialData) {
            setFormData({
                name: initialData.name,
                location: initialData.location || '',
                image_url: initialData.image_url || ''
            })
            setPreviewUrl(initialData.image_url || '')
        } else {
            setFormData({ name: '', location: '', image_url: '' })
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const uploadImage = async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${fixedType}_${Date.now()}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
            .from('asset-images')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('asset-images').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            let finalImageUrl = formData.image_url
            if (selectedFile) {
                finalImageUrl = await uploadImage(selectedFile)
            }

            const payload = {
                name: formData.name,
                location: formData.location,
                image_url: finalImageUrl,
                type: fixedType // 強制寫入目前的類型
            }

            if (initialData) {
                const { error } = await supabase.from('assets').update(payload).eq('id', initialData.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('assets').insert([payload])
                if (error) throw error
            }

            onSuccess()
            onClose()
        } catch (error) {
            alert('操作失敗: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const title = fixedType === 'field' ? '場域' : '設備'

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{initialData ? `編輯${title}` : `新增${title}`}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">{title}名稱</label>
                                <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">圖片 (選填)</label>
                                <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                                {previewUrl && (
                                    <div className="mt-2 text-center p-2 border bg-light rounded">
                                        <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">位置/區域描述</label>
                                <input type="text" className="form-control" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="例如: A棟3樓" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? '處理中...' : '確認儲存'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}