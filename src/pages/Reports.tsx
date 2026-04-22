import React, { useState, useEffect } from 'react';
import { Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, DollarSign, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';


interface Shift {
    id: string;
    location_name: string;
    start_time: string;
    end_time: string;
    payment_amount: number;
    tax_percentage: number;
    shift_type: string;
}

const Reports: React.FC = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + '01'); // 1st of current month
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); // Today
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchShifts();
    }, [startDate, endDate]);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/shifts?start=${startDate}T00:00:00&end=${endDate}T23:59:59`);
            setShifts(res.data);
        } catch (error) {
            console.error('Error fetching dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Data for Charts
    const earningsByLocation = Object.values(shifts.reduce((acc: any, shift) => {
        const loc = shift.location_name || 'Desconhecido';
        if (!acc[loc]) acc[loc] = { name: loc, bruto: 0, liquido: 0 };
        const gross = Number(shift.payment_amount);
        const tax = Number(shift.tax_percentage || 0);
        acc[loc].bruto += gross;
        acc[loc].liquido += (gross * (1 - tax / 100));
        return acc;
    }, {}));

    const hoursByLocation = Object.values(shifts.reduce((acc: any, shift) => {
        const loc = shift.location_name || 'Desconhecido';
        if (!acc[loc]) acc[loc] = { name: loc, hours: 0 };
        const start = new Date(shift.start_time).getTime();
        const end = new Date(shift.end_time).getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        acc[loc].hours += hours;
        return acc;
    }, {}));

    const totalEarnings = shifts.reduce((sum, s) => sum + Number(s.payment_amount), 0);
    const totalNetEarnings = shifts.reduce((sum, s) => {
        const gross = Number(s.payment_amount);
        const tax = Number(s.tax_percentage || 0);
        return sum + (gross * (1 - tax / 100));
    }, 0);
    
    const totalHours = shifts.reduce((sum, s) => {
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        return sum + ((end - start) / (1000 * 60 * 60));
    }, 0);

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235); // Blue
        doc.text('MedHub - Extrato de Ganhos', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Período: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`, 14, 28);
        doc.text(`Usuário: Administrador`, 14, 33);

        // Summary
        doc.setFillColor(243, 244, 246);
        doc.rect(14, 40, 180, 25, 'F');

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Total Ganhos:', 20, 50);
        doc.setFontSize(14);
        doc.text(`R$ ${totalEarnings.toFixed(2)}`, 20, 58);

        doc.setFontSize(12);
        doc.text('Total Horas:', 100, 50);
        doc.setFontSize(14);
        doc.text(`${totalHours.toFixed(1)}h`, 100, 58);

        // Table
        const tableBody = shifts.map(s => {
            const gross = Number(s.payment_amount);
            const net = gross * (1 - (Number(s.tax_percentage) || 0) / 100);
            return [
                new Date(s.start_time).toLocaleDateString(),
                s.location_name,
                `${new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                `R$ ${gross.toFixed(2)}`,
                `R$ ${net.toFixed(2)}`
            ];
        });

        autoTable(doc, {
            startY: 75,
            head: [['Data', 'Local', 'Horário', 'Bruto', 'Líquido']],
            body: tableBody,
            headStyles: { fillColor: [37, 99, 235] },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Gerado automaticamente via MedHub System', 14, finalY);

        doc.save(`Extrato_MedHub_${startDate}_${endDate}.pdf`);
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Relatórios & Ganhos</h1>
                    <p className="text-slate-500">Acompanhe seus rendimentos e produtividade.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="px-4 py-2 border rounded-lg text-sm"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="px-4 py-2 border rounded-lg text-sm"
                    />
                    <button
                        onClick={generatePDF}
                        disabled={loading || shifts.length === 0}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" /> Exportar PDF
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Ganhos Brutos</p>
                            <h3 className="text-2xl font-bold text-slate-900">R$ {totalEarnings.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-200 rounded-full">
                            <DollarSign className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                            <p className="text-sm text-emerald-700 font-medium">Ganhos Líquidos</p>
                            <h3 className="text-2xl font-bold text-emerald-900">R$ {totalNetEarnings.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Horas Trabalhadas</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold mb-6">Ganhos por Local (Bruto vs Líquido)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={earningsByLocation}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="bruto" name="Bruto" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="liquido" name="Líquido" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold mb-6">Horas por Local</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hoursByLocation}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}h`} />
                                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
