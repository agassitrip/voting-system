import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Feature } from '../types/Feature';

interface FeatureCardProps {
  feature: Feature;
  onVote: (featureId: string) => void;
  onArchive: (featureId: string) => void;
  onToggleExpanded: (featureId: string) => void;
  isExpanded: boolean;
  anchoredFeatures: Feature[];
}

export default function FeatureCard({
  feature,
  onVote,
  onArchive,
  onToggleExpanded,
  isExpanded,
  anchoredFeatures,
}: FeatureCardProps) {
  const [voteAnimation] = useState(new Animated.Value(1));
  const [archiveAnimation] = useState(new Animated.Value(1));

  const handleVote = () => {
    Animated.sequence([
      Animated.timing(voteAnimation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(voteAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onVote(feature.id);
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Feature',
      'Are you sure you want to archive this feature? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            Animated.timing(archiveAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              onArchive(feature.id);
            });
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasAnchoredFeatures = anchoredFeatures.length > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: archiveAnimation }],
          opacity: archiveAnimation,
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{feature.title}</Text>
            {hasAnchoredFeatures && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => onToggleExpanded(feature.id)}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.date}>{formatDate(feature.created_at)}</Text>
        </View>

        <Text style={styles.description}>{feature.description}</Text>

        <View style={styles.actions}>
          <Animated.View style={{ transform: [{ scale: voteAnimation }] }}>
            <TouchableOpacity style={styles.voteButton} onPress={handleVote}>
              <Ionicons name="thumbs-up" size={18} color="#3b82f6" />
              <Text style={styles.voteText}>{feature.vote_count}</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.archiveButton} onPress={handleArchive}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {feature.anchor_to && (
          <View style={styles.anchorBadge}>
            <Ionicons name="link" size={14} color="#8b5cf6" />
            <Text style={styles.anchorText}>Linked suggestion</Text>
          </View>
        )}
      </View>

      {/* Anchored Features */}
      {hasAnchoredFeatures && isExpanded && (
        <View style={styles.anchoredContainer}>
          <View style={styles.anchoredHeader}>
            <Ionicons name="git-branch" size={16} color="#6b7280" />
            <Text style={styles.anchoredTitle}>Related Suggestions</Text>
          </View>
          {anchoredFeatures.map((anchoredFeature) => (
            <View key={anchoredFeature.id} style={styles.anchoredFeature}>
              <View style={styles.anchoredContent}>
                <Text style={styles.anchoredFeatureTitle}>
                  {anchoredFeature.title}
                </Text>
                <Text style={styles.anchoredFeatureDescription}>
                  {anchoredFeature.description}
                </Text>
                <View style={styles.anchoredMeta}>
                  <View style={styles.anchoredVotes}>
                    <Ionicons name="thumbs-up" size={14} color="#6b7280" />
                    <Text style={styles.anchoredVoteText}>
                      {anchoredFeature.vote_count}
                    </Text>
                  </View>
                  <Text style={styles.anchoredDate}>
                    {formatDate(anchoredFeature.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  expandButton: {
    padding: 4,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  voteText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  archiveButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  anchorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  anchorText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  anchoredContainer: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  anchoredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  anchoredTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  anchoredFeature: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  anchoredContent: {
    flex: 1,
  },
  anchoredFeatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  anchoredFeatureDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  anchoredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anchoredVotes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anchoredVoteText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  anchoredDate: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
