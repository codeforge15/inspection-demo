import React from 'react'

export default function Pagination({
    itemsPerPage,
    totalItems,
    paginate,
    currentPage,
}) {
    const pageNumbers = []

    for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
        pageNumbers.push(i)
    }

    if (pageNumbers.length <= 1) return null

    return (
        <nav aria-label="Page navigation">
            <ul className="pagination justify-content-center mt-4">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous"
                    >
                        <span aria-hidden="true">&laquo;</span>
                    </button>
                </li>
                {pageNumbers.map(number => (
                    <li
                        key={number}
                        className={`page-item ${currentPage === number ? 'active' : ''
                            }`}
                    >
                        <button
                            onClick={() => paginate(number)}
                            className="page-link"
                        >
                            {number}
                        </button>
                    </li>
                ))}
                <li
                    className={`page-item ${currentPage === pageNumbers.length ? 'disabled' : ''
                        }`}
                >
                    <button
                        className="page-link"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === pageNumbers.length}
                        aria-label="Next"
                    >
                        <span aria-hidden="true">&raquo;</span>
                    </button>
                </li>
            </ul>
        </nav>
    )
}
