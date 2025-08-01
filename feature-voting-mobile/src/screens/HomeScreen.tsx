import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { Feature } from '../types/Feature';
import { apiService } from '../services/api';
import FeatureCard from '../components/FeatureCard';

export default function HomeScreen() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('votes');
  const [order, setOrder] = useState('desc');
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  const fetchFeatures = useCallback(async () => {
    try {
      const fetchedFeatures = await apiService.fetchFeatures(sortBy, order);
      setFeatures(fetchedFeatures);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch features');
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy, order]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeatures();
  }, [fetchFeatures]);

  const handleVote = async (featureId: string) => {
    try {
      const updatedFeature = await apiService.voteForFeature(featureId);
      setFeatures(prev => 
        prev.map(f => f.id === featureId ? updatedFeature : f)
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to vote for feature');
      console.error('Error voting:', error);
    }
  };

  const handleArchive = async (featureId: string) => {
    Alert.alert(
      'Archive Feature',
      'Are you sure you want to archive this feature?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.archiveFeature(featureId);
              setFeatures(prev => prev.filter(f => f.id !== featureId));
            } catch (error) {
              Alert.alert('Error', 'Failed to archive feature');
              console.error('Error archiving:', error);
            }
          },
        },
      ]
    );
  };

  const toggleExpanded = (featureId: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      return newSet;
    });
  };

  const getSortLabel = () => {
    if (sortBy === 'votes') {
      return order === 'desc' ? 'Most Votes' : 'Least Votes';
    } else {
      return order === 'desc' ? 'Newest First' : 'Oldest First';
    }
  };

  const renderFeature = ({ item }: { item: Feature }) => (
    <FeatureCard
      feature={item}
      onVote={handleVote}
      onArchive={handleArchive}
      onToggleExpanded={toggleExpanded}
      isExpanded={expandedFeatures.has(item.id)}
      anchoredFeatures={features.filter(f => f.anchor_to === item.id)}
    />
  );

  const mainFeatures = features.filter(f => !f.anchor_to);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="bulb" size={24} color="#3b82f6" />
          <Text style={styles.title}>Feature Voting System</Text>
        </View>
        <Text style={styles.subtitle}>
          Vote for features you'd like to see implemented
        </Text>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={`${sortBy}-${order}`}
            style={styles.picker}
            onValueChange={(itemValue) => {
              const [newSortBy, newOrder] = itemValue.split('-');
              setSortBy(newSortBy);
              setOrder(newOrder);
            }}
          >
            <Picker.Item label="Most Votes" value="votes-desc" />
            <Picker.Item label="Least Votes" value="votes-asc" />
            <Picker.Item label="Newest First" value="date-desc" />
            <Picker.Item label="Oldest First" value="date-asc" />
          </Picker>
        </View>
      </View>

      <FlatList
        data={mainFeatures}
        renderItem={renderFeature}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 12,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  picker: {
    height: 40,
  },
  listContainer: {
    padding: 16,
  },
});
