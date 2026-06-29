// src/components/atoms/GameModal.js
//
// Atomic modal wrapper — a themed bottom-sheet-style container so every
// screen's "are you sure?" / settings / picker dialog looks consistent
// instead of each one building its own Modal + overlay + card markup.

import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

function GameModalBase({ visible, onClose, title, children, footer = null }) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.Colors.surface,
              borderTopLeftRadius: theme.Radius.lg,
              borderTopRightRadius: theme.Radius.lg,
              padding: theme.Spacing.lg,
            },
          ]}
        >
          {title ? (
            <View style={styles.header}>
              <Text
                style={{
                  fontFamily: theme.FontFamily.heading,
                  fontSize: 20,
                  color: theme.Colors.textPrimary,
                }}
              >
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={{ fontSize: 20, color: theme.Colors.textSecondary }}>✕</Text>
              </Pressable>
            </View>
          ) : null}

          {children}

          {footer ? <View style={{ marginTop: theme.Spacing.md }}>{footer}</View> : null}
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
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default React.memo(GameModalBase);
