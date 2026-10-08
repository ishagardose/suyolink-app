import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function useRequestAttachments({ draft, setDraft }) {
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePickFromCamera = async () => {
    try {
      if ((draft.attachments || []).length >= 5) {
        Alert.alert('Limit Reached', 'You can attach up to 5 photos or files.');
        return;
      }
      setAttachmentLoading(true);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in your device settings to take photos for your suyo request.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAttachment = {
          id:
            'cam-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          uri: asset.uri,
          name: asset.fileName || `camera_photo_${Date.now()}.jpg`,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        };
        setDraft((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment].slice(0, 5),
        }));
      }
    } catch (err) {
      console.warn('Camera pick error:', err);
      Alert.alert(
        'Camera Error',
        'Could not open camera. Please try selecting from the photo gallery.',
      );
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      if ((draft.attachments || []).length >= 5) {
        Alert.alert('Limit Reached', 'You can attach up to 5 photos or files.');
        return;
      }
      setAttachmentLoading(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Gallery Permission Required',
          'Please allow photo library access to choose photos for your suyo request.',
        );
        return;
      }

      const maxAllowed = 5 - (draft.attachments?.length || 0);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: maxAllowed,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems = result.assets.map((asset, index) => ({
          id:
            'gal-' +
            Date.now() +
            '-' +
            index +
            '-' +
            Math.random().toString(36).slice(2, 6),
          uri: asset.uri,
          name:
            asset.fileName || `gallery_image_${Date.now()}_${index + 1}.jpg`,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        }));

        setDraft((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...newItems].slice(0, 5),
        }));
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      Alert.alert(
        'Gallery Error',
        'Could not open photo gallery. Please try again.',
      );
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleAttachFiles = async () => {
    try {
      if ((draft.attachments || []).length >= 5) {
        Alert.alert('Limit Reached', 'You can attach up to 5 photos or files.');
        return;
      }
      setAttachmentLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map((asset, index) => {
          const isImg =
            asset.mimeType?.startsWith('image/') ||
            /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(asset.name || '');
          return {
            id:
              'doc-' +
              Date.now() +
              '-' +
              index +
              '-' +
              Math.random().toString(36).slice(2, 6),
            uri: asset.uri,
            name: asset.name || `attached_file_${Date.now()}_${index + 1}`,
            type: isImg ? 'image' : 'file',
            mimeType: asset.mimeType || 'application/octet-stream',
            size: asset.size,
          };
        });

        setDraft((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...newFiles].slice(0, 5),
        }));
      }
    } catch (err) {
      console.warn('Document picker error:', err);
      Alert.alert(
        'File Picker Error',
        'Could not attach selected file. Please try again.',
      );
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleRemoveAttachment = (idToRemove) => {
    setDraft((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter(
        (item) => item.id !== idToRemove,
      ),
    }));
  };
  return {
    attachmentLoading,
    formatFileSize,
    handleAttachFiles,
    handlePickFromCamera,
    handlePickFromGallery,
    handleRemoveAttachment,
  };
}
