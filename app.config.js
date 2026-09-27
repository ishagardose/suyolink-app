// Keep the Android Maps SDK key out of tracked configuration.
module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins || []), '@react-native-community/datetimepicker',
    ['expo-image-picker', { photosPermission: 'Choose a photo as proof that your Suyo task is complete.', cameraPermission: false, microphonePermission: false }]],
  android: {
    ...config.android,
    ...(process.env.GOOGLE_MAPS_API_KEY ? {
      config: { ...config.android?.config, googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } },
    } : {}),
  },
});
