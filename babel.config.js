const config = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: {
          version: '3.17',
          proposals: true
        }
      }
    ]
  ],

  targets: {
    node: 'current'
  }
};

module.exports = config;
