// src/screens/LeaderboardScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../theme/Theme';
import { useProfileStore } from '../store/useProfileStore';
import { fetchGlobalLeaderboard, fetchFriendsLeaderboard } from '../utils/LeaderboardService';

export default function LeaderboardScreen() {
  const [tab, setTab] = useState('global');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useProfileStore();

  const load = useCallback(async () => {
    const fetcher = tab === 'global' ? fetchGlobalLeaderboard : fetchFriendsLeaderboard;
    const data = await fetcher();
    setEntries(data);
  }, [tab]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load().then(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isMe = (item) => (profile.uid && item.id === profile.uid) || item.username === profile.username;

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TabButton label="Global" active={tab === 'global'} onPress={() => setTab('global')} />
        <TabButton label="Friends" active={tab === 'friends'} onPress={() => setTab('friends')} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          renderItem={({ item, index }) => (
            <View style={[styles.row, isMe(item) && styles.rowMine]}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Text style={styles.avatar}>{item.avatar}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.username}
                {isMe(item) ? ' (You)' : ''}
              </Text>
              <Text style={styles.wins}>{item.wins} wins</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {tab === 'friends'
                ? 'No friends added yet. Add friends by username to see them here once that feature is built (see LeaderboardService.addFriendByUid).'
                : 'No leaderboard data yet. Connect Firebase (see .env.example) to populate this with real players.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '700' },
  tabTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  rowMine: { borderWidth: 2, borderColor: Colors.primary },
  rank: { color: Colors.textMuted, width: 24, fontWeight: '700' },
  avatar: { fontSize: 20 },
  name: { flex: 1, color: Colors.textPrimary, fontWeight: '600' },
  wins: { color: Colors.accent, fontWeight: '700' },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
});
