import { Audio } from "expo-av";

/**
 * Play an alert sound.
 * @returns {Promise<void>}
 * @throws {Error} if there's an error playing the sound
 */
export async function playAlertSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/alert.mp3")
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (error) {
    console.error("Error playing alert sound:", error);
  }
}
