import { useState, useContext } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { MusicContext } from './_layout';

export default function Home() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  
  const { currentSong, isPlaying, playSong } = useContext(MusicContext);

      const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSongs([]);
    
    try {
      // Recuerda poner tu URL de Vercel aquí
      const vercelUrl = 'https://music-pwa-beta.vercel.app'; 
      const res = await fetch(`${vercelUrl}/api/saavn?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      
      // Esto imprimirá en la terminal de Codespaces lo que realmente está llegando
      console.log("Llegó de Vercel:", JSON.stringify(json).substring(0, 300));
      
      // Flexibilidad absoluta para leer los resultados
      const results = json?.data?.results || json?.data || json?.results || [];
      
      if (Array.isArray(results) && results.length > 0) {
        const formattedSongs = results.map((song: any) => {
          
          // Helper para sacar la URL ya sea que venga como arreglo, objeto o texto simple
          const extractBestUrl = (mediaItem: any) => {
            if (Array.isArray(mediaItem) && mediaItem.length > 0) {
              const item = mediaItem[mediaItem.length - 1]; // Suele ser la mejor calidad
              return item?.url || item?.link || (typeof item === 'string' ? item : null);
            }
            return typeof mediaItem === 'string' ? mediaItem : null;
          };

          const highResImage = extractBestUrl(song.image);
          const bestAudio = extractBestUrl(song.downloadUrl) || extractBestUrl(song.media_url);

          return {
            id: song.id,
            title: song.name || song.title || "Desconocido",
            artist: song.primaryArtists || song.singers || "Artista",
            thumbnail: highResImage || 'https://via.placeholder.com/150',
            audioUrl: bestAudio
          };
        });
        
        // Solo guardamos en la lista las canciones que de verdad tengan un enlace de audio extraído
        const validSongs = formattedSongs.filter(s => s.audioUrl);
        setSongs(validSongs);
        
        if (validSongs.length === 0) {
          console.log("Se encontraron resultados, pero ninguno tenía un link de audio funcional.");
        }
      } else {
        console.log("La búsqueda no trajo resultados o la estructura es irreconocible.");
      }
    } catch (err) {
      console.error("Error buscando:", err);
    } finally {
      setLoading(false);
    }
  };
  
  

  const renderSong = ({ item }: { item: any }) => {
    const isThisSongPlaying = currentSong?.id === item.id;

    return (
      <TouchableOpacity 
        style={styles.songCard} 
        activeOpacity={0.7}
        onPress={() => playSong(item)}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, isThisSongPlaying && { color: '#3B82F6' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <View style={styles.playIconContainer}>
          <Text style={styles.playIcon}>
            {isThisSongPlaying && isPlaying ? '||' : '▶'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Busca artistas o canciones..."
          placeholderTextColor="#666666"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Buscando música...</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderSong}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#141414',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120, 
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#262626',
  },
  songInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#A3A3A3',
  },
  playIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A3A3A3',
    marginTop: 12,
    fontSize: 14,
  }
});
