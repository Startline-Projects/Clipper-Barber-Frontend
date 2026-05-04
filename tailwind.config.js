 module.exports = {
   darkMode: 'class',
   content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
   presets: [require('nativewind/preset')],
   theme: {
     extend: {
       colors: {
         // Semantic colors — switch via CSS vars in global.css
         ink:               'var(--color-ink)',
         bg:                'var(--color-bg)',
         surface:           'var(--color-surface)',
         card:              'var(--color-card)',
         primary:           'var(--color-primary)',
         secondary:         'var(--color-secondary)',
         tertiary:          'var(--color-tertiary)',
         quaternary:        'var(--color-quaternary)',
         separator:         'var(--color-separator)',
         'separator-opaque':'var(--color-separator-opaque)',
         // Accent colors — same in both themes
         green:  '#30D158',
         red:    '#FF453A',
         orange: '#FF9F0A',
         purple: '#BF5AF2',
         blue:   '#0A84FF',
         yellow: '#FFD60A',
         teal:   '#64D2FF',
       },
       spacing: {
         xs: '4px',
         sm: '8px',
         md: '12px',
         lg: '16px',
         xl: '20px',
         xxl: '24px',
         xxxl: '32px',
       },
       borderRadius: {
         xs: '8px',
         sm: '12px',
         md: '16px',
         lg: '20px',
         xl: '24px',
         full: '999px',
       },
     },
   },
 };