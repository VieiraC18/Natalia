import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, DollarSign, LogOut, MapPin, Menu, X, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatAssistant from './ChatAssistant';

const DashboardLayout: React.FC = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Calendário', href: '/dashboard', icon: Calendar },
        { name: 'Relatórios', href: '/reports', icon: DollarSign },
        { name: 'Meus Locais', href: '/workplaces', icon: MapPin },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:inset-auto md:flex md:flex-col shadow-lg md:shadow-none`}>
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 mb-8">
                        <span className="text-xl font-bold text-blue-600 tracking-tight">MedHub</span>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="px-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <img src={user?.avatar_url || 'https://via.placeholder.com/40'} alt="Profile" className="w-10 h-10 rounded-full" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Doutor(a)'}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                    <nav className="mt-2 flex-1 px-2 space-y-1">
                        {user?.role === 'admin' && (
                            <Link
                                to="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${location.pathname === '/admin' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <Lock className={`mr-3 h-5 w-5 flex-shrink-0 ${location.pathname === '/admin' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
                                Aprovações
                            </Link>
                        )}
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <item.icon
                                        className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
                                            }`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-slate-200 p-4">
                    <button
                        onClick={logout}
                        className="flex-shrink-0 w-full group block text-left px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <div className="flex items-center">
                            <LogOut className="inline-block h-5 w-5 text-slate-400 group-hover:text-red-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-slate-500 group-hover:text-red-600">Sair</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 md:pl-0 flex flex-col h-screen overflow-hidden">
                <div className="md:hidden pl-4 pt-4 flex items-center">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
                <main className="flex-1 overflow-y-auto focus:outline-none p-4 md:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Floating AI Chat Button (Mobile & Desktop) */}
            <ChatAssistant />
        </div>
    );
};

export default DashboardLayout;
