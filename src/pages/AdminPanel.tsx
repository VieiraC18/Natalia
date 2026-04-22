import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, User, Loader, Users, Ban, Trash2, RefreshCw } from 'lucide-react';
import api from '../api';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin?type=${activeTab}`);
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: number, action: string) => {
        if (action === 'delete' && !confirm('Tem certeza que deseja excluir permanentemente este usuário?')) return;

        try {
            await api.post('/api/admin', { user_id: userId, action });
            fetchUsers(); // Refresh list
        } catch (error) {
            alert('Erro ao processar ação');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel Administrativo</h1>
                <p className="text-gray-500 mt-2">Gerencie usuários e aprovações do sistema</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-4 text-center font-medium text-sm transition-colors relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Aprovações
                        </span>
                        {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-4 text-center font-medium text-sm transition-colors relative ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" />
                            Todos os Usuários
                        </span>
                        {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center text-gray-400">
                        <Loader className="w-8 h-8 animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            {activeTab === 'pending' ? <UserCheck className="w-8 h-8 text-gray-300" /> : <Users className="w-8 h-8 text-gray-300" />}
                        </div>
                        <p>{activeTab === 'pending' ? 'Nenhuma solicitação pendente.' : 'Nenhum usuário encontrado.'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <div key={user.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${user.status === 'approved' ? 'bg-green-100 text-green-600' :
                                            user.status === 'suspended' ? 'bg-orange-100 text-orange-600' :
                                                'bg-gray-100 text-gray-500'
                                        }`}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-gray-900">{user.name}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide border ${user.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    user.status === 'suspended' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {user.status === 'pending' ? 'Pendente' :
                                                    user.status === 'approved' ? 'Ativo' :
                                                        user.status === 'suspended' ? 'Suspenso' : user.status}
                                            </span>
                                            {user.role === 'admin' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-100">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <p className="text-xs text-gray-400 mt-1">Desde: {new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-auto">
                                    {activeTab === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleAction(user.id, 'reject')}
                                                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                            >
                                                <UserX className="w-4 h-4 mr-2" />
                                                Recusar
                                            </button>
                                            <button
                                                onClick={() => handleAction(user.id, 'approve')}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm shadow-green-200 transition-colors"
                                            >
                                                <UserCheck className="w-4 h-4 mr-2" />
                                                Aprovar
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {user.role !== 'admin' && (
                                                <>
                                                    {user.status === 'suspended' ? (
                                                        <button
                                                            onClick={() => handleAction(user.id, 'reactivate')}
                                                            title="Reativar Acesso"
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        >
                                                            <RefreshCw className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAction(user.id, 'suspend')}
                                                            title="Suspender Acesso"
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        >
                                                            <Ban className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleAction(user.id, 'delete')}
                                                        title="Excluir Usuário"
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
