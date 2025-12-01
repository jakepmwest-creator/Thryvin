import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://nine-cars-lie.loca.lt';

// BeReal-style reactions
const REACTION_TYPES = [
  { type: 'fire', icon: '🔥', label: 'Fire' },
  { type: 'muscle', icon: '💪', label: 'Strong' },
  { type: 'clap', icon: '👏', label: 'Clap' },
  { type: 'heart', icon: '❤️', label: 'Love' },
  { type: 'star', icon: '⭐', label: 'Star' },
];

interface Post {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    level?: string;
  };
  content: string;
  imageUrl?: string;
  workoutData?: string;
  statsData?: string;
  reactions: Record<string, number>;
  totalReactions: number;
  userReaction?: string | null;
  commentsCount: number;
  createdAt: string;
}

interface Community {
  id: number;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  isMember: boolean;
}

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<'feed' | 'communities'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
    loadCommunities();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCommunities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/communities`);
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
    }
  };

  const handleReaction = async (postId: number, reactionType: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === postId) {
            const isRemoving = p.userReaction === reactionType;
            const newReactions = { ...p.reactions };
            
            if (isRemoving) {
              newReactions[reactionType] = Math.max(0, (newReactions[reactionType] || 0) - 1);
              return {
                ...p,
                reactions: newReactions,
                totalReactions: p.totalReactions - 1,
                userReaction: null,
              };
            } else {
              if (p.userReaction) {
                newReactions[p.userReaction] = Math.max(0, (newReactions[p.userReaction] || 0) - 1);
              }
              newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
              return {
                ...p,
                reactions: newReactions,
                totalReactions: p.userReaction ? p.totalReactions : p.totalReactions + 1,
                userReaction: reactionType,
              };
            }
          }
          return p;
        })
      );

      if (post.userReaction === reactionType) {
        await fetch(`${API_BASE_URL}/api/social/posts/${postId}/react`, {
          method: 'DELETE',
        });
      } else {
        await fetch(`${API_BASE_URL}/api/social/posts/${postId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reactionType }),
        });
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      loadPosts();
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent }),
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setPostContent('');
        setPostModalVisible(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinCommunity = async (communityId: number) => {
    try {
      const community = communities.find(c => c.id === communityId);
      if (!community) return;

      setCommunities(prevCommunities =>
        prevCommunities.map(c =>
          c.id === communityId
            ? {
                ...c,
                isMember: !c.isMember,
                memberCount: c.isMember ? c.memberCount - 1 : c.memberCount + 1,
              }
            : c
        )
      );

      if (community.isMember) {
        await fetch(`${API_BASE_URL}/api/social/communities/${communityId}/leave`, {
          method: 'DELETE',
        });
      } else {
        await fetch(`${API_BASE_URL}/api/social/communities/${communityId}/join`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Error joining community:', error);
      loadCommunities();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderPost = (post: Post) => {
    const workoutData = post.workoutData ? JSON.parse(post.workoutData) : null;
    const statsData = post.statsData ? JSON.parse(post.statsData) : null;

    return (
      <View key={post.id} style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getUserInitials(post.user.name)}</Text>
            </View>
            <View>
              <View style={styles.userName}>
                <Text style={styles.userNameText}>{post.user.name}</Text>
                {post.user.level && (
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{post.user.level}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {workoutData && (
          <LinearGradient
            colors={[`${COLORS.accent}10`, `${COLORS.accentSecondary}10`]}
            style={styles.statsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="barbell" size={20} color={COLORS.accent} />
                <Text style={styles.statLabel}>{workoutData.type || 'Workout'}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={18} color={COLORS.accentSecondary} />
                <Text style={styles.statValue}>{workoutData.duration}min</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {statsData && (
          <View style={styles.achievementBadge}>
            <LinearGradient
              colors={['#FFD700', '#FFA000']}
              style={styles.achievementGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="trophy" size={24} color={COLORS.white} />
              <Text style={styles.achievementTitle}>
                {statsData.streak && `${statsData.streak}-day streak!`}
                {statsData.totalWorkouts && ` • ${statsData.totalWorkouts} workouts`}
              </Text>
            </LinearGradient>
          </View>
        )}

        {post.imageUrl && (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
        )}

        <View style={styles.reactionsBar}>
          {REACTION_TYPES.map(({ type, icon }) => {
            const count = post.reactions[type] || 0;
            const isActive = post.userReaction === type;

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.reactionButton,
                  isActive && styles.reactionButtonActive,
                ]}
                onPress={() => handleReaction(post.id, type)}
              >
                <Text style={[styles.reactionEmoji, isActive && styles.reactionEmojiActive]}>
                  {icon}
                </Text>
                {count > 0 && (
                  <Text style={[styles.reactionCount, isActive && styles.reactionCountActive]}>
                    {count}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.postActions}>
          <View style={styles.actionButton}>
            <Text style={styles.actionText}>
              {post.totalReactions} {post.totalReactions === 1 ? 'reaction' : 'reactions'}
            </Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.text} />
            <Text style={styles.actionText}>{post.commentsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCommunity = (community: Community) => {
    const iconMap: Record<string, any> = {
      barbell: 'barbell',
      run: 'walk',
      leaf: 'leaf',
      trophy: 'trophy',
      nutrition: 'nutrition',
    };

    const gradients: Record<string, string[]> = {
      barbell: [COLORS.accent, COLORS.accentSecondary],
      run: ['#4CAF50', '#00C853'],
      leaf: ['#9C27B0', '#AA00FF'],
      trophy: ['#FF9800', '#FF5722'],
      nutrition: ['#2196F3', '#00B0FF'],
    };

    return (
      <TouchableOpacity key={community.id} style={styles.communityCard}>
        <LinearGradient
          colors={gradients[community.icon] || [COLORS.accent, COLORS.accentSecondary]}
          style={styles.communityGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name={iconMap[community.icon] || 'people'}
            size={32}
            color={COLORS.white}
          />
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.communityMembers}>
            {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
          </Text>
          <TouchableOpacity
            style={[styles.joinButton, community.isMember && styles.joinedButton]}
            onPress={() => handleJoinCommunity(community.id)}
          >
            <Text
              style={[
                styles.joinButtonText,
                community.isMember && styles.joinedButtonText,
              ]}
            >
              {community.isMember ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
    loadCommunities();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader mode="fitness" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'communities' && styles.tabActive]}
          onPress={() => setActiveTab('communities')}
        >
          <Text style={[styles.tabText, activeTab === 'communities' && styles.tabTextActive]}>
            Communities
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {activeTab === 'feed' ? (
          <>
            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={COLORS.mediumGray} />
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>Be the first to share something!</Text>
              </View>
            ) : (
              posts.map(renderPost)
            )}
          </>
        ) : (
          <View style={styles.communitiesGrid}>
            {communities.map(renderCommunity)}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setPostModalVisible(true)}
      >
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.floatingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.postModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.postInput}
              placeholder="Share your fitness journey..."
              placeholderTextColor={COLORS.mediumGray}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              autoFocus
            />

            <TouchableOpacity
              style={[styles.publishButton, !postContent.trim() && styles.publishButtonDisabled]}
              onPress={handleCreatePost}
              disabled={!postContent.trim() || submitting}
            >
              <LinearGradient
                colors={
                  !postContent.trim()
                    ? [COLORS.lightGray, COLORS.lightGray]
                    : [COLORS.accent, COLORS.accentSecondary]
                }
                style={styles.publishGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.publishText}>Publish</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  postCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  levelBadge: {
    backgroundColor: `${COLORS.accent}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  postContent: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  statsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
  },
  achievementBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  achievementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  reactionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    gap: 4,
  },
  reactionButtonActive: {
    backgroundColor: `${COLORS.accent}20`,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionEmojiActive: {
    fontSize: 20,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  reactionCountActive: {
    color: COLORS.accent,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  communitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  communityCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  communityGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  communityName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  communityMembers: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinedButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  joinedButtonText: {
    color: COLORS.white,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  postModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  postInput: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  publishButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  publishText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
