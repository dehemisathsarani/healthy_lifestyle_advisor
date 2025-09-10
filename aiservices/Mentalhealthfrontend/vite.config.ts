// This is a simplified version of vite.config.ts that doesn't require dependencies
// In a real project, you would run npm install to install dependencies

const defineConfig = (config: any) => config;

// Mock React plugin
const react = () => ({
  name: 'mock-react-plugin'
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175
  },
  // Mock build options
  build: {
    outDir: 'dist',
    minify: 'esbuild',
  }
});
