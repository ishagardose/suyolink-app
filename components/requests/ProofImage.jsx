import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
export default function ProofImage({ path }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setUrl('');
    setError('');
    supabase.storage
      .from('suyo-proofs')
      .createSignedUrl(path, 600)
      .then(({ data, error }) => {
        if (active) {
          if (error) setError('Could not load proof image.');
          else setUrl(data.signedUrl);
        }
      })
      .catch(() => {
        if (active) setError('Could not load proof image.');
      });
    return () => {
      active = false;
    };
  }, [path, retry]);
  return (
    <View>
      {url ? (
        <Image
          source={{ uri: url }}
          accessibilityLabel="Completion proof"
          style={{ width: '100%', height: 220 }}
          resizeMode="contain"
          onError={() => setError('Could not load proof image.')}
        />
      ) : null}
      {error ? (
        <>
          <ThemedText tone="danger">{error}</ThemedText>
          <ThemedButton
            title="Reload image"
            onPress={() => setRetry((value) => value + 1)}
          />
        </>
      ) : null}
    </View>
  );
}
