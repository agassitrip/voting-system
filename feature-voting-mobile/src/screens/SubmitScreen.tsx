import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { Feature, FeatureCreate } from '../types/Feature';
import { apiService } from '../services/api';

export default function SubmitScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [anchorTo, setAnchorTo] = useState<string>('');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const fetchedFeatures = await apiService.fetchFeatures();
      setFeatures(fetchedFeatures.filter(f => !f.anchor_to)); // Only show main features for anchoring
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a feature title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a feature description');
      return;
    }

    try {
      setSubmitting(true);
      const featureData: FeatureCreate = {
        title: title.trim(),
        description: description.trim(),
        anchor_to: anchorTo || undefined,
      };

      await apiService.createFeature(featureData);
      
      Alert.alert(
        'Success',
        'Feature submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setDescription('');
              setAnchorTo('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feature');
      console.error('Error submitting feature:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = title.trim() && description.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="add-circle" size={24} color="#3b82f6" />
            <Text style={styles.title}>Submit New Feature</Text>
          </View>
          <Text style={styles.subtitle}>
            Share your ideas to improve the system
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Feature Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a clear, concise title"
              placeholderTextColor="#9ca3af"
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the feature in detail..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Anchor to Existing Feature (Optional)</Text>
            <Text style={styles.helperText}>
              Link this suggestion to an existing feature to group related ideas
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={anchorTo}
                style={styles.picker}
                onValueChange={(itemValue) => setAnchorTo(itemValue)}
              >
                <Picker.Item label="No anchor (standalone feature)" value="" />
                {features.map((feature) => (
                  <Picker.Item
                    key={feature.id}
                    label={feature.title}
                    value={feature.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || submitting}
          >
            <Ionicons
              name={submitting ? "hourglass" : "send"}
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Feature'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
