// src/screens/OnlineLobbyScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../theme/Theme';
import { PLAYER_THEME } from '../utils/BoardConfig';
import { SocketClient, SERVER_URL } from '../utils/SocketClient';
import { useProfileStore } from '../store/useProfileStore';
import { useGameStore } from '../store/useGameStore';

export default function OnlineLobbyScreen({ navigation }) {
  const { profile } = useProfileStore();
  const startGame = useGameStore((s) => s.startGame);

  const [connStatus, setConnStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [inRoom, setInRoom] = useState(false);

  useEffect(() => {
    return () => {
      SocketClient.disconnect();
    };
  }, []);

  const connect = useCallback(() => {
    setConnStatus('connecting');
    const socket = SocketClient.connect(SERVER_URL);

    socket.on('connect', () => setConnStatus('connected'));
    socket.on('connect_error', () => setConnStatus('error'));

    socket.on('room:created', ({ roomCode }) => {
      setRoomCode(roomCode);
      setInRoom(true);
    });

    socket.on('room:update', ({ players: roomPlayers }) => {
      setPlayers(roomPlayers);
    });

    socket.on('room:error', ({ message }) => {
      alert(message);
    });

    socket.on('game:start', ({ activeColors }) => {
      startGame(activeColors, 'online', []);
      navigation.replace('Game');
    });
  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  const handleCreateRoom = () => {
    SocketClient.createRoom({ username: profile.username, avatarId: profile.avatarId });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    SocketClient.joinRoom({
      roomCode: joinCode.trim().toUpperCase(),
      username: profile.username,
      avatarId: profile.avatarId,
    });
    setRoomCode(joinCode.trim().toUpperCase());
    setInRoom(true);
  };

  const handleReady = () => {
    SocketClient.setReady(roomCode);
  };

  if (connStatus !== 'connected' && !inRoom) {
    return (
      <SafeAreaView style={styles.center}>
        {connStatus === 'error' ? (
          <>
            <Text style={styles.errorText}>
              Couldn't reach the game server at {SERVER_URL}.
            </Text>
            <Text style={styles.errorSub}>
              Run `node server.js` inside /server, and make sure
              EXPO_PUBLIC_SERVER_URL (or EXPO_PUBLIC_SERVER_URL_PROD) in
              your .env file points at the right address. See README.md
              "Server URLs" for dev vs. production setup.
            </Text>
            <Pressable style={styles.retryBtn} onPress={connect}>
              <Text style={Typography.button}>Retry</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.connectingText}>Connecting to server…</Text>
          </>
        )}
      </SafeAreaView>
    );
  }

  if (!inRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.createBtn} onPress={handleCreateRoom}>
          <Text style={Typography.button}>Create Room</Text>
        </Pressable>

        <Text style={styles.orText}>— or —</Text>

        <View style={styles.joinRow}>
          <TextInput
            style={styles.codeInput}
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="ROOM CODE"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Pressable style={styles.joinBtn} onPress={handleJoinRoom}>
            <Text style={Typography.button}>Join</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.roomCodeLabel}>Room Code</Text>
      <Text style={styles.roomCode}>{roomCode}</Text>
      <Text style={styles.shareHint}>Share this code with friends to join</Text>

      <View style={styles.playerList}>
        {players.map((p) => (
          <View key={p.id} style={styles.playerRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: p.color ? PLAYER_THEME[p.color].primary : Colors.textMuted },
              ]}
            />
            <Text style={styles.playerName}>{p.username}</Text>
            <Text style={styles.readyTag}>{p.ready ? '✅ Ready' : '⏳ Waiting'}</Text>
          </View>
        ))}
        {players.length === 0 && (
          <Text style={styles.waitingText}>Waiting for players to join…</Text>
        )}
      </View>

      <Pressable style={styles.readyBtn} onPress={handleReady}>
        <Text style={Typography.button}>I'm Ready</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg, alignItems: 'center' },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  createBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    marginTop: Spacing.xl,
  },
  orText: { color: Colors.textMuted, marginVertical: Spacing.lg },
  joinRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  codeInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '700',
  },
  joinBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  roomCodeLabel: { color: Colors.textSecondary, marginTop: Spacing.lg },
  roomCode: { color: Colors.white, fontSize: 40, fontWeight: '800', letterSpacing: 4 },
  shareHint: { color: Colors.textMuted, marginBottom: Spacing.lg },
  playerList: { width: '100%', gap: Spacing.sm },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  playerName: { flex: 1, color: Colors.textPrimary, fontWeight: '600' },
  readyTag: { color: Colors.textMuted, fontSize: 12 },
  waitingText: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg },
  readyBtn: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    marginTop: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  errorText: { color: Colors.danger, textAlign: 'center', fontWeight: '700', marginBottom: Spacing.sm },
  errorSub: { color: Colors.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    marginTop: Spacing.lg,
  },
  connectingText: { color: Colors.textSecondary, marginTop: Spacing.md },
});
