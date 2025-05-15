import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import App from './App.tsx';

import './css/vars.css';
import './css/reset.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Home from './components/home/Home.tsx';
import History from './components/history/History.tsx';
import HydrateFallback from './components/common/HydrateFallback.tsx';

export interface ConversionData {
    id: string;
    filename: string;
    inputFormat: string;
    outputFormat: string;
    size: number;
    timestamp: string;
}

export const historyLoader = async (): Promise<ConversionData[]> => {
    await new Promise(resolve => {
        setTimeout(() => resolve(0), 500);
    });
    return [];
};

const router = createBrowserRouter([
    {
        path: '/',
        Component: App,
        children: [
            { index: true, Component: Home },
            {
                path: 'history',
                Component: History,
                loader: historyLoader,
            },
        ],
        HydrateFallback: HydrateFallback,
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
