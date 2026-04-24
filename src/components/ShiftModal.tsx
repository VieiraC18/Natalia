import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, FileText, Briefcase, Calculator, Repeat, Clock, Users, Trash2 } from 'lucide-react';
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
        notes: '',
        payment_type: 'fixed',
        hourly_rate: '',
        worked_hours: '',
        per_patient_rate: '',
        estimated_patients: '',
        attended_patients: '',
        return_patients: '',
        deduct_lunch: false,
        is_recurring: false,
        recurrence_end_date: ''
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
                notes: initialData.notes || '',
                payment_type: initialData.payment_type || 'fixed',
                hourly_rate: initialData.hourly_rate || '',
                worked_hours: initialData.worked_hours || '',
                per_patient_rate: initialData.per_patient_rate || '',
                estimated_patients: initialData.estimated_patients || '',
                attended_patients: initialData.attended_patients || '',
                return_patients: initialData.return_patients || '',
                deduct_lunch: initialData.deduct_lunch ? true : false,
                is_recurring: false,
                recurrence_end_date: ''
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
                notes: '',
                payment_type: 'fixed',
                hourly_rate: '',
                worked_hours: '',
                per_patient_rate: '',
                estimated_patients: '',
                attended_patients: '',
                return_patients: '',
                deduct_lunch: false,
                is_recurring: false,
                recurrence_end_date: ''
            });
        }
    }, [initialData, isOpen]);

    // Recalculate payment_amount when dependent fields change
    useEffect(() => {
        let calculated = 0;
        if (formData.payment_type === 'hourly') {
            const hours = parseFloat(formData.worked_hours) || 0;
            const rate = parseFloat(formData.hourly_rate) || 0;
            const finalHours = formData.deduct_lunch ? Math.max(0, hours - 1) : hours;
            calculated = finalHours * rate;
            setFormData(prev => ({ ...prev, payment_amount: calculated.toFixed(2) }));
        } else if (formData.payment_type === 'per_patient') {
            const attended = parseInt(formData.attended_patients) || 0;
            const returns = parseInt(formData.return_patients) || 0;
            const rate = parseFloat(formData.per_patient_rate) || 0;
            const billable = Math.max(0, attended - returns);
            calculated = billable * rate;
            setFormData(prev => ({ ...prev, payment_amount: calculated.toFixed(2) }));
        }
    }, [
        formData.payment_type, 
        formData.hourly_rate, 
        formData.worked_hours, 
        formData.deduct_lunch, 
        formData.per_patient_rate, 
        formData.attended_patients, 
        formData.return_patients
    ]);

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const place = workplaces.find(w => w.name === selectedId);

        if (place) {
            setFormData(prev => ({
                ...prev,
                location_name: place.name,
                payment_amount: place.default_payment && prev.payment_type === 'fixed' ? place.default_payment.toString() : prev.payment_amount,
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

    const estimatedGainsPerPatient = () => {
        const est = parseInt(formData.estimated_patients) || 0;
        const returns = parseInt(formData.return_patients) || 0;
        const rate = parseFloat(formData.per_patient_rate) || 0;
        return (Math.max(0, est - returns) * rate).toFixed(2);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 relative animate-scale-up">
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Editar Plantão' : 'Novo Plantão'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Classificação</label>
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
                    </div>

                    {/* Financial Section */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-600" />
                            Cálculo de Ganhos
                        </h3>
                        
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, payment_type: 'fixed' })}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.payment_type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Fixo
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, payment_type: 'hourly' })}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.payment_type === 'hourly' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Por Hora
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, payment_type: 'per_patient' })}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.payment_type === 'per_patient' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Por Paciente
                            </button>
                        </div>

                        {/* Fixed Payment */}
                        {formData.payment_type === 'fixed' && (
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
                        )}

                        {/* Hourly Payment */}
                        {formData.payment_type === 'hourly' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Hora (R$)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                placeholder="0.00"
                                                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                                value={formData.hourly_rate}
                                                onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Horas Trabalhadas</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                step="0.5"
                                                required
                                                placeholder="0"
                                                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                                value={formData.worked_hours}
                                                onChange={e => setFormData({ ...formData, worked_hours: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                        checked={formData.deduct_lunch}
                                        onChange={(e) => setFormData({...formData, deduct_lunch: e.target.checked})}
                                    />
                                    Desconta 1 hora de almoço
                                </label>
                            </div>
                        )}

                        {/* Per Patient Payment */}
                        {formData.payment_type === 'per_patient' && (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor por Paciente (R$)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                            value={formData.per_patient_rate}
                                            onChange={e => setFormData({ ...formData, per_patient_rate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimados</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input
                                                type="number"
                                                required
                                                placeholder="0"
                                                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                                value={formData.estimated_patients}
                                                onChange={e => setFormData({ ...formData, estimated_patients: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Compareceram</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-3 w-4 h-4 text-blue-400" />
                                            <input
                                                type="number"
                                                required
                                                placeholder="0"
                                                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all bg-blue-50"
                                                value={formData.attended_patients}
                                                onChange={e => setFormData({ ...formData, attended_patients: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Retornos (Grátis)</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-3 w-4 h-4 text-orange-400" />
                                            <input
                                                type="number"
                                                required
                                                placeholder="0"
                                                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all bg-orange-50"
                                                value={formData.return_patients}
                                                onChange={e => setFormData({ ...formData, return_patients: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 text-right">
                                    *(Compareceram - Retornos) × Valor
                                </div>
                                <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-600 flex justify-between">
                                    <span>Ganho Estimado (se todos fossem):</span>
                                    <span className="font-semibold">R$ {estimatedGainsPerPatient()}</span>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Total Bruto Calculado:</span>
                                <span className="text-lg font-bold text-gray-900">
                                    R$ {formData.payment_amount || '0.00'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100">
                                <span className="font-medium">Total Líquido a Receber:</span>
                                <span className="text-xl font-bold">
                                    R$ {(parseFloat(formData.payment_amount || '0') * (1 - (parseFloat(formData.tax_percentage) || 0) / 100)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recurrence Option (Only for new shifts) */}
                    {!initialData?.id && (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                            <label className="flex items-center gap-2 font-medium text-blue-900 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    checked={formData.is_recurring}
                                    onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                                />
                                <Repeat className="w-4 h-4" />
                                Repetir plantão toda semana
                            </label>
                            
                            {formData.is_recurring && (
                                <div className="pl-6 animate-fade-in">
                                    <label className="block text-sm text-gray-700 mb-1">Data limite da repetição</label>
                                    <input
                                        type="date"
                                        required={formData.is_recurring}
                                        className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                        value={formData.recurrence_end_date}
                                        onChange={e => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                                        min={formData.start_time.split('T')[0]}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                rows={2}
                                placeholder="Detalhes adicionais..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-gray-100">
                        {initialData?.id ? (
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
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </button>
                        ) : <div />}
                        <div className="flex gap-3">
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
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
