import type { Config } from 'tailwindcss';

darkMode: 'class'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pinklove: '#ff3b81',
      },
    },
  },
  plugins: [],
};
export default config;
