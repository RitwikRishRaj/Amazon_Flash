module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@screens':    './src/screens',
            '@components': './src/components',
            '@hooks':      './src/hooks',
            '@store':      './src/store',
            '@services':   './src/services',
            '@navigation': './src/navigation',
            '@constants':  './src/constants',
            '@app-types':  './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin', // must be last
    ],
  };
};

