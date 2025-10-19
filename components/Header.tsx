
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, User, LogOut } from 'lucide-react';

const Header: React.FC = () => {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const isAuthPage = location.pathname === '/' || location.pathname === '/privacy-policy';

    if (isAuthPage && !currentUser) {
        return null;
    }
    
    if(!currentUser) return null;

    return (
        <header className="sticky top-4 z-50 mx-auto max-w-6xl px-4 animate-fade-in">
            <div className="flex items-center justify-between rounded-xl bg-white/60 dark:bg-gray-800/60 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur-lg">
                <Link to="/feed" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-white text-lg shadow-md">
                        PS
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">Prompt Scientist</h1>
                </Link>

                <nav className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <Link to="/profile" className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Profile">
                        <User size={20} />
                    </Link>
                </nav>
            </div>
        </header>
    );
};

export default Header;
