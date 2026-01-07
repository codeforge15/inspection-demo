import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'bootstrap'

export default function TaskDetailModal({ show, onClose, task, items }) {
    const modalRef = useRef(null)
    const [modalInstance, setModalInstance] = useState(null)

    useEffect(() => {
        if (modalRef.current) {
            setModalInstance(new Modal(modalRef.current))
        }
    }, [])

    useEffect(() => {
        if (show && modalInstance) modalInstance.show()
        else if (!show && modalInstance) modalInstance.hide()
    }, [show, modalInstance])

    const getTypeBadge = (type) => {
        switch (type) {
            case 'number': return <span className="badge bg-success">數值</span>
            case 'select': return <span className="badge bg-warning text-dark">單選</span>
            default: return <span className="badge bg-secondary">檢查</span>
        }
    }

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">任務詳情</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {task && (
                            <>
                                <div className="alert alert-info py-2 mb-3 d-flex justify-content-between">
                                    <span><strong>{task.assets?.name}</strong></span>
                                    <span>日期: {task.assigned_date}</span>
                                    <span>狀態: {task.status}</span>
                                </div>
                                <h6 className="border-bottom pb-2 mb-3">檢查結果列表</h6>
                                <table className="table table-striped table-sm">
                                    <thead>
                                        <tr>
                                            <th>項目</th>
                                            <th>類型</th>
                                            <th>結果</th>
                                            <th>備註</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td>{getTypeBadge(item.item_type)}</td>
                                                <td className="text-primary">{item.result || '-'}</td>
                                                <td className="text-muted small">{item.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>關閉</button>
                    </div>
                </div>
            </div>
        </div>
    )
}