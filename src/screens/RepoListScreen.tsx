import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { listRepos, createRepo, listGitignoreTemplates, listLicenseTemplates } from '../services/github';
import { useAuth } from '../context/AuthContext';
import { spacing, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { Screen, Card, Input, Button, IconButton, Badge, EmptyState } from '../components/ui';
import PremiumIcon from '../components/icons/PremiumIcon';

export default function RepoListScreen({ navigation }: any) {
  useAuth();
  const { palette, glass, radius } = useTheme();
  const [repos, setRepos] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [newRepoReadme, setNewRepoReadme] = useState(false);
  const [gitignoreTemplate, setGitignoreTemplate] = useState<string | null>(null);
  const [licenseTemplate, setLicenseTemplate] = useState<string | null>(null);
  const [gitignoreOptions, setGitignoreOptions] = useState<string[]>([]);
  const [licenseOptions, setLicenseOptions] = useState<any[]>([]);
  const [pickerModal, setPickerModal] = useState<'gitignore' | 'license' | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data, pagination } = await listRepos({ page: 1, perPage: 30 });
      setRepos(data);
      setFiltered(data);
      setPage(1);
      setHasNextPage(pagination.hasNext);
    } catch (e: any) {
      setError(e.message || 'Failed to load repos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || search.trim()) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data, pagination } = await listRepos({ page: nextPage, perPage: 30 });
      setRepos((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasNextPage(pagination.hasNext);
    } catch {
      // silent fail on load-more - user can pull to refresh
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const navUnsub = navigation.addListener('focus', load);
    return navUnsub;
  }, [navigation, load]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(repos);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(repos.filter((r) => r.name.toLowerCase().includes(q)));
  }, [search, repos]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openCreateModal = () => {
    setCreateModalVisible(true);
    if (gitignoreOptions.length === 0) {
      listGitignoreTemplates().then(setGitignoreOptions).catch(() => {});
    }
    if (licenseOptions.length === 0) {
      listLicenseTemplates().then(setLicenseOptions).catch(() => {});
    }
  };

  const handleCreate = async () => {
    if (!newRepoName.trim()) {
      Alert.alert('Name required', 'Enter a repository name.');
      return;
    }
    setCreating(true);
    try {
      await createRepo({
        name: newRepoName.trim(),
        description: newRepoDesc.trim(),
        isPrivate: newRepoPrivate,
        autoInit: newRepoReadme,
        gitignoreTemplate: gitignoreTemplate || undefined,
        licenseTemplate: licenseTemplate || undefined,
      });
      setCreateModalVisible(false);
      setNewRepoName('');
      setNewRepoDesc('');
      setNewRepoPrivate(false);
      setNewRepoReadme(false);
      setGitignoreTemplate(null);
      setLicenseTemplate(null);
      load();
    } catch (e: any) {
      Alert.alert('Failed to create repo', e.message);
    } finally {
      setCreating(false);
    }
  };

  // Defined inside the component (not at module scope) so it closes over
  // the current theme's colors and recomputes whenever the theme changes -
  // StyleSheet.create is just a plain function, not a hook, so this is
  // safe; the only cost is recreating the style objects each render,
  // which is negligible for a screen-level stylesheet.
  const styles = StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      padding: spacing.md,
      gap: spacing.sm,
      borderBottomColor: glass.border,
      borderBottomWidth: 1,
      alignItems: 'center',
    },
    searchInput: { flex: 1 },
    repoCard: { marginBottom: spacing.sm },
    repoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    repoName: { color: palette.azureBright, fontSize: typography.sizeLg, fontWeight: '700', flex: 1 },
    repoDesc: { color: palette.ink300, marginTop: spacing.xs, fontSize: typography.sizeSm },
    repoMeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    langDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.azure },
    metaText: { color: palette.ink500, fontSize: typography.sizeSm },
    centerBox: { alignItems: 'center', marginTop: spacing.xl },
    errorText: { color: palette.coral, textAlign: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.sm },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: palette.space700,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      borderColor: glass.border,
      borderWidth: 1,
      maxHeight: '85%',
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: glass.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: { color: palette.ink100, fontSize: typography.sizeLg, fontWeight: '700', marginBottom: spacing.md },
    modalInput: { marginBottom: spacing.md },
    toggleRow: { marginBottom: spacing.md },
    toggleContent: { flexDirection: 'row', alignItems: 'center' },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: glass.border,
      marginRight: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: palette.azure, borderColor: palette.azure },
    toggleLabel: { color: palette.ink100, fontWeight: '600', fontSize: typography.sizeMd },
    toggleSubtext: { color: palette.ink500, fontSize: typography.sizeSm, marginTop: 2 },
    pickerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    pickerValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pickerValue: { color: palette.ink300, fontSize: typography.sizeSm },
    modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.md },
    modalActionButton: { flex: 1 },
    pickerCard: {
      backgroundColor: palette.space700,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      borderColor: glass.border,
      borderWidth: 1,
      maxHeight: '70%',
    },
    pickerOption: { marginBottom: spacing.sm },
    pickerOptionText: { color: palette.ink100, fontSize: typography.sizeMd },
  });

  const renderRepo = ({ item }: { item: any }) => (
    <Card
      style={styles.repoCard}
      onPress={() => navigation.navigate('RepoDetail', { owner: item.owner.login, repo: item.name })}
    >
      <View style={styles.repoHeader}>
        <Text style={styles.repoName} numberOfLines={1}>
          {item.name}
        </Text>
        <Badge label={item.private ? 'Private' : 'Public'} tone={item.private ? 'warning' : 'success'} small />
      </View>
      {!!item.description && (
        <Text style={styles.repoDesc} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.repoMeta}>
        {!!item.language && (
          <View style={styles.metaItem}>
            <View style={styles.langDot} />
            <Text style={styles.metaText}>{item.language}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <PremiumIcon name="star" size={12} color={palette.ink500} />
          <Text style={styles.metaText}>{item.stargazers_count}</Text>
        </View>
        <View style={styles.metaItem}>
          <PremiumIcon name="activity" size={12} color={palette.ink500} />
          <Text style={styles.metaText}>{timeAgo(item.updated_at)}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <Input icon="search" placeholder="Search repos..." value={search} onChangeText={setSearch} style={styles.searchInput} />
        <IconButton name="code" variant="subtle" onPress={() => navigation.navigate('CodeSearch')} />
        <IconButton name="plus" variant="glass" color={palette.azureBright} onPress={openCreateModal} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={palette.azureBright} />
      ) : error ? (
        <View style={styles.centerBox}>
          <PremiumIcon name="cloudOff" size={28} color={palette.coral} />
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" onPress={load} variant="secondary" size="sm" style={{ marginTop: spacing.md }} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRepo}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.azureBright} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: spacing.md }} color={palette.azureBright} /> : null
          }
          ListEmptyComponent={
            <EmptyState icon="folder-open-outline" title="No repositories found" subtitle="Try a different search, or create a new one." />
          }
        />
      )}

      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>New repository</Text>
              <Input
                placeholder="repo-name"
                value={newRepoName}
                onChangeText={setNewRepoName}
                autoCapitalize="none"
                mono
                style={styles.modalInput}
              />
              <Input
                placeholder="Description (optional)"
                value={newRepoDesc}
                onChangeText={setNewRepoDesc}
                style={styles.modalInput}
              />

              <Card level="none" inset onPress={() => setNewRepoPrivate(!newRepoPrivate)} style={styles.toggleRow}>
                <View style={styles.toggleContent}>
                  <View style={[styles.checkbox, newRepoPrivate && styles.checkboxChecked]}>
                    {newRepoPrivate && <PremiumIcon name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>Private repository</Text>
                    <Text style={styles.toggleSubtext}>
                      {newRepoPrivate ? 'Only you choose who can see this.' : 'Anyone on the internet can see this repository.'}
                    </Text>
                  </View>
                </View>
              </Card>

              <Card level="none" inset onPress={() => setNewRepoReadme(!newRepoReadme)} style={styles.toggleRow}>
                <View style={styles.toggleContent}>
                  <View style={[styles.checkbox, newRepoReadme && styles.checkboxChecked]}>
                    {newRepoReadme && <PremiumIcon name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>Add a README</Text>
                    <Text style={styles.toggleSubtext}>Can be used for longer descriptions.</Text>
                  </View>
                </View>
              </Card>

              <Card level="none" inset onPress={() => setPickerModal('gitignore')} style={styles.pickerRow}>
                <Text style={styles.toggleLabel}>Add .gitignore</Text>
                <View style={styles.pickerValueRow}>
                  <Text style={styles.pickerValue}>{gitignoreTemplate || 'None'}</Text>
                  <PremiumIcon name="chevronRight" size={16} color={palette.ink500} />
                </View>
              </Card>

              <Card level="none" inset onPress={() => setPickerModal('license')} style={styles.pickerRow}>
                <Text style={styles.toggleLabel}>Add a license</Text>
                <View style={styles.pickerValueRow}>
                  <Text style={styles.pickerValue}>
                    {licenseTemplate
                      ? licenseOptions.find((l) => l.key === licenseTemplate)?.name || licenseTemplate
                      : 'None'}
                  </Text>
                  <PremiumIcon name="chevronRight" size={16} color={palette.ink500} />
                </View>
              </Card>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setCreateModalVisible(false)}
                  style={styles.modalActionButton}
                />
                <Button
                  title="Create"
                  onPress={handleCreate}
                  loading={creating}
                  icon="addCircle"
                  style={styles.modalActionButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={pickerModal === 'gitignore'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>.gitignore template</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Card
                level="none"
                inset
                onPress={() => {
                  setGitignoreTemplate(null);
                  setPickerModal(null);
                }}
                style={styles.pickerOption}
              >
                <Text style={styles.pickerOptionText}>None</Text>
              </Card>
              {gitignoreOptions.map((name) => (
                <Card
                  key={name}
                  level="none"
                  inset
                  onPress={() => {
                    setGitignoreTemplate(name);
                    setPickerModal(null);
                  }}
                  style={styles.pickerOption}
                >
                  <Text style={styles.pickerOptionText}>{name}</Text>
                </Card>
              ))}
            </ScrollView>
            <Button title="Close" variant="secondary" onPress={() => setPickerModal(null)} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>

      <Modal visible={pickerModal === 'license'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>License</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Card
                level="none"
                inset
                onPress={() => {
                  setLicenseTemplate(null);
                  setPickerModal(null);
                }}
                style={styles.pickerOption}
              >
                <Text style={styles.pickerOptionText}>None</Text>
              </Card>
              {licenseOptions.map((license) => (
                <Card
                  key={license.key}
                  level="none"
                  inset
                  onPress={() => {
                    setLicenseTemplate(license.key);
                    setPickerModal(null);
                  }}
                  style={styles.pickerOption}
                >
                  <Text style={styles.pickerOptionText}>{license.name}</Text>
                </Card>
              ))}
            </ScrollView>
            <Button title="Close" variant="secondary" onPress={() => setPickerModal(null)} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
