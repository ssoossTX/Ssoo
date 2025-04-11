interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Header({ theme, toggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Game Title */}
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            <i className="ri-gamepad-line mr-1"></i> Tapper
          </h1>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <i className={`ri-sun-line ${theme === 'dark' ? 'hidden' : 'inline'}`}></i>
            <i className={`ri-moon-line ${theme === 'light' ? 'hidden' : 'inline'}`}></i>
          </button>
        </div>
      </div>
    </header>
  );
}
