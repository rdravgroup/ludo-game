// src/components/ChatBox.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme/Theme';

const EMOTES = ['👍', '😂', '😮', '😡', '🎉', '👏', '🔥', '😢'];

export default function ChatBox({ visible, onClose, messages, onSend, myColor }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend({ type: 'text', content: text.trim() });
    setText('');
  };

  const handleEmote = (emote) => {
    onSend({ type: 'emote', content: emote });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Chat</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, i) => `${item.timestamp}-${i}`}
            style={styles.list}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.color === myColor ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text style={styles.bubbleSender}>{item.sender}</Text>
                <Text style={styles.bubbleText}>{item.content}</Text>
              </View>
            )}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={styles.emoteRow}>
            {EMOTES.map((e) => (
              <Pressable key={e} onPress={() => handleEmote(e)} style={styles.emoteBtn}>
                <Text style={styles.emoteText}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    height: '60%',
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  close: { color: Colors.textSecondary, fontSize: 20 },
  list: { flex: 1, marginBottom: Spacing.sm },
  bubble: {
    maxWidth: '80%',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginVertical: 4,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
  },
  bubbleTheirs: {
    backgroundColor: Colors.surfaceElevated,
    alignSelf: 'flex-start',
  },
  bubbleSender: { color: Colors.textMuted, fontSize: 10, marginBottom: 2 },
  bubbleText: { color: Colors.white, fontSize: 14 },
  emoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  emoteBtn: { padding: 6 },
  emoteText: { fontSize: 24 },
  inputRow: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  sendText: { color: Colors.white, fontWeight: '700' },
});
