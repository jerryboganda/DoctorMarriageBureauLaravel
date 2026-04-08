import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api, getProfileImageUrl } from '../utils/api';
import { 
  ChevronLeftIcon, ImageIcon, PlusIcon, TrashIcon, 
  StarIcon, CheckCircleIcon, XIcon, CameraIcon, UploadIcon,
  EyeIcon, LockIcon, AlertCircleIcon
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

interface GalleryPhoto {
  id: number;
  url: string;
  thumbnail: string;
  is_primary: boolean;
  is_approved: boolean;
  is_private: boolean;
  order: number;
  created_at: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - 48) / 3;

const PhotoGalleryScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [maxPhotos, setMaxPhotos] = useState(10);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await api.get('/member/gallery-image');
      if (response.data.result) {
        setPhotos(response.data.data.photos || response.data.data || []);
        setMaxPhotos(response.data.data.max_photos || 10);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPhotos();
  }, []);

  const pickImage = async (useCamera: boolean = false) => {
    if (photos.length >= maxPhotos) {
      Alert.alert(t('photoGallery.limitReached'), t('photoGallery.limitReachedDesc', { max: maxPhotos }));
      return;
    }

    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(t('common.permissionRequired'), t('photoGallery.grantAccess', { type: useCamera ? t('common.camera') : t('common.gallery') }));
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async (image: any) => {
    setUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await api.post('/member/gallery-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchPhotos();
        Alert.alert(t('common.success'), t('photoGallery.uploadSuccess'));
      } else {
        Alert.alert(t('common.error'), response.data.message || t('photoGallery.uploadFailed'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('photoGallery.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (photo: GalleryPhoto) => {
    if (photo.is_primary) return;
    if (!photo.is_approved) {
      Alert.alert(t('photoGallery.notAvailable'), t('photoGallery.approvedOnly'));
      return;
    }

    try {
      const response = await api.post(`/member/gallery-image/${photo.id}/set-primary`);
      if (response.data.result) {
        setPhotos(prev => prev.map(p => ({
          ...p,
          is_primary: p.id === photo.id,
        })));
        setShowPhotoModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('photoGallery.setPrimaryFailed'));
    }
  };

  const handleTogglePrivate = async (photo: GalleryPhoto) => {
    try {
      const response = await api.post(`/member/gallery-image/${photo.id}/toggle-private`);
      if (response.data.result) {
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, is_private: !p.is_private } : p
        ));
        setSelectedPhoto(prev => prev ? { ...prev, is_private: !prev.is_private } : null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('photoGallery.privacyFailed'));
    }
  };

  const handleDeletePhoto = (photo: GalleryPhoto) => {
    if (photo.is_primary) {
      Alert.alert(t('photoGallery.cannotDelete'), t('photoGallery.cannotDeleteDesc'));
      return;
    }

    Alert.alert(
      'Delete Photo',
      t('photoGallery.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/member/gallery-image/${photo.id}`);
              if (response.data.result) {
                setPhotos(prev => prev.filter(p => p.id !== photo.id));
                setShowPhotoModal(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.response?.data?.message || t('photoGallery.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const openPhotoModal = (photo: GalleryPhoto) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Background />

      {/* Header */}
      <LinearGradient
        colors={['#7c3aed', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <ChevronLeftIcon size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">{t('photoGallery.title')}</Text>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <ImageIcon size={20} color="white" />
          </View>
        </View>

        <View className="items-center pb-6">
          <Text className="text-white/80 text-sm">
            {photos.length} of {maxPhotos} photos
          </Text>
          <View className="flex-row mt-2">
            <View className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
              <View 
                className="h-full bg-white rounded-full"
                style={{ width: `${(photos.length / maxPhotos) * 100}%` }}
              />
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-4 -mt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
        }
      >
        {/* Upload Buttons */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm mb-4"
        >
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => pickImage(false)}
              disabled={uploading}
              className="flex-1 flex-row items-center justify-center bg-violet-100 rounded-xl py-4 mr-2"
            >
              {uploading ? (
                <ActivityIndicator color="#7c3aed" />
              ) : (
                <>
                  <UploadIcon size={20} color="#7c3aed" />
                  <Text className="text-violet-600 font-semibold ml-2">{t('common.gallery')}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickImage(true)}
              disabled={uploading}
              className="flex-1 flex-row items-center justify-center bg-violet-100 rounded-xl py-4"
            >
              <CameraIcon size={20} color="#7c3aed" />
              <Text className="text-violet-600 font-semibold ml-2">{t('common.camera')}</Text>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 50 }}
          className="bg-amber-50 rounded-2xl p-4 mb-4 flex-row items-start"
        >
          <AlertCircleIcon size={20} color="#f59e0b" />
          <Text className="flex-1 text-amber-700 text-sm ml-3">
            {t('photoGallery.reviewInfo')}
          </Text>
        </MotiView>

        {/* Photo Grid */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          className="bg-white rounded-2xl p-4 shadow-sm mb-4"
        >
          <View className="flex-row flex-wrap justify-start" style={{ marginHorizontal: -4 }}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                onPress={() => openPhotoModal(photo)}
                style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, margin: 4 }}
              >
                <Image
                  source={{ uri: getProfileImageUrl(photo.thumbnail || photo.url) }}
                  className="w-full h-full rounded-xl"
                />
                
                {/* Badges */}
                <View className="absolute top-1 left-1 flex-row">
                  {photo.is_primary && (
                    <View className="bg-amber-500 rounded-full p-1 mr-1">
                      <StarIcon size={10} color="white" />
                    </View>
                  )}
                  {photo.is_private && (
                    <View className="bg-slate-700 rounded-full p-1">
                      <LockIcon size={10} color="white" />
                    </View>
                  )}
                </View>

                {!photo.is_approved && (
                  <View className="absolute bottom-0 left-0 right-0 bg-amber-500/90 rounded-b-xl py-1">
                    <Text className="text-white text-xs text-center font-medium">Pending</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Add Photo Button */}
            {photos.length < maxPhotos && (
              <TouchableOpacity
                onPress={() => pickImage(false)}
                style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, margin: 4 }}
                className="bg-slate-100 rounded-xl items-center justify-center border-2 border-dashed border-slate-300"
              >
                <PlusIcon size={32} color="#94a3b8" />
                <Text className="text-slate-400 text-xs mt-1">{t('photoGallery.addPhotos')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {photos.length === 0 && (
            <View className="items-center py-8">
              <ImageIcon size={48} color="#cbd5e1" />
              <Text className="text-slate-500 mt-2">{t('photoGallery.noPhotos')}</Text>
            </View>
          )}
        </MotiView>

        <View className="h-28" />
      </ScrollView>

      {/* Photo Detail Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <TouchableOpacity
            onPress={() => setShowPhotoModal(false)}
            className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            style={{ marginTop: insets.top }}
          >
            <XIcon size={24} color="white" />
          </TouchableOpacity>

          {selectedPhoto && (
            <>
              <Image
                source={{ uri: getProfileImageUrl(selectedPhoto.url) }}
                className="w-full aspect-square"
                resizeMode="contain"
              />

              {/* Status Badges */}
              <View className="flex-row mt-4">
                {selectedPhoto.is_primary && (
                  <View className="bg-amber-500 px-3 py-1.5 rounded-full flex-row items-center mr-2">
                    <StarIcon size={14} color="white" />
                    <Text className="text-white text-sm font-semibold ml-1">Primary</Text>
                  </View>
                )}
                {selectedPhoto.is_private && (
                  <View className="bg-slate-700 px-3 py-1.5 rounded-full flex-row items-center mr-2">
                    <LockIcon size={14} color="white" />
                    <Text className="text-white text-sm font-semibold ml-1">Private</Text>
                  </View>
                )}
                {!selectedPhoto.is_approved && (
                  <View className="bg-amber-600 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-sm font-semibold">Pending Approval</Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View className="flex-row mt-6 px-4">
                {!selectedPhoto.is_primary && selectedPhoto.is_approved && (
                  <TouchableOpacity
                    onPress={() => handleSetPrimary(selectedPhoto)}
                    className="flex-1 bg-amber-500 rounded-xl py-3 mr-2 flex-row items-center justify-center"
                  >
                    <StarIcon size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">{t('photoGallery.setPrimary')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleTogglePrivate(selectedPhoto)}
                  className="flex-1 bg-slate-700 rounded-xl py-3 mr-2 flex-row items-center justify-center"
                >
                  {selectedPhoto.is_private ? (
                    <>
                      <EyeIcon size={18} color="white" />
                      <Text className="text-white font-semibold ml-2">{t('photoGallery.makePublic')}</Text>
                    </>
                  ) : (
                    <>
                      <LockIcon size={18} color="white" />
                      <Text className="text-white font-semibold ml-2">{t('photoGallery.makePrivate')}</Text>
                    </>
                  )}
                </TouchableOpacity>
                {!selectedPhoto.is_primary && (
                  <TouchableOpacity
                    onPress={() => handleDeletePhoto(selectedPhoto)}
                    className="bg-red-500 rounded-xl py-3 px-4 flex-row items-center justify-center"
                  >
                    <TrashIcon size={18} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default PhotoGalleryScreen;
