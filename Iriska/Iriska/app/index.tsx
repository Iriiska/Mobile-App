import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, LongPressEvent } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useDatabase } from '../contexts/DatabaseContext';

export default function Index() {

    const router = useRouter();

    const {
        addMarker,
        getMarkers,
        isLoading,
        error,
        markers,
        setMarkers
      } = useDatabase();

    useEffect(() => {
        const loadMarkers = async () => {
          try {
            const savedMarkers = await getMarkers();
            setMarkers(savedMarkers);
          } catch (err) {
            Alert.alert('Ошибка', 'Не удалось загрузить маркеры');
          }
        };
        if (!isLoading) {
            loadMarkers();
          }
    }, [isLoading, getMarkers, setMarkers]);
        
    useEffect(() => {
        if (error) {
          Alert.alert('Ошибка базы данных', error.message);
        }
      }, [error]);
        
    // Обработчик длительного нажатия
    const handleLongPress = async (e: LongPressEvent) => {
        const coordinate = e.nativeEvent.coordinate;
        try {
          const newId = await addMarker(coordinate.latitude, coordinate.longitude);
          setMarkers(prev => [...prev, {
            id: newId,
            latitude: coordinate.latitude,
            longitude: coordinate.longitude
          }]);
        } catch (err) {
          Alert.alert('Ошибка', 'Не удалось добавить маркер');
        }
      };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: 58.0105,
                    longitude: 56.2502,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                onLongPress={handleLongPress}
            >
                {/* Отображаем все маркеры из массива */}
                {markers.map((marker) => (
                    <Marker
                        key={marker.id} // Уникальный ключ для каждого маркера
                        coordinate={{latitude: marker.latitude, longitude: marker.longitude}}
                        onPress={() => router.push({
                            pathname: `/marker/[id]`,
                            params: {
                              id: marker.id,
                              latitude: marker.latitude,
                              longitude: marker.longitude
                            }
                          })}
                    />
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
});