import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        hogwarts: {
          midnight: '#05030c',
          gold: '#f6c667',
          emerald: '#1e6f5c',
        },
      },
    },
  },
  plugins: [],
};

export default config;
