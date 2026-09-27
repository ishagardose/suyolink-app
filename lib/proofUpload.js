import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function uploadProof(asset, requestId, userId) {
  const mime = asset.mimeType || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  let bytes;
  if (Platform.OS === 'web') bytes = await (await fetch(asset.uri)).arrayBuffer();
  else {
    const { File } = await import('expo-file-system');
    bytes = await new File(asset.uri).arrayBuffer();
  }
  if (!bytes.byteLength || bytes.byteLength > 10485760) throw new Error('Choose an image smaller than 10 MB.');
  const path = `${requestId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${mime.split('/')[1]}`;
  const { error } = await supabase.storage.from('suyo-proofs').upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
