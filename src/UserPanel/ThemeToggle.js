import { useTheme } from './ThemeContext'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      <span className="shadow"></span>
      <span className="edge"></span>
      <span className="front">{theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
    </button>
  )
}

export default ThemeToggle
