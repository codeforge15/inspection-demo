import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
    // 優先從 localStorage 讀取，如果沒有則預設 'light' (或可改 'auto' 偵測系統)
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'light'
    })

    useEffect(() => {
        // 當 theme 改變時，設定 html 的 data-bs-theme 屬性
        document.documentElement.setAttribute('data-bs-theme', theme)
        // 寫入 localStorage
        localStorage.setItem('app-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
