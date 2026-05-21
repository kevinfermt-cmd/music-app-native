import { useState, useEffect, createContext } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { Audio } from 'expo-av';

export const MusicContext = createContext<any>(null);

export default function RootLayout() {
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  useEffect(() => {
    const setupAudio = async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    };
    setupAudio();
  }, []);

  const playSong = async (song: any) => {
    try {
      setIsLoadingAudio(true);
      setCurrentSong(song);
      setIsPlaying(false);

      if (soundObject) {
        await soundObject.unloadAsync();
      }

      // El enlace de audio ya viene limpio desde la busqueda, lo reproducimos directo
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { shouldPlay: true }
      );

      setSoundObject(sound);
      setIsPlaying(true);
      setIsLoadingAudio(false);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

    } catch (error) {
      console.error("Error critico al reproducir:", error);
      setIsLoadingAudio(false);
    }
  };

  const togglePlay = async () => {
    if (!soundObject) return;
    
    if (isPlaying) {
      await soundObject.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundObject.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <MusicContext.Provider value={{ currentSong, isPlaying, playSong, togglePlay }}>
      <View style={styles.container}>
        <View style={styles.screensContainer}>
          <Slot />
        </View>

        {currentSong && (
          <TouchableOpacity style={styles.globalPlayer} activeOpacity={0.9}>
            <Image source={{ uri: currentSong.thumbnail }} style={styles.playerThumbnail} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerTitle} numberOfLines={1}>{currentSong.title}</Text>
              <Text style={styles.playerArtist} numberOfLines={1}>
                {isLoadingAudio ? 'Cargando pista...' : currentSong.artist}
              </Text>
            </View>
            <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
              {isLoadingAudio ? (
                <Text style={styles.playIcon}>...</Text>
              ) : (
                <Text style={styles.playIcon}>{isPlaying ? '||' : '▶'}</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>
    </MusicContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  screensContainer: {
    flex: 1,
  },
  globalPlayer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    elevation: 8,
  },
  playerThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  playerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  playerArtist: {
    color: '#A3A3A3',
    fontSize: 13,
  },
  playButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  }
});
