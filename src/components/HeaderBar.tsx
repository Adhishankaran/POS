import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { useAppSelector } from '../store';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, subtitle }) => {
  const theme = useTheme();
  const settings = useAppSelector((state) => state.settings.settings);

  return (
    <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.primary }]}>
      <Appbar.Content
        title={<Text style={styles.title}>{title}</Text>}
        subtitle={
          <Text style={styles.subtitle}>
            {subtitle || settings.storeName || 'POS Billing System'}
          </Text>
        }
      />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  subtitle: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '500',
  },
});
