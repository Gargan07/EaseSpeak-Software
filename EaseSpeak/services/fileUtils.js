import * as FileSystem from "expo-file-system";

/**
 * Clears the cache directory of all audio files.
 * This function is used to periodically clear up space taken by recorded audio files.
 * @returns {Promise<void>} A promise that resolves when the cache has been cleared.
 */
export const clearCache = async () => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    for (const file of files) {
      if (file.endsWith(".wav")) {
        await FileSystem.deleteAsync(`${cacheDir}${file}`, {
          idempotent: true,
        });
      }
    }
    console.log("Audio cache cleared!");
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};
