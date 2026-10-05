declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    robots?: {
      index?: boolean;
      follow?: boolean;
      nocache?: boolean;
      noarchive?: boolean;
      nosnippet?: boolean;
      googleBot?: {
        index?: boolean;
        follow?: boolean;
        noarchive?: boolean;
        nosnippet?: boolean;
      };
    };
  }
}

declare module 'next/dynamic' {
  import type { ComponentType, ReactNode } from 'react';
  export interface DynamicOptions<P = {}> {
    ssr?: boolean;
    loading?: () => ReactNode;
  }
  export default function dynamic<P = {}>(
    loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
    options?: DynamicOptions<P>
  ): ComponentType<P>;
}
