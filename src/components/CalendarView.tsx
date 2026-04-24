import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import api from '../api';
import ShiftModal from './ShiftModal';

interface Shift {
    id: string;
    location_name: string;
    location_address?: string; // Optional
    start_time: string;
    end_time: string;
    payment_amount: number;
    shift_type: string;
    notes?: string;
}

const CalendarView: React.FC = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | undefined>(undefined);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        fetchShifts();
    }, [refreshTrigger]);

    const fetchShifts = async () => {
        try {
            // Note: In deployed PHP backend the path matches /api/shifts
            // But api.ts baseURL handles standard calls.
            // If using the deployment structure: /api/shifts
            const res = await api.get('/api/shifts');
            setShifts(res.data);
        } catch (error) {
            console.error("Failed to fetch shifts", error);
        }
    };

    const handleNewShift = () => {
        setSelectedShift(undefined);
        setIsModalOpen(true);
    };

    const handleDateClick = (arg: any) => {
        // arg.dateStr is usually YYYY-MM-DD
        const defaultStart = `${arg.dateStr}T08:00`;
        const defaultEnd = `${arg.dateStr}T20:00`;

        setSelectedShift({
            id: '',
            location_name: '',
            start_time: defaultStart,
            end_time: defaultEnd,
            payment_amount: 0,
            shift_type: 'regular'
        });
        setIsModalOpen(true);
    };

    const handleEventClick = (info: any) => {
        const shiftId = info.event.id;
        const shift = shifts.find(s => s.id == shiftId);
        if (shift) {
            setSelectedShift(shift);
            setIsModalOpen(true);
        }
        // info.jsEvent.preventDefault(); // don't let the browser navigate
    };

    const handleSave = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const events = shifts.map(shift => ({
        id: shift.id,
        title: `${shift.location_name} - R$${shift.payment_amount}`,
        start: shift.start_time,
        end: shift.end_time,
        backgroundColor: shift.shift_type === 'extra' ? '#10b981' : '#3b82f6',
        borderColor: shift.shift_type === 'extra' ? '#059669' : '#2563eb',
        textColor: '#ffffff',
        extendedProps: {
            amount: shift.payment_amount,
            type: shift.shift_type
        }
    }));

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Agenda de Plantões</h1>
                    <p className="text-slate-500">Gerencie sua escala e acompanhe seus ganhos.</p>
                </div>
                <button
                    onClick={handleNewShift}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                >
                    + Novo Plantão
                </button>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-6 glass-panel calendar-container">
                <div className="w-full">
                    <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={ptBrLocale}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    buttonText={{
                        today: 'Hoje',
                        month: 'Mês',
                        week: 'Semana',
                        day: 'Dia',
                        list: 'Lista'
                    }}
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    contentHeight="auto"
                    handleWindowResize={true}
                    dayHeaderContent={(args) => {
                        const dayName = args.date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                        const dayNum = args.date.getDate();
                        const isToday = args.isToday;
                        
                        return (
                            <div className="flex flex-col items-center justify-center py-1">
                                <span className="text-[10px] font-normal text-slate-500 uppercase">{dayName}</span>
                                <span className={`text-[13px] font-bold mt-0.5 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-800'}`}>
                                    {dayNum}
                                </span>
                            </div>
                        );
                    }}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false
                    }}
                    slotLabelFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false,
                        hour12: false
                    }}
                />
                </div>
            </div>

            <ShiftModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={selectedShift}
            />
        </div>
    );
};

export default CalendarView;
