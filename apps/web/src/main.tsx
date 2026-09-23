import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { store } from './store';
import { queryClient } from './lib/query-client';
import App from './App';
import './index.css';

const rootElement = document.querySelector('#root') as Element;
if (!rootElement.innerHTML) {
  createRoot(rootElement).render(
    <StrictMode>
      <Suspense fallback="loading">
        <Provider store={store}>
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
            />
          </QueryClientProvider>
        </Provider>
      </Suspense>
    </StrictMode>,
  );
}