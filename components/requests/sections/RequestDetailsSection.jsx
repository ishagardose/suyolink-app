import React from 'react';
import useRequestFormAppearance from '../hooks/useRequestFormAppearance';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RequestDetailsSection({
  attachmentLoading,
  busy,
  draft,
  formatFileSize,
  handleAttachFiles,
  handlePickFromCamera,
  handlePickFromGallery,
  handleRemoveAttachment,
  setPreviewImage,
}) {
  const { styles, colors, resolveColor } = useRequestFormAppearance();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="images-outline"
          size={18}
          color={resolveColor('#1E4D2B')}
        />
        <View style={styles.attachCardHeaderTitleRow}>
          <Text style={styles.cardTitle}>Photos & File Attachments</Text>
          <View style={styles.attachCountBadge}>
            <Text style={styles.attachCountText}>
              {(draft.attachments || []).length}/5 Attached
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.cardSubText}>
        Attach photos from your camera or gallery (e.g. items to buy, receipts,
        parcel, location) or attach files/documents.
      </Text>

      {/* Three Action Pickers: Camera, Gallery, Files */}
      <View style={styles.attachActionRow}>
        {/* 1. Camera */}
        <TouchableOpacity
          style={[
            styles.attachActionBtn,
            styles.attachActionBtnCamera,
            (draft.attachments || []).length >= 5 &&
              styles.attachActionBtnDisabled,
          ]}
          activeOpacity={0.75}
          onPress={handlePickFromCamera}
          disabled={
            busy || attachmentLoading || (draft.attachments || []).length >= 5
          }
        >
          <View
            style={[
              styles.attachActionIconCircle,
              { backgroundColor: resolveColor('#DCFCE7', 'backgroundColor') },
            ]}
          >
            <Ionicons
              name="camera"
              size={19}
              color={resolveColor('#15803D')}
            />
          </View>
          <Text
            style={[
              styles.attachActionBtnText,
              { color: resolveColor('#15803D', 'color') },
            ]}
          >
            Take Photo
          </Text>
          <Text style={styles.attachActionBtnSub}>Camera</Text>
        </TouchableOpacity>

        {/* 2. Gallery */}
        <TouchableOpacity
          style={[
            styles.attachActionBtn,
            styles.attachActionBtnGallery,
            (draft.attachments || []).length >= 5 &&
              styles.attachActionBtnDisabled,
          ]}
          activeOpacity={0.75}
          onPress={handlePickFromGallery}
          disabled={
            busy || attachmentLoading || (draft.attachments || []).length >= 5
          }
        >
          <View
            style={[
              styles.attachActionIconCircle,
              { backgroundColor: resolveColor('#E0F2FE', 'backgroundColor') },
            ]}
          >
            <Ionicons
              name="images"
              size={19}
              color={resolveColor('#0369A1')}
            />
          </View>
          <Text
            style={[
              styles.attachActionBtnText,
              { color: resolveColor('#0369A1', 'color') },
            ]}
          >
            Gallery
          </Text>
          <Text style={styles.attachActionBtnSub}>Photos</Text>
        </TouchableOpacity>

        {/* 3. Files */}
        <TouchableOpacity
          style={[
            styles.attachActionBtn,
            styles.attachActionBtnFiles,
            (draft.attachments || []).length >= 5 &&
              styles.attachActionBtnDisabled,
          ]}
          activeOpacity={0.75}
          onPress={handleAttachFiles}
          disabled={
            busy || attachmentLoading || (draft.attachments || []).length >= 5
          }
        >
          <View
            style={[
              styles.attachActionIconCircle,
              { backgroundColor: resolveColor('#FEF3C7', 'backgroundColor') },
            ]}
          >
            <Ionicons
              name="document-attach"
              size={19}
              color={resolveColor('#B45309')}
            />
          </View>
          <Text
            style={[
              styles.attachActionBtnText,
              { color: resolveColor('#B45309', 'color') },
            ]}
          >
            Attach File
          </Text>
          <Text style={styles.attachActionBtnSub}>PDF/Docs</Text>
        </TouchableOpacity>
      </View>

      {attachmentLoading && (
        <View style={styles.attachmentLoadingRow}>
          <ActivityIndicator
            size="small"
            color={resolveColor('#1E4D2B')}
          />
          <Text style={styles.attachmentLoadingText}>
            Processing attachment...
          </Text>
        </View>
      )}

      {/* List of Attached Items */}
      {draft.attachments && draft.attachments.length > 0 && (
        <View style={styles.attachmentListWrapper}>
          <View style={styles.attachListHeaderRow}>
            <Text style={styles.attachmentListTitle}>
              Attached Items ({draft.attachments.length}):
            </Text>
            <Text style={styles.attachTapHint}>Tap photo to preview</Text>
          </View>

          <View style={styles.attachmentListGrid}>
            {draft.attachments.map((item) => {
              const isImg = item.type === 'image';
              return (
                <View
                  key={item.id}
                  style={
                    isImg
                      ? styles.attachImageItemCard
                      : styles.attachDocItemCard
                  }
                >
                  {isImg ? (
                    <View style={styles.attachImageItemInner}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setPreviewImage(item.uri)}
                        style={styles.attachImageThumbWrapper}
                      >
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.attachImageThumb}
                          resizeMode="cover"
                        />
                        <View style={styles.attachImageBadge}>
                          <Ionicons
                            name="eye"
                            size={10}
                            color={resolveColor('#FFFFFF')}
                          />
                          <Text style={styles.attachImageBadgeText}>View</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.attachRemoveBtn}
                        activeOpacity={0.7}
                        onPress={() => handleRemoveAttachment(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close"
                          size={11}
                          color={resolveColor('#FFFFFF')}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.attachDocCardContent}>
                      <View style={styles.attachDocIconCircle}>
                        <Ionicons
                          name="document-text"
                          size={18}
                          color={resolveColor('#B45309')}
                        />
                      </View>
                      <View style={styles.attachDocMeta}>
                        <Text
                          style={styles.attachDocName}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.attachDocSize}>
                          {formatFileSize(item.size) || 'Attached document'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.attachDocRemoveBtn}
                        activeOpacity={0.7}
                        onPress={() => handleRemoveAttachment(item.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={15}
                          color={resolveColor('#DC2626')}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
