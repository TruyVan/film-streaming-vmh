import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import {
  PlaylistTab,
  ThemeMode,
  TimestampBookmark,
  Video,
  VideoProgress,
  WatchHistoryItem,
} from './types/video';
import { mockVideos } from './data/mockVideos';
import { fetchVideos } from './lib/supabase';
import {
  addVideoTimestampBookmark,
  clearAllWatchHistory,
  clearVideoProgress,
  formatSeconds,
  getAllVideoProgressMap,
  getFavoriteVideoIds,
  getVideoTimestampBookmarks,
  getWatchHistory,
  recordWatchHistory,
  removeVideoTimestampBookmark,
  removeWatchHistoryItem,
  toggleFavoriteVideoId,
} from './lib/progress';
import {
  addCustomTopic,
  getCustomTopics,
  removeCustomTopic,
  resetCustomTopicsToDefault,
} from './lib/topics';
import { Header } from './components/ui/Header';
import { YouTubeSidebar } from './components/ui/YouTubeSidebar';
import { HomeBentoGrid } from './components/ui/HomeBentoGrid';
import { CustomArtPlayer } from './components/player/CustomArtPlayer';
import { VideoDetails } from './components/ui/VideoDetails';
import { PlaylistSidebar } from './components/ui/PlaylistSidebar';
import { AdminDevPortal } from './components/ui/AdminDevPortal';
import { TopicManagerModal } from './components/ui/TopicManagerModal';
import { MobileBottomNav } from './components/ui/MobileBottomNav';

const THEME_STORAGE_KEY = 'partystream_theme_mode_v1';

export default function App() {
  const [videos, setVideos] = useState<Video[]>(mockVideos);

  const [currentPage, setCurrentPage] = useState<'home' | 'watch' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestedId = params.get('v');
      if (requestedId && mockVideos.some((v) => v.id === requestedId)) {
        return 'watch';
      }
    }
    return 'home';
  });

  const [currentVideoId, setCurrentVideoId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestedId = params.get('v');
      if (requestedId && mockVideos.some((v) => v.id === requestedId)) {
        return requestedId;
      }
    }
    return mockVideos[0]?.id || '';
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [playlistTab, setPlaylistTab] = useState<PlaylistTab>('all');
  const [isTopicModalOpen, setIsTopicModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // User configurable topics
  const [customTopics, setCustomTopics] = useState<string[]>(() =>
    getCustomTopics()
  );

  const [progressMap, setProgressMap] = useState<Record<string, VideoProgress>>(
    {}
  );
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    getFavoriteVideoIds()
  );
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() =>
    getWatchHistory()
  );
  const [timestampBookmarks, setTimestampBookmarks] = useState<
    TimestampBookmark[]
  >([]);

  const [externalSeekTime, setExternalSeekTime] = useState<{
    time: number;
    nonce: number;
  } | null>(null);

  const handleToggleThemeMode = useCallback(() => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
          // Ignore errors
        }
      }
      return next;
    });
  }, []);

  // Topic management handlers: deleting topic does NOT delete videos
  const handleAddTopic = useCallback((topic: string) => {
    const next = addCustomTopic(topic);
    setCustomTopics(next);
  }, []);

  const handleRemoveTopic = useCallback((topic: string) => {
    const next = removeCustomTopic(topic);
    setCustomTopics(next);
    setActiveCategory((prev) =>
      prev.toLowerCase() === topic.toLowerCase() ? 'ALL' : prev
    );
  }, []);

  const handleResetTopics = useCallback(() => {
    const next = resetCustomTopicsToDefault();
    setCustomTopics(next);
  }, []);
  useEffect(() => {
  const path = window.location.pathname;
  if (path === '/history') {
    setPlaylistTab('history');
  } else if (path === '/bookmarked' || path === '/favorites') {
    setPlaylistTab('favorites');
  } else if (path.startsWith('/tags/')) {
    const tagSlug = path.replace('/tags/', '');
    // Tự động tìm tag tương ứng và kích hoạt filter
    const found = customTopics.find((t) => t.toLowerCase().replace(/\s+/g, '-') === tagSlug);
    if (found) setActiveCategory(found);
  }
}, [customTopics]);

// Khi người dùng bấm tab hoặc tag, cập nhật URL không cần reload:
const navigateSlug = (slugPath: string) => {
  window.history.pushState({}, '', slugPath);
};
  // Load videos from Supabase (with automatic fallback to mockVideos.ts)
  useEffect(() => {
    let isMounted = true;
    fetchVideos()
      .then(({ videos: loadedVideos }) => {
        if (!isMounted) return;
        setIsLoading(false);
        if (loadedVideos.length === 0) return;
        setVideos(loadedVideos);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const requestedId = params.get('v');
          if (requestedId && loadedVideos.some((v) => v.id === requestedId)) {
            setCurrentVideoId(requestedId);
            setCurrentPage('watch');
            setIsSidebarOpen(false);
          } else {
            setCurrentVideoId((prev) =>
              loadedVideos.some((v) => v.id === prev) ? prev : loadedVideos[0].id
            );
          }
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const ids = videos.map((v) => v.id);
    setProgressMap(getAllVideoProgressMap(ids));
  }, [videos]);

  // Record watch history & load timestamp bookmarks when on Watch Page
  useEffect(() => {
    if (currentPage !== 'watch' || !currentVideoId) return;
    const nextHistory = recordWatchHistory(currentVideoId);
    setWatchHistory(nextHistory);
    setTimestampBookmarks(getVideoTimestampBookmarks(currentVideoId));
  }, [currentPage, currentVideoId]);

  // Sync browser Back/Forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const vId = params.get('v');
      if (vId && videos.some((v) => v.id === vId)) {
        setCurrentVideoId(vId);
        setCurrentPage('watch');
        setIsSidebarOpen(false);
      } else {
        setCurrentPage('home');
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [videos]);

  const handleSelectVideo = useCallback((video: Video) => {
    setCurrentVideoId(video.id);
    setCurrentPage('watch');
    setIsSidebarOpen(false);
    // Ghi nhận một lượt xem mới riêng biệt cho lần xem này
    const nextHistory = recordWatchHistory(video.id, 0, 0, true);
    setWatchHistory(nextHistory);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('v', video.id);
      window.history.pushState({ videoId: video.id }, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleGoHome = useCallback(() => {
    setCurrentPage('home');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('v');
      window.history.pushState({}, '', url.pathname + url.search);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleSelectSidebarItem = useCallback(
    (tab: PlaylistTab, category?: string) => {
      setPlaylistTab(tab);
      if (category) {
        setActiveCategory(category);
      }
      handleGoHome();
    },
    [handleGoHome]
  );

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let baseList: Video[] = [];
    if (playlistTab === 'favorites') {
      baseList = favoriteIds
        .map((id) => videos.find((v) => v.id === id))
        .filter((v): v is Video => Boolean(v));
    } else if (playlistTab === 'history') {
      baseList = watchHistory
        .map((h) => videos.find((v) => v.id === h.videoId))
        .filter((v): v is Video => Boolean(v));
    } else {
      baseList = videos;
    }

    return baseList.filter((video) => {
      const matchesCategory =
        playlistTab !== 'all' ||
        activeCategory === 'ALL' ||
        video.tags.some(
          (t) => t.toLowerCase() === activeCategory.toLowerCase()
        );

      if (!matchesCategory) return false;
      if (!q) return true;

      const inTitle = video.title.toLowerCase().includes(q);
      const inTags = video.tags.some((t) => t.toLowerCase().includes(q));
      return inTitle || inTags;
    });
  }, [
    videos,
    playlistTab,
    favoriteIds,
    watchHistory,
    searchQuery,
    activeCategory,
  ]);

  const currentVideo = useMemo(() => {
    return (
      videos.find((v) => v.id === currentVideoId) ||
      filteredVideos[0] ||
      videos[0]
    );
  }, [videos, currentVideoId, filteredVideos]);

  const handleProgressUpdate = useCallback((updated: VideoProgress) => {
    setProgressMap((prev) => ({
      ...prev,
      [updated.videoId]: updated,
    }));
    const nextHistory = recordWatchHistory(
      updated.videoId,
      updated.currentTime,
      updated.duration
    );
    setWatchHistory(nextHistory);
  }, []);

  const handleResetProgress = useCallback((videoId: string) => {
    clearVideoProgress(videoId);
    setProgressMap((prev) => {
      const next = { ...prev };
      delete next[videoId];
      return next;
    });
    setExternalSeekTime({ time: 0, nonce: Date.now() });
  }, []);

  const handleToggleFavorite = useCallback((videoId: string) => {
    const { favorites } = toggleFavoriteVideoId(videoId);
    setFavoriteIds(favorites);
  }, []);

  const handleRemoveHistoryItem = useCallback((videoId: string) => {
    const next = removeWatchHistoryItem(videoId);
    setWatchHistory(next);
  }, []);

  const handleClearAllHistory = useCallback(() => {
    const next = clearAllWatchHistory();
    setWatchHistory(next);
  }, []);

  const handleAddTimestampBookmark = useCallback(
    (time: number, label: string) => {
      if (!currentVideo) return;
      const next = addVideoTimestampBookmark(currentVideo.id, time, label);
      setTimestampBookmarks(next);
    },
    [currentVideo]
  );

  const handleQuickBookmarkFromPlayer = useCallback(
    (currentTime: number) => {
      if (!currentVideo) return;
      const label = `Khoảnh khắc tại ${formatSeconds(currentTime)}`;
      const next = addVideoTimestampBookmark(
        currentVideo.id,
        currentTime,
        label
      );
      setTimestampBookmarks(next);
    },
    [currentVideo]
  );

  const handleRemoveTimestampBookmark = useCallback(
    (bookmarkId: string) => {
      if (!currentVideo) return;
      const next = removeVideoTimestampBookmark(currentVideo.id, bookmarkId);
      setTimestampBookmarks(next);
    },
    [currentVideo]
  );

  const handleSeekTo = useCallback((seconds: number) => {
    setExternalSeekTime({ time: seconds, nonce: Date.now() });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleVideoAdded = useCallback(
    (newVideo: Video) => {
      setVideos((prev) => [newVideo, ...prev]);
      handleSelectVideo(newVideo);
    },
    [handleSelectVideo]
  );

  const handleVideoUpdated = useCallback((updated: Video) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }, []);

  const isLight = themeMode === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${
        isLight
          ? 'bg-[#FAF7F9] text-slate-900'
          : 'bg-[#0f0f0f] text-zinc-100'
      }`}
    >
      {/* YouTube Compact Header (Chỉ Logo & Search Button - Nền sáng/tối đã chuyển vào Sidebar) */}
      <Header
        themeMode={themeMode}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onGoHome={handleGoHome}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex w-full">
        {/* YouTube Left Sidebar (Persistent on Desktop, Slide-over on Mobile - z-[9999] che phủ video player khi mở) */}
        <YouTubeSidebar
          isOpen={isSidebarOpen}
          currentPage={currentPage}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
          playlistTab={playlistTab}
          activeCategory={activeCategory}
          favoritesCount={favoriteIds.length}
          historyCount={watchHistory.length}
          customTopics={customTopics}
          onOpenTopicManager={() => setIsTopicModalOpen(true)}
          onSelectHomeTab={handleSelectSidebarItem}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onOpenDevManage={() => {
            setCurrentPage('admin');
            setIsSidebarOpen(false);
          }}
        />

        {/* Main View: Home Feed, Watch Page OR Dedicated Admin Dev Portal */}
        {currentPage === 'admin' ? (
          <AdminDevPortal
            themeMode={themeMode}
            videos={videos}
            customTopics={customTopics}
            onVideoAdded={handleVideoAdded}
            onVideoUpdated={handleVideoUpdated}
            onAddTopic={handleAddTopic}
            onRemoveTopic={handleRemoveTopic}
            onResetTopics={handleResetTopics}
            onGoHome={handleGoHome}
          />
        ) : currentPage === 'home' ? (
          <HomeBentoGrid
            videos={filteredVideos}
            allVideos={videos}
            themeMode={themeMode}
            progressMap={progressMap}
            favoriteIds={favoriteIds}
            watchHistory={watchHistory}
            playlistTab={playlistTab}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            customTopics={customTopics}
            isLoading={isLoading}
            onOpenTopicManager={() => setIsTopicModalOpen(true)}
            onSelectVideo={handleSelectVideo}
            onToggleFavorite={handleToggleFavorite}
            onPlaylistTabChange={setPlaylistTab}
            onCategoryChange={setActiveCategory}
            onRemoveHistoryItem={handleRemoveHistoryItem}
            onClearAllHistory={handleClearAllHistory}
            onClearFilters={() => {
              setSearchQuery('');
              setActiveCategory('ALL');
              setPlaylistTab('all');
            }}
          />
        ) : (
          /* YOUTUBE FULL-WIDTH 2-COLUMN WATCH PAGE (Hiển thị toàn trang, không để khoảng trống vô nghĩa) */
          <main className="flex-1 w-full min-w-0 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 pb-20 md:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start w-full">
              {/* Left Column (8 cols): Player + Details */}
              <div className="lg:col-span-8 min-w-0 w-full space-y-3">
                {currentVideo && (
                  <>
                    <CustomArtPlayer
                      video={currentVideo}
                      themeMode={themeMode}
                      timestampBookmarks={timestampBookmarks}
                      onProgressUpdate={handleProgressUpdate}
                      onQuickBookmarkTime={handleQuickBookmarkFromPlayer}
                      externalSeekTime={externalSeekTime}
                    />

                    <VideoDetails
                      video={currentVideo}
                      themeMode={themeMode}
                      progress={progressMap[currentVideo.id] || null}
                      isFavorite={favoriteIds.includes(currentVideo.id)}
                      timestampBookmarks={timestampBookmarks}
                      activeTag={activeCategory}
                      onToggleFavorite={handleToggleFavorite}
                      onAddTimestampBookmark={handleAddTimestampBookmark}
                      onRemoveTimestampBookmark={handleRemoveTimestampBookmark}
                      onTagClick={(tag) => {
                        setPlaylistTab('all');
                        setActiveCategory(tag);
                        handleGoHome();
                      }}
                      onSeekTo={handleSeekTo}
                      onResetProgress={handleResetProgress}
                    />
                  </>
                )}
              </div>

              {/* Right Column (4 cols): Playlist / Related Videos */}
              <div className="lg:col-span-4 min-w-0 w-full">
                <PlaylistSidebar
                  videos={filteredVideos}
                  allVideosCount={videos.length}
                  currentVideoId={currentVideo?.id || ''}
                  themeMode={themeMode}
                  progressMap={progressMap}
                  favoriteIds={favoriteIds}
                  watchHistory={watchHistory}
                  playlistTab={playlistTab}
                  searchQuery={searchQuery}
                  activeCategory={activeCategory}
                  isLoading={isLoading}
                  onPlaylistTabChange={setPlaylistTab}
                  onSelectVideo={handleSelectVideo}
                  onToggleFavorite={handleToggleFavorite}
                  onRemoveHistoryItem={handleRemoveHistoryItem}
                  onClearAllHistory={handleClearAllHistory}
                  onClearFilters={() => {
                    setSearchQuery('');
                    setActiveCategory('ALL');
                  }}
                />
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (Home, Favorites, History, Theme) */}
      <MobileBottomNav
        currentPage={currentPage}
        themeMode={themeMode}
        playlistTab={playlistTab}
        favoritesCount={favoriteIds.length}
        historyCount={watchHistory.length}
        onSelectTab={(tab) => {
          setPlaylistTab(tab);
          handleGoHome();
        }}
        onToggleTheme={handleToggleThemeMode}
      />

      {/* User Topic Manager Modal (Cấu hình phân loại chủ đề cho người dùng) */}
      <TopicManagerModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        topics={customTopics}
        allVideos={videos}
        themeMode={themeMode}
        onAddTopic={handleAddTopic}
        onRemoveTopic={handleRemoveTopic}
        onResetTopics={handleResetTopics}
      />

      {/* Toast Notification Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={themeMode}
      />
    </div>
  );
}
