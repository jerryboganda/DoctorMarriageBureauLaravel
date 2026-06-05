import React, { useState, useRef } from 'react';
import { View, TextInput } from 'react-native';
import { MotiView } from 'moti';

interface OtpInputProps {
    length?: number;
    onComplete: (code: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 4, onComplete }) => {
    const [code, setCode] = useState<string[]>(Array(length).fill(''));
    const inputs = useRef<(TextInput | null)[]>([]);

    const processInput = (val: string, idx: number) => {
        // Handle number inputs only
        if (val && isNaN(Number(val))) return;

        const newCode = [...code];
        // Take the last character entered
        newCode[idx] = val.substring(val.length - 1);
        setCode(newCode);

        if (val && idx < length - 1) {
            inputs.current[idx + 1]?.focus();
        }

        if (newCode.every((num) => num !== '')) {
            onComplete(newCode.join(''));
        }
    };

    const handleKeyPress = (e: any, idx: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
            inputs.current[idx - 1]?.focus();
        }
    };

    return (
        <View className={`flex-row justify-center ${length > 4 ? 'gap-2' : 'gap-4'}`}>
            {code.map((num, idx) => (
                <MotiView
                    key={idx}
                    from={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'timing', duration: 200, delay: idx * 50 }}
                >
                    <TextInput
                        ref={(ref: any) => (inputs.current[idx] = ref)}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={num}
                        onChangeText={(text) => processInput(text, idx)}
                        onKeyPress={(e) => handleKeyPress(e, idx)}
                        textAlign="center"
                        className={`${length > 4 ? 'w-11 h-14 text-xl' : 'w-14 h-16 text-2xl'} rounded-2xl border-2 font-bold bg-white ${
                            num
                                ? 'border-brand-blue text-brand-blue'
                                : 'border-slate-200 text-slate-900 shadow-sm'
                        }`}
                    />
                </MotiView>
            ))}
        </View>
    );
};

export default OtpInput;
