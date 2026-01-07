import React from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className={`btn btn-sm ${theme === 'dark' ? 'btn-light' : 'btn-dark'}`}
            title={theme === 'light' ? "切換至深色模式" : "切換至淺色模式"}
        >
            {theme === 'light' ? (
                <i className="bi bi-moon-fill"></i>
            ) : (
                <i className="bi bi-sun-fill"></i>
            )}
            <span className="ms-2 d-none d-md-inline">
                {theme === 'light' ? 'Dark' : 'Light'}
            </span>
        </button>
    )
}
