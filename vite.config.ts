import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import windiCSS from 'vite-plugin-windicss'
import tsConfigPath from 'vite-tsconfig-paths'

export default defineConfig(
    env => ({
        plugins: [
            // only use react-fresh
            env.mode === 'development' && react(),
            tsConfigPath(),
            windiCSS(),
            VitePWA({
                injectRegister: 'inline',
                manifest: {
                    icons: [{
                        src: 'src/assets/MerlinClash.icon',
                    },
                    {
                        src: 'src/assets/MerlinClash.icns',
                    },
                    ],
                    short_name: 'Merlin Clash',
                    name: 'Merlin Clash',
                },
            }),
        ],
        base: './',
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@use "sass:math"; @import "src/styles/variables.scss";',
                },
            },
        },
        build: { reportCompressedSize: false },
        esbuild: {
            jsxInject: "import React from 'react'",
        },
    }),
)
