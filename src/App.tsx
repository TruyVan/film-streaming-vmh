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
import {
  fetchVideos,
  fetchTopicsDb,
  addTopicDb,
  removeTopicDb,
  renameTopicDb,
  fetchFavoritesDb,
  toggleFavoriteDb,
  fetchWatchHistoryDb,
  createWatchSessionDb,
  updateWatchSessionProgressDb,
  clearAllWatchHistoryDb,
} from './lib/supabase';
import {
  addVideoTimestampBookmark,
  clearVideoProgress,
  formatSeconds,
  getAllVideoProgressMap,
  getVideoTimestampBookmarks,
  removeVideoTimestampBookmark,
} from './lib/progress';
import { Header } from './components/ui/Header';
import { YouTubeSidebar } from './components/ui/YouTubeSidebar';
import { HomeBentoGrid } from './components/ui/HomeBentoGrid';
import { CustomArtPlayer } from './components/player/CustomArtPlayer';
import { VideoDetails } from './components/ui/VideoDetails';
import { PlaylistSidebar } from './components/ui/PlaylistSidebar';
import { AdminDevPortal } from './components/ui/AdminDevPortal';
import { MobileBottomNav } from './components/ui/MobileBottomNav';

const THEME_STORAGE_KEY = 'film_theme_mode_v1';

// Chuẩn hóa chuỗi thành Slug URL chuẩn (vd: "Harry Potter" -> "harry-potter")
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export default function App() {
  // Dữ liệu Video từ Supabase (Không mock)
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentPage, setCurrentPage] = useState<'home' | 'watch' | 'admin'>('home');
  const currentWatchSessionIdRef = React.useRef<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string>('');

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [playlistTab, setPlaylistTab] = useState<PlaylistTab>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dữ liệu đồng bộ trực tiếp từ Supabase
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, VideoProgress>>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [timestampBookmarks, setTimestampBookmarks] = useState<TimestampBookmark[]>([]);
  const [externalSeekTime, setExternalSeekTime] = useState<{ time: number; nonce: number } | null>(null);

  // ==========================================
  // BỘ ĐIỀU HƯỚNG ROUTING TỰ ĐỘNG THEO SLUG URL
  // ==========================================
  const syncRouteFromLocation = useCallback(() => {
    if (typeof window === 'undefined') return;
    const { pathname, search } = window.location;
    const params = new URLSearchParams(search);
    const vId = params.get('v');

    if (pathname === '/admin') {
      setCurrentPage('admin');
      setIsSidebarOpen(false);
    } else if (vId || pathname === '/watch') {
      if (vId) setCurrentVideoId(vId);
      setCurrentPage('watch');
      setIsSidebarOpen(false);
    } else if (pathname === '/history') {
      setCurrentPage('home');
      setPlaylistTab('history');
      setActiveCategory('ALL');
    } else if (pathname === '/favorites' || pathname === '/bookmarked') {
      setCurrentPage('home');
      setPlaylistTab('favorites');
      setActiveCategory('ALL');
    } else if (pathname.startsWith('/tags/')) {
      const rawSlug = pathname.replace('/tags/', '').trim();
      setCurrentPage('home');
      setPlaylistTab('all');
      const matched = customTopics.find((t) => slugify(t) === rawSlug);
      setActiveCategory(matched || rawSlug);
    } else {
      setCurrentPage('home');
      setPlaylistTab('all');
      setActiveCategory('ALL');
    }
  }, [customTopics]);

  // Chuyển trang và cập nhật URL mượt mà
  const navigateTo = useCallback(
    (targetPath: string) => {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', targetPath);
        syncRouteFromLocation();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [syncRouteFromLocation]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('popstate', syncRouteFromLocation);
    return () => window.removeEventListener('popstate', syncRouteFromLocation);
  }, [syncRouteFromLocation]);

  useEffect(() => {
    syncRouteFromLocation();
  }, [syncRouteFromLocation]);

  // ==========================================
  // TẢI TOÀN BỘ DỮ LIỆU TỪ SUPABASE (PROMISE.ALL)
  // ==========================================
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      fetchVideos(),
      fetchTopicsDb(),
      fetchFavoritesDb(),
      fetchWatchHistoryDb(),
    ])
      .then(([videosRes, topics, favs, history]) => {
        if (!isMounted) return;
        const loadedVideos = videosRes.videos || [];
        setVideos(loadedVideos);
        setCustomTopics(topics);
        setFavoriteIds(favs);
        setWatchHistory(history);
        setIsLoading(false);

        // Kiểm tra link xem video nếu có sẵn trên URL
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const requestedId = params.get('v');
          if (requestedId && loadedVideos.some((v) => v.id === requestedId)) {
            setCurrentVideoId(requestedId);
            setCurrentPage('watch');
          } else if (loadedVideos.length > 0) {
            setCurrentVideoId(loadedVideos[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Lỗi khi nạp dữ liệu Supabase:', err);
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

  useEffect(() => {
    if (currentPage !== 'watch' || !currentVideoId) return;
    setTimestampBookmarks(getVideoTimestampBookmarks(currentVideoId));
  }, [currentPage, currentVideoId]);

  // ==========================================
  // CÁC HÀM XỬ LÝ NGHIỆP VỤ (ĐÃ ĐỒNG BỘ SUPABASE)
  // ==========================================
  const handleToggleThemeMode = useCallback(() => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {}
      }
      return next;
    });
  }, []);

  const handleAddTopic = useCallback(async (topic: string) => {
    await addTopicDb(topic);
    setCustomTopics((prev) => (prev.includes(topic) ? prev : [...prev, topic]));
  }, []);

  const handleRemoveTopic = useCallback(async (topic: string) => {
    await removeTopicDb(topic);
    setCustomTopics((prev) => prev.filter((t) => t.toLowerCase() !== topic.toLowerCase()));
    setActiveCategory((prev) => (prev.toLowerCase() === topic.toLowerCase() ? 'ALL' : prev));
  }, []);

  const handleRenameTopic = useCallback(
    async (oldName: string, newName: string) => {
      const cleanOld = oldName.trim();
      const cleanNew = newName.trim();
      if (!cleanOld || !cleanNew || cleanOld.toLowerCase() === cleanNew.toLowerCase()) return;

      await renameTopicDb(cleanOld, cleanNew);

      // Cập nhật customTopics
      setCustomTopics((prev) =>
        prev.map((t) => (t.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : t))
      );

      // Cập nhật videos state
      setVideos((prev) =>
        prev.map((v) => {
          if ((v.tags || []).some((t) => t.toLowerCase() === cleanOld.toLowerCase())) {
            return {
              ...v,
              tags: (v.tags || []).map((t) =>
                t.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : t
              ),
            };
          }
          return v;
        })
      );
    },
    []
  );

  const handleResetTopics = useCallback(async () => {
    await addTopicDb('Harry Potter');
    await addTopicDb('Phim Hay');
    setCustomTopics(['Harry Potter', 'Phim Hay']);
  }, []);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (currentPage !== 'home') {
        navigateTo('/');
      }
    },
    [currentPage, navigateTo]
  );

  const handleSelectVideo = useCallback(
    (video: Video) => {
      // Reset phiên xem cũ khi đổi phim
      currentWatchSessionIdRef.current = null;
      setCurrentVideoId(video.id);
      navigateTo(`/watch?v=${video.id}`);
    },
    [navigateTo]
  );

  const handleSelectSidebarItem = useCallback(
    (tab: PlaylistTab, category?: string) => {
      if (tab === 'favorites') {
        navigateTo('/favorites');
      } else if (tab === 'history') {
        navigateTo('/history');
      } else if (category && category !== 'ALL') {
        navigateTo(`/tags/${slugify(category)}`);
      } else {
        navigateTo('/');
      }
    },
    [navigateTo]
  );

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const availableVideos = videos.filter((v) => !v.deleted_at);

    let baseList: Video[] = [];
    if (playlistTab === 'favorites') {
      baseList = favoriteIds
        .map((id) => availableVideos.find((v) => v.id === id))
        .filter((v): v is Video => Boolean(v));
    } else if (playlistTab === 'history') {
      baseList = watchHistory
        .map((h) => availableVideos.find((v) => v.id === h.videoId))
        .filter((v): v is Video => Boolean(v));
    } else {
      baseList = availableVideos;
    }

    return baseList.filter((video) => {
      const matchesCategory =
        playlistTab !== 'all' ||
        activeCategory === 'ALL' ||
        (video.tags || []).some(
          (t) =>
            t.toLowerCase() === activeCategory.toLowerCase() ||
            slugify(t) === slugify(activeCategory)
        );

      if (!matchesCategory) return false;
      if (!q) return true;

      const inTitle = video.title.toLowerCase().includes(q);
      const inTags = (video.tags || []).some((t) => t.toLowerCase().includes(q));
      return inTitle || inTags;
    });
  }, [videos, playlistTab, favoriteIds, watchHistory, searchQuery, activeCategory]);

  const currentVideo = useMemo(() => {
    return (
      videos.find((v) => v.id === currentVideoId) ||
      filteredVideos[0] ||
      videos[0]
    );
  }, [videos, currentVideoId, filteredVideos]);

  // Chuỗi phim thuộc cùng Phân Loại với phim đang xem (để xem liền mạch từ Tập 1 -> Tập N)
  const seriesVideos = useMemo(() => {
    if (!currentVideo) return [];
    const currentCategory =
      currentVideo.tags && currentVideo.tags.length > 0 ? currentVideo.tags[0] : '';
    const available = videos.filter((v) => !v.deleted_at);

    let list = available;
    if (currentCategory) {
      const matched = available.filter((v) =>
        (v.tags || []).some(
          (t) =>
            t.toLowerCase() === currentCategory.toLowerCase() ||
            slugify(t) === slugify(currentCategory)
        )
      );
      if (matched.length > 0) list = matched;
    }

    // Sắp xếp theo sort_order nếu có, fallback theo ngày phát hành / ngày tạo cũ nhất -> mới nhất (Tập 1 -> Tập N)
    return [...list].sort((a, b) => {
      if (
        typeof a.sort_order === 'number' &&
        typeof b.sort_order === 'number' &&
        a.sort_order !== b.sort_order
      ) {
        return a.sort_order - b.sort_order;
      }
      const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createA - createB;
    });
  }, [videos, currentVideo]);

  const lastSavedHistoryTimeRef = React.useRef<number>(0);

  const handleProgressUpdate = useCallback(
    async (updated: VideoProgress) => {
      setProgressMap((prev) => ({
        ...prev,
        [updated.videoId]: updated,
      }));
  
      if (updated.currentTime < 3) return;
  
      if (!currentWatchSessionIdRef.current) {
        const newSessionId = await createWatchSessionDb(
          updated.videoId,
          updated.currentTime,
          formatSeconds(updated.duration)
        );
        currentWatchSessionIdRef.current = newSessionId;
        lastSavedHistoryTimeRef.current = updated.currentTime;
        const history = await fetchWatchHistoryDb();
        setWatchHistory(history);
      } else {
        const timeDiff = Math.abs(updated.currentTime - lastSavedHistoryTimeRef.current);
        if (timeDiff >= 15) {
          lastSavedHistoryTimeRef.current = updated.currentTime;
          await updateWatchSessionProgressDb(
            currentWatchSessionIdRef.current,
            updated.currentTime
          );
        }
      }
    },
    []
  );

  const handleResetProgress = useCallback((videoId: string) => {
    clearVideoProgress(videoId);
    setProgressMap((prev) => {
      const next = { ...prev };
      delete next[videoId];
      return next;
    });
    setExternalSeekTime({ time: 0, nonce: Date.now() });
  }, []);

  const handleToggleFavorite = useCallback(
    async (videoId: string) => {
      const isFav = favoriteIds.includes(videoId);
      await toggleFavoriteDb(videoId, isFav);
      setFavoriteIds((prev) =>
        isFav ? prev.filter((id) => id !== videoId) : [...prev, videoId]
      );
    },
    [favoriteIds]
  );

  const handleRemoveHistoryItem = useCallback((videoId: string) => {
    setWatchHistory((prev) => prev.filter((h) => h.videoId !== videoId));
  }, []);

  const handleClearAllHistory = useCallback(async () => {
    await clearAllWatchHistoryDb();
    setWatchHistory([]);
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
      const next = addVideoTimestampBookmark(currentVideo.id, currentTime, label);
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
    if (updated.deleted_at === 'permanently_deleted') {
      setVideos((prev) => prev.filter((v) => v.id !== updated.id));
    } else {
      setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    }
  }, []);

  const isLight = themeMode === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${
        isLight ? 'bg-[#FAF7F9] text-slate-900' : 'bg-[#0f0f0f] text-zinc-100'
      }`}
    >
      <Header
        themeMode={themeMode}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onGoHome={() => {
          setSearchQuery('');
          navigateTo('/');
        }}
        videos={videos}
        customTopics={customTopics}
        onSearchSubmit={handleSearchSubmit}
        onSelectVideo={handleSelectVideo}
        onSelectCategory={(cat) => {
          navigateTo(`/tags/${slugify(cat)}`);
        }}
      />

      <div className="flex-1 flex w-full">
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
          onSelectHomeTab={handleSelectSidebarItem}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onOpenDevManage={() => navigateTo('/admin')}
        />

        {currentPage === 'admin' ? (
          <AdminDevPortal
            themeMode={themeMode}
            videos={videos}
            customTopics={customTopics}
            isLoading={isLoading}
            onVideoAdded={handleVideoAdded}
            onVideoUpdated={handleVideoUpdated}
            onAddTopic={handleAddTopic}
            onRemoveTopic={handleRemoveTopic}
            onRenameTopic={handleRenameTopic}
            onVideosReordered={(updated) => setVideos(updated)}
            onGoHome={() => navigateTo('/')}
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
            onSelectVideo={handleSelectVideo}
            onToggleFavorite={handleToggleFavorite}
            onPlaylistTabChange={(tab) => {
              if (tab === 'favorites') navigateTo('/favorites');
              else if (tab === 'history') navigateTo('/history');
              else navigateTo('/');
            }}
            onCategoryChange={(cat) => {
              if (cat === 'ALL') navigateTo('/');
              else navigateTo(`/tags/${slugify(cat)}`);
            }}
            onRemoveHistoryItem={handleRemoveHistoryItem}
            onClearAllHistory={handleClearAllHistory}
            onClearFilters={() => navigateTo('/')}
          />
        ) : (
          <main className="flex-1 w-full min-w-0 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 pb-20 md:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start w-full">
              <div className="lg:col-span-8 min-w-0 w-full space-y-3">
                {currentVideo && (() => {
                  const currentIndex = seriesVideos.findIndex((v) => v.id === currentVideo.id);
                  const hasPrev = currentIndex > 0;
                  const hasNext = currentIndex >= 0 && currentIndex < seriesVideos.length - 1;
                
                  return (
                    <>
                      <CustomArtPlayer
                        video={currentVideo}
                        themeMode={themeMode}
                        timestampBookmarks={timestampBookmarks}
                        onProgressUpdate={handleProgressUpdate}
                        onQuickBookmarkTime={handleQuickBookmarkFromPlayer}
                        externalSeekTime={externalSeekTime}
                        hasPrev={hasPrev}
                        hasNext={hasNext}
                        onPrevVideo={() => {
                          if (hasPrev) handleSelectVideo(seriesVideos[currentIndex - 1]);
                        }}
                        onNextVideo={() => {
                          if (hasNext) handleSelectVideo(seriesVideos[currentIndex + 1]);
                        }}
                        onEndedNext={() => {
                          if (hasNext) handleSelectVideo(seriesVideos[currentIndex + 1]);
                        }}
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
                        onTagClick={(tag) => navigateTo(`/tags/${slugify(tag)}`)}
                        onSeekTo={handleSeekTo}
                        onResetProgress={handleResetProgress}
                      />
                    </>
                  );
                })()}
              </div>

              <div className="lg:col-span-4 min-w-0 w-full">
                <PlaylistSidebar
                  videos={seriesVideos}
                  allVideosCount={videos.length}
                  currentVideoId={currentVideo?.id || ''}
                  themeMode={themeMode}
                  progressMap={progressMap}
                  favoriteIds={favoriteIds}
                  watchHistory={watchHistory}
                  playlistTab={playlistTab}
                  searchQuery={searchQuery}
                  activeCategory={activeCategory}
                  categoryName={
                    currentVideo?.tags && currentVideo.tags.length > 0
                      ? currentVideo.tags[0]
                      : undefined
                  }
                  isLoading={isLoading}
                  onPlaylistTabChange={(tab) => {
                    if (tab === 'favorites') navigateTo('/favorites');
                    else if (tab === 'history') navigateTo('/history');
                    else navigateTo('/');
                  }}
                  onSelectVideo={handleSelectVideo}
                  onToggleFavorite={handleToggleFavorite}
                  onRemoveHistoryItem={handleRemoveHistoryItem}
                  onClearAllHistory={handleClearAllHistory}
                  onClearFilters={() => navigateTo('/')}
                  onGoHome={() => navigateTo('/')}
                />
              </div>
            </div>
          </main>
        )}
      </div>

      <MobileBottomNav
        currentPage={currentPage}
        themeMode={themeMode}
        playlistTab={playlistTab}
        favoritesCount={favoriteIds.length}
        historyCount={watchHistory.length}
        onSelectTab={(tab) => {
          if (tab === 'favorites') navigateTo('/favorites');
          else if (tab === 'history') navigateTo('/history');
          else navigateTo('/');
        }}
        onToggleTheme={handleToggleThemeMode}
      />

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
