import type { CSSProperties } from 'react';

export const tastingEventPreviewTheme = {
  colors: {
    mainCoral: '#EF9A6E',
    subCoral: '#E58257',
    bgGray: '#E6E6DD',
    brightGray: '#BFBFBF',
    mainGray: '#666666',
    textGray: '#C6C6C6',
    gray: '#2B2B2B',
    mainBlack: '#101010',
    mainDarkGray: '#252525',
    sectionWhite: '#F7F7F7',
  },
} as const;

export const tastingEventPreviewThemeStyle = {
  '--preview-main-coral': tastingEventPreviewTheme.colors.mainCoral,
  '--preview-sub-coral': tastingEventPreviewTheme.colors.subCoral,
  '--preview-bg-gray': tastingEventPreviewTheme.colors.bgGray,
  '--preview-bright-gray': tastingEventPreviewTheme.colors.brightGray,
  '--preview-main-gray': tastingEventPreviewTheme.colors.mainGray,
  '--preview-text-gray': tastingEventPreviewTheme.colors.textGray,
  '--preview-gray': tastingEventPreviewTheme.colors.gray,
  '--preview-main-black': tastingEventPreviewTheme.colors.mainBlack,
  '--preview-main-dark-gray': tastingEventPreviewTheme.colors.mainDarkGray,
  '--preview-section-white': tastingEventPreviewTheme.colors.sectionWhite,
} as CSSProperties;
