import { api } from "@/convex/_generated/api";
import { getFromLocalStorage, saveToLocalStorage } from "@/store/storage";
import { useQuery } from "convex/react";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

export const useVersion = () => {
  const [cachedVersion, setCachedVersion] = useState<string | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(true);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  /** Convex reactive query for latest version */
  const latest = useQuery(api.versioning.getLatestVersionFrontend);

  /** Local app version */
  const nativeVersion = Application.nativeApplicationVersion;
  const webVersion = (Constants.expoConfig as any)?.version;
  const localVersion = Platform.OS === "web" ? webVersion : nativeVersion;

  /** Helper: get major version number */
  const getMajorVersion = (v: string) => v?.split(".")[0] || "0";

  /** Cache helpers */
  const getCached = useCallback(async (key: string) => {
    try {
      const res = await getFromLocalStorage([key]);
      return res[key] || null;
    } catch {
      return null;
    }
  }, []);

  const cacheIfChanged = useCallback(
    async (key: string, value: string) => {
      const current = await getCached(key);
      if (current !== value) saveToLocalStorage([{ key, value }]);
    },
    [getCached]
  );

  /** Load cached version on mount */
  useEffect(() => {
    (async () => {
      const v = await getCached("cachedVersion");
      if (v) setCachedVersion(v);
      setIsLoadingCache(false);
    })();
  }, [getCached]);

  /** Core update logic */
  useEffect(() => {
    if (!latest || isLoadingCache) return;

    let active = true;
    (async () => {
      try {
        /** Step 1: Check for OTA updates first */
        if (Platform.OS !== "web") {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              saveToLocalStorage([{ key: "cachedVersion", value: "" }]);
              await Updates.reloadAsync();
              return;
            }
          } catch (err) {
            console.log("[DEBUG] OTA check failed:", err);
          }
        }

        const latestVersion = latest.version;
        const latestMajor = getMajorVersion(latestVersion);
        const localMajor = getMajorVersion(localVersion || "0.0.0");

        /** Same major version → update quietly */
        if (localMajor === latestMajor) {
          if (!active) return;
          setCachedVersion(latestVersion);
          await cacheIfChanged("cachedVersion", latestVersion);
          if (latest.downloadUrl) {
            await cacheIfChanged("cachedDownloadUrl", latest.downloadUrl);
          }
          return;
        }

        /** Major version bump → require full reinstall */
        if (parseInt(latestMajor) > parseInt(localMajor)) {
          if (latest.downloadUrl) {
            Alert.alert(
              "App Update Required",
              `A new version (${latestVersion}) is available. Please update to continue.`,
              [
                {
                  text: "Download & Install",
                  onPress: () =>
                    Linking.openURL(
                      "https://mohamedo-desu.github.io/himisiri_web_versions_handler/"
                    ),
                },
              ],
              { cancelable: false }
            );
          }
        }
      } catch (err) {
        console.error("[DEBUG] Error checking version:", err);
        if (!cachedVersion) {
          setCachedVersion(localVersion);
          await cacheIfChanged("cachedVersion", localVersion || "");
        }
      } finally {
        if (active) setIsCheckingUpdates(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [latest, localVersion, isLoadingCache, cacheIfChanged, cachedVersion]);

  /** Get cached download URL */
  const getCachedDownloadUrl = useCallback(async (): Promise<string | null> => {
    return await getCached("cachedDownloadUrl");
  }, [getCached]);

  return {
    backendVersion: latest?.version || cachedVersion,
    localVersion,
    currentVersion: latest?.version || cachedVersion || localVersion,
    isCheckingUpdates,
    isLoadingFromCache: isLoadingCache,
    getCachedDownloadUrl,
  };
};
