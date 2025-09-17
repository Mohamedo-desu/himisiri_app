import { ConfigContext, ExpoConfig } from "expo/config";

const EAS_PROJECT_ID = "a111f31d-26cc-4966-88da-77e36c8b6764";
const PROJECT_SLUG = "himisiri";
const OWNER = "mohamedo-desu";

// App production config
const APP_NAME = "Himisiri";
const BUNDLE_IDENTIFIER = `com.mohamedodesu.${PROJECT_SLUG}`;
const PACKAGE_NAME = `com.mohamedodesu.${PROJECT_SLUG}`;
const ICON = "./assets/images/icon.png";
const ADAPTIVE_ICON = "./assets/images/android-prod.png";
const SCHEME = PROJECT_SLUG;

export default ({ config }: ConfigContext): ExpoConfig => {
  console.log("⚙️ Building app for environment:", process.env.APP_ENV);
  const { name, bundleIdentifier, icon, adaptiveIcon, packageName, scheme } =
    getDynamicAppConfig(
      (process.env.APP_ENV as "development" | "preview" | "production") ||
        "preview"
    );

  return {
    ...config,
    name: name,
    version: "1.0.0",
    slug: PROJECT_SLUG,
    orientation: "portrait",
    newArchEnabled: true,
    icon: icon,
    scheme: scheme,
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: bundleIdentifier,
      icon: {
        dark: "./assets/images/ios-dark.png",
        light: "./assets/images/ios-prod.png",
        tinted: "./assets/images/ios-tinted.png",
      },
      associatedDomains: [`applinks:${PROJECT_SLUG}.expo.app`],
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      package: packageName,
      softwareKeyboardLayoutMode: "pan",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: true,
      googleServicesFile: "./google-services.json",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: `${PROJECT_SLUG}.expo.app`,
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
        {
          action: "VIEW",
          data: [
            {
              scheme: scheme,
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID,
      },
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true,
          },
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: "mohamedo-apps-desu",
          project: PROJECT_SLUG,
          url: "https://sentry.io",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/splash-icon.png",
          color: "#4B50B2",
          defaultChannel: "default",
          sounds: ["./assets/sounds/update.wav"],
          enableBackgroundRemoteNotifications: true,
        },
      ],
      [
        "expo-font",
        {
          fonts: [
            "./assets/fonts/Poppins-Black.ttf",
            "./assets/fonts/Poppins-Bold.ttf",
            "./assets/fonts/Poppins-SemiBold.ttf",
            "./assets/fonts/Poppins-Medium.ttf",
            "./assets/fonts/Poppins-Regular.ttf",
            "./assets/fonts/Poppins-Italic.ttf",
          ],
        },
      ],

      "expo-router",
      "expo-background-task",
      "expo-font",
      "./plugins/scrollbar-color.js",
      "./plugins/customize.js",
    ],
    experiments: {
      reactCanary: true,
      typedRoutes: true,
      reactCompiler: true,
    },
    owner: OWNER,
  };
};

export const getDynamicAppConfig = (
  environment: "development" | "preview" | "production"
) => {
  if (environment === "production") {
    return {
      name: APP_NAME,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      packageName: PACKAGE_NAME,
      icon: ICON,
      adaptiveIcon: ADAPTIVE_ICON,
      scheme: SCHEME,
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME}`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}`,
      packageName: `${PACKAGE_NAME}`,
      icon: ICON,
      adaptiveIcon: ADAPTIVE_ICON,
      scheme: `${SCHEME}`,
    };
  }

  return {
    name: `${APP_NAME} Development`,
    bundleIdentifier: `${BUNDLE_IDENTIFIER}.dev`,
    packageName: `${PACKAGE_NAME}.dev`,
    icon: "./assets/images/ios-dev.png",
    adaptiveIcon: "./assets/images/android-dev.png",
    scheme: `${SCHEME}-dev`,
  };
};
