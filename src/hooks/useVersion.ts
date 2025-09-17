import { fetchVersionInfo } from "@/services/versionService";
import { getFromLocalStorage, saveToLocalStorage } from "@/store/storage";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

export const useVersion = () => {
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(true);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true);

  // Get local version from native or web manifest
  const nativeVersion = Application.nativeApplicationVersion;
  const webVersion = (Constants.expoConfig as any)?.version;
  const localVersion = Platform.OS === "web" ? webVersion : nativeVersion;

  const getMajorVersion = (version: string) => version.split(".")[0];

  // Helper function to get cached download URL
  const getCachedDownloadUrl = useCallback(async (): Promise<string | null> => {
    try {
      const { cachedDownloadUrl } = getFromLocalStorage(["cachedDownloadUrl"]);
      return cachedDownloadUrl || null;
    } catch (error) {
      console.error("[DEBUG] Error getting cached download URL:", error);
      return null;
    }
  }, []);

  // Helper function to update download URL only if it changes
  const updateDownloadUrlIfChanged = useCallback(
    async (newUrl: string) => {
      try {
        const currentCachedUrl = await getCachedDownloadUrl();
        if (currentCachedUrl !== newUrl) {
          // console.log("[DEBUG] Download URL changed, updating cache:", newUrl);
          saveToLocalStorage([{ key: "cachedDownloadUrl", value: newUrl }]);
        } else {
          // console.log("[DEBUG] Download URL unchanged, skipping cache update");
        }
      } catch (error) {
        console.error("[DEBUG] Error updating download URL:", error);
      }
    },
    [getCachedDownloadUrl]
  );

  // Fetch backend version with retry
  const fetchBackendVersion = useCallback(
    async (retryCount = 0, major?: string): Promise<string> => {
      try {
        const versionInfo = await fetchVersionInfo(major);

        if (versionInfo?.version) {
          return versionInfo.version;
        }
        throw new Error("No version info received");
      } catch (error) {
        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchBackendVersion(retryCount + 1, major);
        }
        throw error;
      }
    },
    []
  );

  // Load cached version immediately on app start
  useEffect(() => {
    const loadCachedVersion = async () => {
      try {
        const { cachedVersion } = getFromLocalStorage(["cachedVersion"]);
        if (cachedVersion) {
          // console.log("[DEBUG] Loading cached version:", cachedVersion);
          setBackendVersion(cachedVersion);
        } else {
          // console.log("[DEBUG] No cached version found - first time load");
        }
      } catch (error) {
        console.error("[DEBUG] Error loading cached version:", error);
      } finally {
        setIsLoadingFromCache(false);
      }
    };
    loadCachedVersion();
  }, []);

  // Fetch fresh version data from backend after loading cached version
  useEffect(() => {
    let isMounted = true;

    const fetchFreshVersion = async () => {
      // Only start fetching after cache is loaded
      if (isLoadingFromCache) return;

      try {
        // console.log("[DEBUG] Fetching fresh version from backend...");

        // Step 1: Check for OTA updates first (for non-web platforms)
        if (Platform.OS !== "web") {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              // console.log("[DEBUG] OTA update available, downloading...");
              await Updates.fetchUpdateAsync();
              // Clear cache since we're about to reload with new version
              saveToLocalStorage([{ key: "cachedVersion", value: "" }]);
              return await Updates.reloadAsync();
            }
          } catch (error) {
            console.log("[DEBUG] OTA check error:", error);
          }
        }

        // Step 2: Get local version after potential OTA update
        const localMajor = getMajorVersion(localVersion);

        // Step 3: Fetch latest backend version
        const latestVersion = await fetchBackendVersion(0);
        const latestMajor = getMajorVersion(latestVersion);

        if (isMounted) {
          if (localMajor === latestMajor) {
            // Same major version - update with backend version and cache it
            // console.log(
            //   "[DEBUG] Same major version, updating to:",
            //   latestVersion
            // );
            setBackendVersion(latestVersion);
            saveToLocalStorage([
              { key: "cachedVersion", value: latestVersion },
            ]);

            // Fetch version info to get download URL for current major version
            try {
              const versionInfo = await fetchVersionInfo(localMajor);
              if (versionInfo?.downloadUrl) {
                await updateDownloadUrlIfChanged(versionInfo.downloadUrl);
              }
            } catch (error) {
              console.error(
                "[DEBUG] Error fetching version info for download URL:",
                error
              );
            }
          } else if (parseInt(latestMajor) > parseInt(localMajor)) {
            // New major version available
            // console.log("[DEBUG] New major version available:", latestVersion);
            const versionInfo = await fetchVersionInfo();

            if (
              versionInfo?.type === "major" &&
              versionInfo?.downloadUrl &&
              versionInfo.downloadUrl !==
                "https://drive.google.com/placeholder" &&
              versionInfo.downloadUrl.trim() !== ""
            ) {
              Alert.alert(
                "App Update Required",
                `A new version (${latestVersion}) is required. Please download and install the latest version to continue using the app.`,
                [
                  {
                    text: "Download & Install",
                    onPress: () => {
                      if (versionInfo.downloadUrl) {
                        Linking.openURL(versionInfo.downloadUrl);
                      } else {
                        Alert.alert(
                          "Error",
                          "Download URL not available. Please try again later."
                        );
                      }
                    },
                  },
                ],
                { cancelable: true }
              );
            }

            // Fetch compatible version for current major
            try {
              const versionInfo = await fetchVersionInfo(localMajor);

              if (versionInfo?.version) {
                const compatibleVersion = versionInfo.version;
                // console.log(
                //   "[DEBUG] Using compatible version:",
                //   compatibleVersion
                // );
                setBackendVersion(compatibleVersion);
                saveToLocalStorage([
                  { key: "cachedVersion", value: compatibleVersion },
                ]);

                // Cache download URL for the compatible version
                if (versionInfo.downloadUrl) {
                  await updateDownloadUrlIfChanged(versionInfo.downloadUrl);
                }
              }
            } catch (error) {
              console.error(
                "[DEBUG] Error fetching compatible version:",
                error
              );
            }
          }
        }
      } catch (error: any) {
        console.error("[DEBUG] Error fetching fresh version:", error);
        if (isMounted) {
          // If we already have a cached version, keep it; otherwise use local version
          if (!backendVersion) {
            console.log(
              "[DEBUG] No cached version, falling back to local version"
            );
            setBackendVersion(localVersion);
            saveToLocalStorage([{ key: "cachedVersion", value: localVersion }]);
          }
        }
      } finally {
        if (isMounted) {
          setIsCheckingUpdates(false);
        }
      }
    };

    fetchFreshVersion();

    return () => {
      isMounted = false;
    };
  }, [localVersion, fetchBackendVersion, isLoadingFromCache]);

  return {
    backendVersion,
    localVersion,
    isCheckingUpdates,
    isLoadingFromCache,
    currentVersion: backendVersion || localVersion,
    getCachedDownloadUrl,
  };
};
