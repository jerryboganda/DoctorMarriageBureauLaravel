import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Pressable,
    Dimensions,
} from 'react-native';
import { MotiView } from 'moti';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import Button from './Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    initialDate?: Date | null;
}

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DatePicker: React.FC<DatePickerProps> = ({ isOpen, onClose, onSelect, initialDate }) => {
    const insets = useSafeAreaInsets();
    const [viewDate, setViewDate] = useState(initialDate || new Date(1995, 0, 1));
    const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
    const [view, setView] = useState<'calendar' | 'years'>(initialDate ? 'calendar' : 'years');

    useEffect(() => {
        if (isOpen) {
            const start = initialDate || new Date(1995, 0, 1);
            setViewDate(start);
            setSelectedDate(initialDate || null);
            setView(initialDate ? 'calendar' : 'years');
        }
    }, [isOpen]);

    const changeMonth = (dir: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1));
    };

    const changeYear = (year: number) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setView('calendar');
    };

    const handleDayClick = (day: number) => {
        setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    };

    const handleConfirm = () => {
        if (selectedDate) {
            onSelect(selectedDate);
            onClose();
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysCount = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();
        return { daysCount, firstDayIndex };
    };

    const { daysCount, firstDayIndex } = getDaysInMonth(viewDate);
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 70 }, (_, i) => currentYear - 16 - i);

    return (
        <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
            <View className="flex-1">
                <Pressable className="flex-1 bg-black/40" onPress={onClose} />

                <MotiView
                    from={{ translateY: Dimensions.get('window').height }}
                    animate={{ translateY: 0 }}
                    exit={{ translateY: Dimensions.get('window').height }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="bg-white rounded-t-[40px] p-6 pb-10"
                    style={{ paddingBottom: insets.bottom + 20 }}
                >
                    {/* Handle */}
                    <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity
                            onPress={() => setView(view === 'calendar' ? 'years' : 'calendar')}
                            className="flex-row items-center"
                        >
                            <Text className="text-2xl font-black text-slate-800 mr-2">
                                {MONTHS[viewDate.getMonth()]}
                            </Text>
                            <Text className="text-2xl font-black text-brand-blue">
                                {viewDate.getFullYear()}
                            </Text>
                            <MotiView animate={{ rotate: view === 'years' ? '90deg' : '0deg' }}>
                                <ChevronRightIcon className="w-6 h-6 text-slate-400" />
                            </MotiView>
                        </TouchableOpacity>

                        {view === 'calendar' && (
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => changeMonth(-1)}
                                    className="p-2 bg-slate-100 rounded-full"
                                >
                                    <ChevronLeftIcon className="w-6 h-6 text-slate-600" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => changeMonth(1)}
                                    className="p-2 bg-slate-100 rounded-full"
                                >
                                    <ChevronRightIcon className="w-6 h-6 text-slate-600" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Content */}
                    <View className="min-h-[300px]">
                        {view === 'calendar' ? (
                            <View>
                                <View className="flex-row mb-2">
                                    {DAYS.map((day) => (
                                        <Text
                                            key={day}
                                            className="flex-1 text-center text-xs font-bold text-slate-400"
                                        >
                                            {day}
                                        </Text>
                                    ))}
                                </View>
                                <View className="flex-row flex-wrap">
                                    {blanks.map((i) => (
                                        <View key={`blank-${i}`} className="w-[14.28%] h-12" />
                                    ))}
                                    {days.map((day) => {
                                        const isSelected =
                                            selectedDate?.getDate() === day &&
                                            selectedDate?.getMonth() === viewDate.getMonth() &&
                                            selectedDate?.getFullYear() === viewDate.getFullYear();
                                        return (
                                            <TouchableOpacity
                                                key={day}
                                                onPress={() => handleDayClick(day)}
                                                className={`w-[14.28%] h-12 items-center justify-center rounded-xl ${isSelected ? 'bg-brand-blue' : ''}`}
                                            >
                                                <Text
                                                    className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-slate-700'}`}
                                                >
                                                    {day}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : (
                            <ScrollView className="h-[300px]" showsVerticalScrollIndicator={false}>
                                <View className="flex-row flex-wrap gap-2">
                                    {years.map((year) => (
                                        <TouchableOpacity
                                            key={year}
                                            onPress={() => changeYear(year)}
                                            className={`w-[31%] py-4 rounded-2xl items-center ${viewDate.getFullYear() === year ? 'bg-brand-blue' : 'bg-slate-50'}`}
                                        >
                                            <Text
                                                className={`font-bold text-lg ${viewDate.getFullYear() === year ? 'text-white' : 'text-slate-600'}`}
                                            >
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                    </View>

                    <Button
                        onPress={handleConfirm}
                        disabled={!selectedDate}
                        className="mt-6"
                        title="Confirm Date"
                    />
                </MotiView>
            </View>
        </Modal>
    );
};

export default DatePicker;
