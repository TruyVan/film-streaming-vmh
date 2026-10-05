'use client';

import React from 'react';
import App from '../src/App';

/**
 * Route chính `/` của Next.js App Router.
 * Hỗ trợ query parameter `/?v=[video_id]` để chia sẻ trực tiếp link video sự kiện.
 */
export default function HomePage() {
  return <App />;
}
