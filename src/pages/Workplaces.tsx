import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Building, Edit2 } from 'lucide-react';
import api from '../api';

interface Workplace {
    tax_percentage?: number;
    id: string;
    name: string;
    address?: string;
    default_payment?: number;
}

const Workplaces: React.FC = () => {
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', address: '', default_payment: '', tax_percentage: '' });
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchWorkplaces();
    }, []);

    const fetchWorkplaces = async () => {
        try {
            const res = await api.get('/api/workplaces');
            setWorkplaces(res.data);
        } catch (error) {
            console.error('Error fetching workplaces', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este local?')) return;
        try {
            await api.delete(`/api/workplaces?id=${id}`);
            setWorkplaces(workplaces.filter(w => w.id !== id));
        } catch (error) {
            alert('Erro ao deletar local');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (editId) {
                await api.put(`/api/workplaces/${editId}`, newItem);
            } else {
                await api.post('/api/workplaces', newItem);
            }
            setShowForm(false);
            setEditId(null);
            setNewItem({ name: '', address: '', default_payment: '', tax_percentage: '' });
            fetchWorkplaces();
        } catch (error: any) {
            console.error(error);
            setError(error.response?.data?.error || 'Erro ao salvar local. Certifique-se de que o banco de dados está atualizado com as colunas corretas.');
        }
    };

    const handleEdit = (place: Workplace) => {
        setError(null);
        setNewItem({ 
            name: place.name, 
            address: place.address || '', 
            default_payment: place.default_payment ? place.default_payment.toString() : '', 
            tax_percentage: place.tax_percentage ? place.tax_percentage.toString() : '' 
        });
        setEditId(place.id);
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Meus Locais</h1>
                    <p className="text-slate-500">Gerencie os hospitais e clínicas onde você trabalha.</p>
                </div>
                <button
                    onClick={() => {
                        setEditId(null);
                        setNewItem({ name: '', address: '', default_payment: '', tax_percentage: '' });
                        setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Novo Local
                </button>
            </header>

            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-bold mb-4">{editId ? 'Editar Local' : 'Adicionar Novo Local'}</h3>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Local</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Hospital Central"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Rua das Flores, 123"
                                    value={newItem.address}
                                    onChange={e => setNewItem({ ...newItem, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Padrão Hora/Plantão (R$)</label>
                                <input
                                    type="number" step="0.01"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                    value={newItem.default_payment}
                                    onChange={e => setNewItem({ ...newItem, default_payment: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Imposto/Desconto (%)</label>
                                <input
                                    type="number" step="0.1" max="100" min="0"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: 27.5"
                                    value={newItem.tax_percentage}
                                    onChange={e => setNewItem({ ...newItem, tax_percentage: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setError(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editId ? 'Atualizar' : 'Salvar'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workplaces.map(place => (
                    <div key={place.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start group hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl h-fit">
                                <Building className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{place.name}</h3>
                                {place.address && (
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" /> {place.address}
                                    </p>
                                )}
                                {place.default_payment && Number(place.default_payment) > 0 && (
                                    <p className="text-sm font-medium text-green-600 mt-2">
                                        R$ {Number(place.default_payment).toFixed(2)} (base)
                                    </p>
                                )}
                                {place.tax_percentage && Number(place.tax_percentage) > 0 && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-md">
                                        -{Number(place.tax_percentage)}% Imposto
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleEdit(place)}
                                className="text-slate-300 hover:text-blue-500 transition-colors p-2"
                                title="Editar Local"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleDelete(place.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                title="Excluir Local"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {!loading && workplaces.length === 0 && !showForm && (
                    <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <p>Nenhum local cadastrado. Adicione seu primeiro local de trabalho!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Workplaces;
