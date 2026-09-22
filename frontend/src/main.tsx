import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { queryClient } from './lib/query-client.ts';


const rootElement = document.querySelector('#root') as Element;
if (!rootElement.innerHTML) {
  createRoot(rootElement).render(
    <StrictMode>
      <Suspense fallback="loading">
        <QueryClientProvider client={queryClient}>
          <App />
          <TanStackDevtools
            plugins={[
              {
                name: 'TanStack Query',
                render: <ReactQueryDevtoolsPanel />,
              },
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />        </QueryClientProvider>
      </Suspense>
    </StrictMode>,
  );
}
