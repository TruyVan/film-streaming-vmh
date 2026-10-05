const TOPICS_STORAGE_KEY = 'partystream_custom_topics_v1';

export const DEFAULT_TOPICS: string[] = [
  'Teambuilding',
  'Gala Dinner',
  'Karaoke',
  'Live Band',
  'Phú Quốc',
  'Đà Lạt',
  'Hackathon',
  'Sự kiện',
];

export function getCustomTopics(): string[] {
  if (typeof window === 'undefined') return DEFAULT_TOPICS;
  try {
    const raw = window.localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!raw) return DEFAULT_TOPICS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((t) => String(t).trim()).filter(Boolean);
    }
    return DEFAULT_TOPICS;
  } catch {
    return DEFAULT_TOPICS;
  }
}

export function saveCustomTopics(topics: string[]): string[] {
  const clean = Array.from(new Set(topics.map((t) => t.trim()).filter(Boolean)));
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Ignore localStorage errors
    }
  }
  return clean;
}

export function addCustomTopic(topic: string): string[] {
  const trimmed = topic.trim();
  if (!trimmed) return getCustomTopics();
  const current = getCustomTopics();
  if (current.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }
  const next = [...current, trimmed];
  return saveCustomTopics(next);
}

/**
 * Xóa chủ đề: Chỉ loại bỏ danh mục phân loại này, toàn bộ video vẫn được giữ nguyên và KHÔNG bị xóa.
 */
export function removeCustomTopic(topic: string): string[] {
  const current = getCustomTopics();
  const next = current.filter((t) => t.toLowerCase() !== topic.toLowerCase());
  return saveCustomTopics(next);
}

export function resetCustomTopicsToDefault(): string[] {
  return saveCustomTopics(DEFAULT_TOPICS);
}
