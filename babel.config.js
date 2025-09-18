module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          "react-compiler": {
            sources: (filename) => {
              // Include all files and folders under src/
              return filename.includes("src/");
            },
          },
        },
      ],
    ],
    plugins: [
      // other plugins
      [
        "react-native-unistyles/plugin",
        {
          root: "src",
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
