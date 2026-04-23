import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, FileText, Briefcase } from 'lucide-react';
import api from '../api';

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData?: any;
}

interface Workplace {
    id: string;
    name: string;
    default_payment?: number;
    tax_percentage?: number;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
    const [formData, setFormData] = useState({
        location_name: '',
        location_address: '',
        start_time: '',
        end_time: '',
        payment_amount: '',
        tax_percentage: '0',
        shift_type: 'regular',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchWorkplaces();
        }
    }, [isOpen]);

    const fetchWorkplaces = async () => {
        try {
            const res = await api.get('/api/workplaces');
            setWorkplaces(res.data);
        } catch (error) {
            console.error('Failed to fetch workplaces');
        }
    };

    useEffect(() => {
        if (initialData) {
            setFormData({
                location_name: initialData.location_name || '',
                location_address: initialData.location_address || '',
                start_time: initialData.start_time ? new Date(initialData.start_time).toISOString().slice(0, 16) : '',
                end_time: initialData.end_time ? new Date(initialData.end_time).toISOString().slice(0, 16) : '',
                payment_amount: initialData.payment_amount || '',
                tax_percentage: initialData.tax_percentage !== undefined ? initialData.tax_percentage.toString() : '0',
                shift_type: initialData.shift_type || 'regular',
                notes: initialData.notes || ''
            });
        } else {
            setFormData({
                location_name: '',
                location_address: '',
                start_time: '',
                end_time: '',
                payment_amount: '',
                tax_percentage: '0',
                shift_type: 'regular',
                notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const place = workplaces.find(w => w.name === selectedId); // using name as value for compatibility

        if (place) {
            setFormData(prev => ({
                ...prev,
                location_name: place.name,
                payment_amount: place.default_payment ? place.default_payment.toString() : prev.payment_amount,
                tax_percentage: place.tax_percentage ? place.tax_percentage.toString() : prev.tax_percentage
            }));
        } else {
            setFormData(prev => ({ ...prev, location_name: selectedId }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData?.id) {
                await api.put(`/api/shifts/${initialData.id}`, formData);
            } else {
                await api.post('/api/shifts', formData);
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error('Failed to save shift', error);
            const msg = error.response?.data?.error || 'Erro ao salvar plantão. Tente novamente.';
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Editar Plantão' : 'Novo Plantão'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <div className="flex gap-2">
                                    <input
                                        list="workplaces-list"
                                        type="text"
                                        required
                                        placeholder="Selecione ou digite..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                        value={formData.location_name}
                                        onChange={e => handleLocationChange(e as any)}
                                    />
                                    <datalist id="workplaces-list">
                                        {workplaces.map(w => (
                                            <option key={w.id} value={w.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Dica: Cadastre locais na aba "Meus Locais" para aparecerem aqui.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                    value={formData.start_time}
                                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                    value={formData.end_time}
                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Bruto (R$)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                        value={formData.payment_amount}
                                        onChange={e => setFormData({ ...formData, payment_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imposto (%)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-[10px] w-4 h-4 text-gray-400 font-bold">%</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        placeholder="0"
                                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                        value={formData.tax_percentage}
                                        onChange={e => setFormData({ ...formData, tax_percentage: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {formData.payment_amount && (
                            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm border border-emerald-100">
                                Ganho Líquido Estimado: <strong className="font-bold">
                                    R$ {(parseFloat(formData.payment_amount) * (1 - (parseFloat(formData.tax_percentage) || 0) / 100)).toFixed(2)}
                                </strong>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <select
                                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all appearance-none bg-white"
                                        value={formData.shift_type}
                                        onChange={e => setFormData({ ...formData, shift_type: e.target.value })}
                                    >
                                        <option value="regular">Regular</option>
                                        <option value="extra">Extra</option>
                                        <option value="night">Noturno</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <textarea
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                    rows={3}
                                    placeholder="Detalhes adicionais..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-2">
                        {initialData?.id && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (confirm('Tem certeza que deseja excluir este plantão?')) {
                                        setLoading(true);
                                        try {
                                            await api.delete(`/api/shifts/${initialData.id}`);
                                            onSave();
                                            onClose();
                                        } catch (error) {
                                            alert('Erro ao excluir');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
                            >
                                <span className="mr-2">Excluir</span>
                            </button>
                        )}
                        <div className="flex gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Salvando...' : 'Salvar Plantão'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShiftModal;
