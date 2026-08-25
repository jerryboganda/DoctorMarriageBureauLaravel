import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    MicIcon,
    MicOffIcon,
    VideoIcon,
    VideoOffIcon,
    PhoneOffIcon,
    MessageIcon,
    MoreVerticalIcon,
    UsersIcon,
} from './Icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface CallModalProps {
    visible: boolean;
    participantName: string;
    participantImage: string;
    type: 'video' | 'audio';
    onEndCall: () => void;
}

const CallModal: React.FC<CallModalProps> = ({
    visible,
    participantName,
    participantImage,
    type,
    onEndCall,
}) => {
    const { t } = useTranslation();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(type === 'audio');
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!visible) {
            setDuration(0);
            return;
        }
        const timer = setInterval(() => setDuration((d) => d + 1), 1000);
        return () => clearInterval(timer);
    }, [visible]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onEndCall}
        >
            <View className="flex-1 bg-slate-900">
                {/* Main Video Area */}
                <View className="flex-1 relative">
                    {/* Header Overlay */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent']}
                        className="absolute top-0 left-0 right-0 p-6 pt-12 z-10 flex-row justify-between items-start"
                    >
                        <View>
                            <View className="flex-row items-center gap-2 mb-1">
                                {type === 'video' ? (
                                    <VideoIcon size={20} color="white" />
                                ) : (
                                    <UsersIcon size={20} color="white" />
                                )}
                                <Text className="text-white text-lg font-bold">
                                    {t('call.secureCall')}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <View className="w-2 h-2 bg-red-500 rounded-full" />
                                <Text className="text-white/80 text-sm">
                                    {formatTime(duration)} • {participantName}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity className="p-2 bg-white/10 rounded-full">
                            <MoreVerticalIcon size={20} color="white" />
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Participant Video/Image */}
                    <View className="flex-1 bg-slate-800 items-center justify-center relative">
                        {!isVideoOff ? (
                            <>
                                <Image
                                    source={{ uri: participantImage }}
                                    className="absolute w-full h-full opacity-90"
                                    resizeMode="cover"
                                    blurRadius={10}
                                />
                                <Image
                                    source={{ uri: participantImage }}
                                    className="w-full h-full"
                                    resizeMode="contain"
                                />
                            </>
                        ) : (
                            <View className="items-center gap-4">
                                <View className="w-32 h-32 rounded-full border-4 border-slate-700 p-1 overflow-hidden">
                                    <Image
                                        source={{ uri: participantImage }}
                                        className="w-full h-full rounded-full"
                                    />
                                </View>
                                <Text className="text-2xl font-bold text-white">
                                    {participantName}
                                </Text>
                                <Text className="text-slate-400">{t('call.audioCall')}</Text>
                            </View>
                        )}

                        {/* Self View (Picture-in-Picture) */}
                        {!isVideoOff && (
                            <View className="absolute bottom-24 right-5 w-28 h-40 bg-black rounded-xl border border-white/20 shadow-lg overflow-hidden justify-center items-center">
                                <View className="w-full h-full bg-slate-700 items-center justify-center">
                                    <Text className="text-white/50 text-xs">{t('call.you')}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Controls Bar */}
                    <View className="h-32 bg-slate-900 flex-row items-center justify-center gap-6 pb-6">
                        <TouchableOpacity
                            onPress={() => setIsMuted(!isMuted)}
                            className={`p-4 rounded-full ${isMuted ? 'bg-white' : 'bg-slate-700'}`}
                        >
                            {isMuted ? (
                                <MicOffIcon size={28} color="#0f172a" />
                            ) : (
                                <MicIcon size={28} color="white" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsVideoOff(!isVideoOff)}
                            className={`p-4 rounded-full ${isVideoOff ? 'bg-white' : 'bg-slate-700'}`}
                        >
                            {isVideoOff ? (
                                <VideoOffIcon size={28} color="#0f172a" />
                            ) : (
                                <VideoIcon size={28} color="white" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onEndCall}
                            className="p-5 rounded-full bg-red-500 shadow-lg shadow-red-500/30 transform scale-110"
                        >
                            <PhoneOffIcon size={32} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity className="p-4 rounded-full bg-slate-700">
                            <MessageIcon size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CallModal;
