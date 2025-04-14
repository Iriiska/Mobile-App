import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, Button, Image, FlatList, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter  } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDatabase } from '../../contexts/DatabaseContext';
import { ImageData } from '../../types';

export default function MarkerDetailScreen() {
  const { id, latitude, longitude } = useLocalSearchParams<{ id: string, latitude: string, longitude: string }>();
  const [images, setImages] = useState<ImageData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const router = useRouter();

  const {
    addImage,
    getMarkerImages,
    deleteImage,
    deleteMarker,
    getMarkers,
    setMarkers,
    error
  } = useDatabase();

  useEffect(() => {
    const loadImages = async () => {
      try {
        const markerId = Number(id);
        const savedImages = await getMarkerImages(markerId);
        setImages(savedImages);
      } catch (err) {
        Alert.alert('Ошибка', 'Не удалось загрузить изображения');
      }
    };
    loadImages();
  }, [id]);

  useEffect(() => {
    if (error) {
      Alert.alert('Ошибка базы данных', error.message);
    }
  }, [error]);

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Разрешение на доступ к медиатеке необходимо!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await Promise.all(result.assets.map(asset =>
        addImage(Number(id), asset.uri)
      ));
      const updatedImages = await getMarkerImages(Number(id));
        setImages(updatedImages);
    }
  };

  const handleDeleteImage = (imageId: number) => {
    try {
      deleteImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось удалить изображение');
    }
  };

  const handleDeleteMarker = async () => {
    try {
      await deleteMarker(Number(id));
      const updatedMarkers = await getMarkers();
      setMarkers(updatedMarkers.filter(m => m.id !== Number(id)));
      router.back();
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось удалить маркер');
    }
  };


  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 40) / 2; // 40 - это суммарный отступ слева и справа


  return (
    <View style={styles.container}>
        <Text style={styles.title}>Маркер {id}</Text>
        <Text>Широта: {parseFloat(latitude).toFixed(4)}</Text>
        <Text>Долгота: {parseFloat(longitude).toFixed(4)}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleDeleteMarker}>
              <Text style={styles.addButtonText}>Удалить маркер</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handlePickImages}>
              <Text style={styles.addButtonText}>Добавить изображения</Text>
        </TouchableOpacity>


        <FlatList
          data={images}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.imageGrid}
          renderItem={({ item }) => (
            <View style={[styles.imageContainer, { width: itemWidth }]}>
              <TouchableOpacity onPress={() => setSelectedImage(item)}>
                <Image source={{ uri: item.uri }} style={styles.image} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteImage(item.id)}>
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          )}
        />

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}> 
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  imageGrid: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  imageContainer: {
    padding: 5,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  deleteButton: {
    marginTop: 5,
    backgroundColor: 'orange',
    padding: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
  },
  addButton: {
    marginTop: 5,
    backgroundColor: 'green',
    padding: 7,
    width: 200,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
  },
});
