import React, { useState } from 'react';
import { 
  MessageSquare, Heart, Share2, Send, PlusCircle, Users, Search, 
  Trophy, Target, Hash, Flame, Salad, Zap, ChevronDown, ChevronUp, Filter, UserPlus, UserMinus,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialTabProps {
  userId: number;
}

type Post = {
  id: number;
  author: { id: number; name: string; avatar?: string; };
  content: string;
  timestamp: string;
  reactions: { fire: number; muscle: number; salad: number; hands: number; };
  userReacted?: string;
  comments: Comment[];
  showComments: boolean;
};

type Comment = {
  id: number;
  author: { name: string; avatar?: string; };
  content: string;
  timestamp: string;
};

type Community = {
  id: number;
  name: string;
  memberCount: number;
  lastPost: string;
  isJoined: boolean;
};

type Conversation = {
  id: number;
  user: { id: number; name: string; avatar?: string; };
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
};

type Message = {
  id: number;
  content: string;
  isMe: boolean;
  timestamp: string;
};

type Person = {
  id: number;
  name: string;
  handle: string;
  avatar?: string;
  isFriend: boolean;
};

export default function SocialTab({ userId }: SocialTabProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'messages'>('feed');
  const [feedFilter, setFeedFilter] = useState<'all' | 'friends'>('all');
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [newComment, setNewComment] = useState<{[key: number]: string}>({});
  const [showReactions, setShowReactions] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'community' | 'messages'>('main');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  
  const { toast } = useToast();

  // Sample data
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: { id: 2, name: 'Sarah Chen' },
      content: 'Just completed my first 5K run! Feeling amazing and ready for the next challenge 🏃‍♀️',
      timestamp: '2h ago',
      reactions: { fire: 12, muscle: 8, salad: 3, hands: 15 },
      userReacted: 'fire',
      comments: [
        { id: 1, author: { name: 'Mike Johnson' }, content: 'Awesome work! 🎉', timestamp: '1h ago' }
      ],
      showComments: false
    }
  ]);

  const [communities] = useState<Community[]>([
    { id: 1, name: 'HIIT Warriors', memberCount: 1247, lastPost: '2h ago', isJoined: true },
    { id: 2, name: 'Running Club', memberCount: 856, lastPost: '4h ago', isJoined: true },
    { id: 3, name: 'Strength Training', memberCount: 634, lastPost: '1d ago', isJoined: true }
  ]);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      user: { id: 2, name: 'Sarah Chen' },
      lastMessage: 'Great workout today!',
      timestamp: '2m ago',
      unread: 2,
      messages: [
        { id: 1, content: 'Hey! How was your run?', isMe: false, timestamp: '10m ago' },
        { id: 2, content: 'Amazing! Just finished my 5K', isMe: true, timestamp: '8m ago' }
      ]
    }
  ]);

  const [people, setPeople] = useState<Person[]>([
    { id: 1, name: 'Alex Rodriguez', handle: '@alex_fit', isFriend: false },
    { id: 2, name: 'Emma Wilson', handle: '@emma_yoga', isFriend: true },
    { id: 3, name: 'David Kim', handle: '@david_runs', isFriend: false }
  ]);

  const reactionOptions = [
    { key: 'fire', emoji: '🔥', label: 'Fire', color: 'from-orange-400 to-red-500' },
    { key: 'muscle', emoji: '💪', label: 'Strong', color: 'from-purple-400 to-pink-500' },
    { key: 'salad', emoji: '🥗', label: 'Healthy', color: 'from-green-400 to-emerald-500' },
    { key: 'hands', emoji: '🙌', label: 'Amazing', color: 'from-blue-400 to-purple-500' }
  ];

  const handleReaction = (postId: number, reaction: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newReactions = { ...post.reactions };
        const currentReaction = post.userReacted;
        
        if (currentReaction) {
          newReactions[currentReaction as keyof typeof newReactions]--;
        }
        
        if (currentReaction !== reaction) {
          newReactions[reaction as keyof typeof newReactions]++;
          return { ...post, reactions: newReactions, userReacted: reaction };
        } else {
          return { ...post, reactions: newReactions, userReacted: undefined };
        }
      }
      return post;
    }));
    setShowReactions(null);
  };

  const toggleComments = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, showComments: !post.showComments } : post
    ));
  };

  const addComment = (postId: number) => {
    const content = newComment[postId]?.trim();
    if (!content) return;
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newCommentObj: Comment = {
          id: Date.now(),
          author: { name: 'You' },
          content,
          timestamp: 'now'
        };
        return { ...post, comments: [...post.comments, newCommentObj] };
      }
      return post;
    }));
    
    setNewComment({ ...newComment, [postId]: '' });
  };

  const createPost = () => {
    if (!composerContent.trim()) return;
    
    const newPost: Post = {
      id: Date.now(),
      author: { id: userId, name: 'You' },
      content: composerContent,
      timestamp: 'now',
      reactions: { fire: 0, muscle: 0, salad: 0, hands: 0 },
      comments: [],
      showComments: false
    };
    
    setPosts([newPost, ...posts]);
    setComposerContent('');
    setComposerExpanded(false);
    toast({ title: "Post shared! 🎉", description: "Your achievement is now live in the community" });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const newMsg: Message = {
      id: Date.now(),
      content: newMessage,
      isMe: true,
      timestamp: 'now'
    };
    
    setConversations(conversations.map(conv => {
      if (conv.id === selectedConversation) {
        return {
          ...conv,
          messages: [...conv.messages, newMsg],
          lastMessage: newMessage,
          timestamp: 'now'
        };
      }
      return conv;
    }));
    
    toast({ title: "Message sent! 💬", description: "Your message has been delivered" });
    setNewMessage('');
    
    // Auto-scroll to bottom (simulated)
    setTimeout(() => {
      const chatContainer = document.querySelector('[data-chat-container]');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  };

  const toggleFriend = (personId: number) => {
    setPeople(people.map(person => {
      if (person.id === personId) {
        const newIsFriend = !person.isFriend;
        toast({ 
          title: newIsFriend ? "Friend added! 🤝" : "Friend removed",
          description: newIsFriend ? "You're now connected!" : "Friend status updated"
        });
        return { ...person, isFriend: newIsFriend };
      }
      return person;
    }));
  };

  const filteredPeople = people.filter(person => 
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(communitySearchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Simple Header */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900">Thryvin'</h1>
          <p className="text-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Social Activities</p>
        </div>
      </div>

      {/* Persistent Navigation */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md shadow-sm border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            {[
              { id: 'feed', label: 'Feed', icon: '🏆' },
              { id: 'communities', label: 'Communities', icon: '👥' }, 
              { id: 'messages', label: 'Messages', icon: '💬' }
            ].map((tab) => {
              const isActive = (tab.id === 'feed' && activeTab === 'feed' && currentView === 'main') ||
                              (tab.id === 'communities' && currentView === 'community') ||
                              (tab.id === 'messages' && currentView === 'messages');
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'communities') {
                      setCurrentView('community');
                      setSelectedCommunity(null);
                    } else if (tab.id === 'messages') {
                      setCurrentView('messages');
                      setSelectedConversation(null);
                    } else {
                      setActiveTab(tab.id as any);
                      setCurrentView('main');
                    }
                  }}
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Feed Tab */}
        {activeTab === 'feed' && currentView === 'main' && (
          <div className="space-y-6">
            {/* Search + Toggle */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="🔍 Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowPeopleSearch(true)}
                  className="rounded-xl border-purple-200 bg-white/80 backdrop-blur-sm focus:border-purple-400"
                />
              </div>
              <div className="flex rounded-xl border border-purple-200 bg-white/80 backdrop-blur-sm overflow-hidden">
                <button
                  onClick={() => setFeedFilter('all')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    feedFilter === 'all' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFeedFilter('friends')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    feedFilter === 'friends' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Friends
                </button>
              </div>
            </div>

            {/* Share Button */}
            <Card className="rounded-2xl border-purple-200 bg-gradient-to-br from-white to-purple-50/30 shadow-lg">
              <CardContent className="p-4">
                <Button
                  onClick={() => setShowShareModal(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl py-3 shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  ✨ Share Your Achievement
                </Button>
              </CardContent>
            </Card>

            {/* Posts */}
            <div className="space-y-6">
              {posts.filter(post => {
                if (feedFilter === 'friends') {
                  const friendIds = people.filter(p => p.isFriend).map(p => p.id);
                  return friendIds.includes(post.author.id) || post.author.id === userId;
                }
                return true;
              }).map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="rounded-3xl border-purple-200 bg-gradient-to-br from-white to-purple-50/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      {/* Post Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12 border-2 border-purple-200 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold">
                            {post.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-lg">{post.author.name}</div>
                          <div className="text-sm text-purple-600">{post.timestamp}</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
                          <span className="text-purple-700 font-medium text-sm">🏆 Achievement</span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-800 mb-6 text-lg leading-relaxed">{post.content}</p>

                      {/* Reactions Row */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-purple-100">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                              <Smile className="h-4 w-4" />
                              React
                            </Button>
                            
                            <AnimatePresence>
                              {showReactions === post.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                  className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-purple-200 p-3 z-10"
                                >
                                  <div className="flex gap-2">
                                    {reactionOptions.map((reaction) => (
                                      <motion.button
                                        key={reaction.key}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleReaction(post.id, reaction.key)}
                                        className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                                          post.userReacted === reaction.key
                                            ? 'bg-gradient-to-r ' + reaction.color + ' text-white shadow-lg'
                                            : 'hover:bg-gray-50'
                                        }`}
                                      >
                                        <span className="text-xl mb-1">{reaction.emoji}</span>
                                        <span className="text-xs font-medium">{reaction.label}</span>
                                        {post.reactions[reaction.key as keyof typeof post.reactions] > 0 && (
                                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full mt-1">
                                            {post.reactions[reaction.key as keyof typeof post.reactions]}
                                          </span>
                                        )}
                                      </motion.button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                        </div>
                        
                        <Button
                          variant="ghost"
                          onClick={() => toggleComments(post.id)}
                          className="rounded-full text-purple-600 hover:bg-purple-50"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {post.comments.length} Comments
                        </Button>
                      </div>

                      {/* Comments */}
                      <AnimatePresence>
                        {post.showComments && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 border border-purple-200">
                                  <AvatarFallback className="bg-gradient-to-r from-purple-300 to-pink-300 text-white text-sm">
                                    {comment.author.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl px-4 py-3">
                                    <div className="font-medium text-purple-800 text-sm">{comment.author.name}</div>
                                    <div className="text-gray-700">{comment.content}</div>
                                  </div>
                                  <div className="text-xs text-purple-500 mt-1 ml-4">{comment.timestamp}</div>
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-3">
                              <Avatar className="h-8 w-8 border border-purple-200">
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">Y</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  placeholder="Add an encouraging comment... 💬"
                                  value={newComment[post.id] || ''}
                                  onChange={(e) => setNewComment({...newComment, [post.id]: e.target.value})}
                                  className="rounded-2xl border-purple-200 focus:border-purple-400"
                                  onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                                />
                                <Button
                                  onClick={() => addComment(post.id)}
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full px-4"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Community View */}
        {currentView === 'community' && !selectedCommunity && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <Input
                placeholder="🔍 Find communities..."
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
                className="rounded-xl border-purple-200 bg-white/80 backdrop-blur-sm focus:border-purple-400"
              />
            </div>
            
            <div className="grid gap-4">
              {filteredCommunities.map((community) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedCommunity(community)}
                  className="cursor-pointer"
                >
                  <Card className="rounded-2xl border-purple-200 bg-gradient-to-br from-white to-purple-50/30 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-3 text-white shadow-lg">
                            <Hash className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="font-bold text-xl text-gray-900">{community.name}</div>
                            <div className="text-purple-600">
                              🎯 {community.memberCount.toLocaleString()} members • 📝 Last post {community.lastPost}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg">
                          ✅ Joined
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Community Detail View */}
        {currentView === 'community' && selectedCommunity && (
          <div className="space-y-6">
            {/* Community Header */}
            <Card className="rounded-2xl border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg">
                      <Hash className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCommunity.name}</h2>
                      <p className="text-purple-600 text-lg">
                        🎯 {selectedCommunity.memberCount.toLocaleString()} members • 📝 Last post {selectedCommunity.lastPost}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedCommunity(null)}
                    variant="outline"
                    className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    ← Back to Communities
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Community Posts */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Recent Posts</h3>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="rounded-2xl border-purple-200 bg-gradient-to-br from-white to-purple-50/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      {/* Post Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12 border-2 border-purple-200 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold">
                            {post.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-gray-900">{post.author.name}</div>
                          <div className="text-sm text-purple-600">{post.timestamp}</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
                          <span className="text-purple-700 font-medium text-sm">🏆 Achievement</span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-800 mb-6 text-lg leading-relaxed">{post.content}</p>

                      {/* Reactions Row */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-purple-100">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                            >
                              <Smile className="h-4 w-4" />
                              React
                            </Button>
                            
                            <AnimatePresence>
                              {showReactions === post.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                  className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-purple-200 p-3 z-10"
                                >
                                  <div className="flex gap-2">
                                    {reactionOptions.map((reaction) => (
                                      <motion.button
                                        key={reaction.key}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleReaction(post.id, reaction.key)}
                                        className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                                          post.userReacted === reaction.key
                                            ? 'bg-gradient-to-r ' + reaction.color + ' text-white shadow-lg'
                                            : 'hover:bg-gray-50'
                                        }`}
                                      >
                                        <span className="text-xl mb-1">{reaction.emoji}</span>
                                        <span className="text-xs font-medium">{reaction.label}</span>
                                        {post.reactions[reaction.key as keyof typeof post.reactions] > 0 && (
                                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full mt-1">
                                            {post.reactions[reaction.key as keyof typeof post.reactions]}
                                          </span>
                                        )}
                                      </motion.button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                        </div>
                        
                        <Button
                          variant="ghost"
                          onClick={() => toggleComments(post.id)}
                          className="rounded-lg text-purple-600 hover:bg-purple-50"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {post.comments.length} Comments
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Messages List View */}
        {currentView === 'messages' && !selectedConversation && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Input
                placeholder="🔍 Search conversations..."
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                className="rounded-xl border-purple-200 bg-white/80 backdrop-blur-sm focus:border-purple-400"
              />
              <Input
                placeholder="👋 Find people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowPeopleSearch(true)}
                className="rounded-xl border-purple-200 bg-white/80 backdrop-blur-sm focus:border-purple-400"
              />
            </div>
            
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="rounded-2xl border-purple-200 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl bg-white/80"
                    onClick={() => {
                      setSelectedConversation(conversation.id);
                      setConversations(conversations.map(conv => 
                        conv.id === conversation.id ? {...conv, unread: 0} : conv
                      ));
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-purple-200">
                          <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold">
                            {conversation.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-gray-900 truncate">{conversation.user.name}</div>
                            <div className="text-xs text-purple-500">{conversation.timestamp}</div>
                          </div>
                          <div className="text-sm text-gray-600 truncate">{conversation.lastMessage}</div>
                        </div>
                        {conversation.unread > 0 && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Chat View */}
        {currentView === 'messages' && selectedConversation && (
          <div className="space-y-4">
            {/* Chat Header with Back Button */}
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="outline"
                onClick={() => setSelectedConversation(null)}
                className="rounded-lg border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                ← Back to Messages
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-purple-200">
                  <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold">
                    {conversations.find(c => c.id === selectedConversation)?.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="font-bold text-lg text-gray-900">
                  💬 {conversations.find(c => c.id === selectedConversation)?.user.name}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <Card className="rounded-2xl border-purple-200 shadow-lg h-[500px] flex flex-col bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex-1 p-4 overflow-y-auto space-y-3" data-chat-container>
                {conversations.find(c => c.id === selectedConversation)?.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: message.isMe ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                        message.isMe
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white text-gray-900 border border-purple-100'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 border-t border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex gap-3">
                  <Input
                    placeholder="Type something awesome... ✨"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="rounded-2xl border-purple-200 focus:border-purple-400 bg-white"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full px-6 shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}


      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <Card className="w-full max-w-lg rounded-3xl border-purple-200 shadow-2xl bg-gradient-to-br from-white to-purple-50/50">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-2xl text-gradient-brand">✨ Share Your Achievement</h3>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowShareModal(false);
                      setComposerContent('');
                    }}
                    className="rounded-full h-10 w-10 p-0 hover:bg-purple-100"
                  >
                    ✕
                  </Button>
                </div>
                <div className="space-y-6">
                  <Textarea
                    placeholder="Tell the community about your incredible fitness journey! 🚀🏋️‍♂️"
                    value={composerContent}
                    onChange={(e) => setComposerContent(e.target.value)}
                    className="border-2 border-purple-200 rounded-2xl resize-none focus:border-purple-400 focus:ring-purple-300 p-4 text-base"
                    autoFocus
                    rows={5}
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowShareModal(false);
                        setComposerContent('');
                      }}
                      className="rounded-full border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        createPost();
                        setShowShareModal(false);
                      }}
                      disabled={!composerContent.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-8 shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      🎆 Share Achievement
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* People Search Panel */}
      {showPeopleSearch && searchQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <Card className="w-full max-w-md mx-4 rounded-3xl border-purple-200 shadow-2xl bg-gradient-to-br from-white to-purple-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-xl text-gray-900">🔍 Find Athletes</h3>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowPeopleSearch(false);
                      setSearchQuery('');
                    }}
                    className="rounded-full h-8 w-8 p-0 hover:bg-purple-100"
                  >
                    ✕
                  </Button>
                </div>
                <div className="space-y-4">
                  {filteredPeople.map((person) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-purple-50 transition-colors"
                    >
                      <Avatar className="h-12 w-12 border-2 border-purple-200">
                        <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold">
                          {person.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{person.name}</div>
                        <div className="text-sm text-purple-600">{person.handle}</div>
                      </div>
                      <Button
                        onClick={() => toggleFriend(person.id)}
                        variant="outline"
                        size="sm"
                        className={`rounded-full transition-all duration-300 ${
                          person.isFriend 
                            ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white border-red-300 hover:from-red-500 hover:to-pink-600' 
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-300 hover:from-purple-600 hover:to-pink-600'
                        }`}
                      >
                        {person.isFriend ? (
                          <><UserMinus className="h-4 w-4 mr-1" /> Remove</>
                        ) : (
                          <><UserPlus className="h-4 w-4 mr-1" /> Add Friend</>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}