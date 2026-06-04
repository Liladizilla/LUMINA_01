import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTimelineStore } from '../../packages/core/timeline-engine';

export default function MobileApp() {
  const [activeTab, setActiveTab] = React.useState<'projects' | 'media' | 'ai'>('projects');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LUMINA MOBILE</Text>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
          onPress={() => setActiveTab('projects')}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
            Projects
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'media' && styles.activeTab]}
          onPress={() => setActiveTab('media')}
        >
          <Text style={[styles.tabText, activeTab === 'media' && styles.activeTabText]}>
            Media
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>
            AI
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'projects' && <ProjectList />}
        {activeTab === 'media' && <MediaPool />}
        {activeTab === 'ai' && <AICenter />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProjectList() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>My Projects</Text>
      <Text style={styles.placeholder}>No projects yet. Create one in desktop app.</Text>
    </View>
  );
}

function MediaPool() {
  const { mediaPool } = useTimelineStore();
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Media Pool ({mediaPool.length})</Text>
      {mediaPool.map(m => (
        <View key={m.id} style={styles.mediaItem}>
          <Text style={styles.mediaName}>{m.name}</Text>
        </View>
      ))}
    </View>
  );
}

function AICenter() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>AI Features</Text>
      <Text style={styles.placeholder}>AI generation available in desktop app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070608',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2430',
  },
  title: {
    color: '#F5A623',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2430',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F5A623',
  },
  tabText: {
    color: '#7A6E80',
    fontSize: 12,
  },
  activeTabText: {
    color: '#F5A623',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#F5F3E7',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  placeholder: {
    color: '#7A6E80',
    fontSize: 14,
  },
  mediaItem: {
    padding: 12,
    backgroundColor: '#141116',
    borderRadius: 8,
    marginBottom: 8,
  },
  mediaName: {
    color: '#F5F3E7',
  },
});