import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/

// Note - I added the server config because we need to use caddy locally to proxy https
// Facebook requires the logins to come from an https hosted domain. But the HMR channel
// does not need to be wss, so force HMR to bypass the proxy using explicit config
export default defineConfig({
  plugins: [reactRefresh()],
  server: {
    port: 3000,
    hmr: {
      port: 3000,
      protocol: 'ws'
    }
  }
})