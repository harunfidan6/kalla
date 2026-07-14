import React from 'react';
import Svg, { Path, Circle, Rect, Line, SvgProps } from 'react-native-svg';

export interface KallaIconProps extends SvgProps {
  size?: number;
  color?: string;
}

export const LogoSvg: React.FC<KallaIconProps> = ({ size = 120, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none" {...props}>
    <Path d="M 50,8 C 25,12 15,32 15,50 C 15,68 25,88 50,92" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M 50,8 C 75,12 85,32 85,50 C 85,68 75,88 50,92" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M 50,92 C 50,85 52,72 52,65" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M 52,65 C 65,65 72,55 65,45 C 62,40 55,40 50,45 C 45,40 38,40 35,45 C 28,55 35,65 48,65 C 48,72 50,85 50,92" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M 50,8 C 50,18 48,25 48,32" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M 48,32 C 48,38 52,38 52,44" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BasketIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="3" y="10" width="18" height="3" rx="1.5" />
    <Path d="M5,13 L6.5,21 L17.5,21 L19,13" />
    <Line x1="9" y1="15" x2="9" y2="19" />
    <Line x1="12" y1="15" x2="12" y2="19" />
    <Line x1="15" y1="15" x2="15" y2="19" />
    <Path d="M7,10 L12,4 L17,10" />
  </Svg>
);

export const GelAlIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Circle cx="5" cy="8" r="2.5" />
    <Path d="M1,16 C1,13 3,12.5 5,12.5" />
    <Rect x="15" y="10" width="8" height="11" rx="1" />
    <Path d="M14,10 C14,8.5 16,7.5 19,7.5 C22,7.5 24,8.5 24,10 Z" />
    <Rect x="18" y="15" width="3" height="6" />
    <Path d="M8,12 L11,12 M10,10 L12,12 L10,14" />
    <Rect x="7" y="15" width="4" height="4" rx="1" />
    <Path d="M8,15 C8,13.5 10,13.5 10,15" />
  </Svg>
);

export const PaketIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M12,6 L18,9 L12,12 L6,9 Z" />
    <Path d="M6,9 L6,17 L12,20 L12,12 Z" />
    <Path d="M18,9 L18,17 L12,20 L12,12 Z" />
    <Line x1="2" y1="9" x2="4" y2="9" />
    <Line x1="1" y1="12" x2="3" y2="12" />
    <Line x1="2" y1="15" x2="4" y2="15" />
    <Path d="M19,13 L21,13 L23,15 L23,17 L21,17" />
    <Circle cx="20.5" cy="18.5" r="1.5" />
  </Svg>
);

export const OdemeIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="9" x2="22" y2="9" />
    <Rect x="5" y="12" width="4" height="3" rx="0.5" />
    <Line x1="13" y1="13" x2="18" y2="13" />
    <Line x1="13" y1="15" x2="16" y2="15" />
  </Svg>
);

export const AramaIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Circle cx="10" cy="10" r="6" />
    <Line x1="14.5" y1="14.5" x2="21" y2="21" />
    <Path d="M8,6 C9,5.5 11,6 12,7" strokeWidth="1.5" opacity={0.6} />
  </Svg>
);

export const HesabimIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Circle cx="12" cy="7" r="4" />
    <Path d="M9.5,4.5 C10.5,3.5 13.5,3.5 14.5,4.5" />
    <Path d="M5,19 C5,15 8,13 12,13 C16,13 19,15 19,19" />
  </Svg>
);

export const FavorilerimIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M12,21.35 L10.55,20.03 C5.4,15.36 2,12.28 2,8.5 C2,5.42 4.42,3 7.5,3 C9.24,3 10.91,3.81 12,5.09 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.42 22,8.5 C22,12.28 18.6,15.36 13.45,20.04 L12,21.35 Z" />
  </Svg>
);

export const MenuIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="4" y="3" width="16" height="18" rx="2" />
    <Line x1="8" y1="3" x2="8" y2="21" />
    <Path d="M11,12 C11,14 13,14 15,14 C17,14 17,12 17,11" />
    <Line x1="12" y1="15" x2="16" y2="15" />
    <Path d="M17,12 C18,12 18.5,13 17,13.5" />
    <Path d="M13,9 C13,8 14,8 14,7" strokeWidth="1.5" />
    <Path d="M15,9 C15,8 16,8 16,7" strokeWidth="1.5" />
  </Svg>
);

export const Menu2Icon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M12,5 L12,19" />
    <Path d="M12,5 C9,3 4,4 3,5 L3,18 C4,17 9,16 12,19" />
    <Path d="M12,5 C15,3 20,4 21,5 L21,18 C20,17 15,16 12,19" />
    <Line x1="5" y1="8" x2="9" y2="8" strokeWidth="1.5" />
    <Line x1="5" y1="11" x2="10" y2="11" strokeWidth="1.5" />
    <Line x1="5" y1="14" x2="8" y2="14" strokeWidth="1.5" />
    <Rect x="14" y="11" width="4" height="3" rx="1" />
    <Path d="M18,12 C19,12 19.5,12.5 18,13" />
    <Line x1="14" y1="15" x2="18" y2="15" />
    <Path d="M15,9 Q15.5,8 16,9" strokeWidth="1" />
  </Svg>
);

export const IletisimIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M21,15 C21,16.1 20.1,17 19,17 L7,17 L3,21 L3,5 C3,3.9 3.9,3 5,3 L19,3 C20.1,3 21,3.9 21,5 Z" />
    <Line x1="7" y1="7" x2="17" y2="7" strokeWidth="1.5" />
    <Line x1="7" y1="10" x2="17" y2="10" strokeWidth="1.5" />
    <Line x1="7" y1="13" x2="13" y2="13" strokeWidth="1.5" />
  </Svg>
);

export const SubelerimizIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M12,2 C8.13,2 5,5.13 5,9 C5,14.25 12,22 12,22 C12,22 19,14.25 19,9 C19,5.13 15.87,2 12,2 Z" />
    <Circle cx="12" cy="9" r="3" />
  </Svg>
);

// ==== Bottom tab bar icons — paths copied 1:1 from Kalla Staff Demo.dc.html's tab bar SVGs ====

export const TabKanbanIcon: React.FC<KallaIconProps> = ({ size = 15, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="3" y="4" width="5" height="16" rx="1" />
    <Rect x="10" y="4" width="5" height="10" rx="1" />
    <Rect x="17" y="4" width="5" height="7" rx="1" />
  </Svg>
);

export const TabShiftsIcon: React.FC<KallaIconProps> = ({ size = 15, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="3" y1="10" x2="21" y2="10" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="16" y1="2" x2="16" y2="6" />
  </Svg>
);

export const TabSalesIcon: React.FC<KallaIconProps> = ({ size = 15, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="9" x2="22" y2="9" />
    <Rect x="5" y="12" width="4" height="3" rx="0.5" />
  </Svg>
);

export const TabTrainingIcon: React.FC<KallaIconProps> = ({ size = 15, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M4,5 C4,4 5,3.5 7,3.5 C9,3.5 11,4.2 12,5 C13,4.2 15,3.5 17,3.5 C19,3.5 20,4 20,5 L20,18 C20,17 19,16.5 17,16.5 C15,16.5 13,17.2 12,18 C11,17.2 9,16.5 7,16.5 C5,16.5 4,17 4,18 Z" />
    <Line x1="12" y1="5" x2="12" y2="18" />
  </Svg>
);

export const TabRecipesIcon: React.FC<KallaIconProps> = ({ size = 15, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M4,4 C4,3.4 4.4,3 5,3 L16,3 C17.7,3 19,4.3 19,6 L19,21 L5,21 C4.4,21 4,20.6 4,20 Z" />
    <Path d="M19,17 L7,17 C5.9,17 5,17.9 5,19 C5,20.1 5.9,21 7,21" />
    <Line x1="8" y1="7" x2="15" y2="7" strokeWidth="1.5" />
    <Line x1="8" y1="10.5" x2="13" y2="10.5" strokeWidth="1.5" />
  </Svg>
);

export const HikayesiIcon: React.FC<KallaIconProps> = ({ size = 24, color = '#87A99C', ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Circle cx="12" cy="12" r="2" />
    <Path d="M12,7 C14.5,7 16.5,8.5 16.8,11 C17.1,13.5 15,16 12,16.5 C9,17 7.5,14.5 7.2,12.5 C6.9,10.5 9.5,7 12,7 Z" />
    <Path d="M12,4 C16.5,4 19.5,7 19.8,11.5 C20.1,16 16.5,20 12,20 C7.5,20 4.2,16 4.2,11.5 C4.2,7 7.5,4 12,4 Z" />
    <Path d="M12,1 C18,1 22.5,5.5 22.8,12 C23.1,18.5 18,23 12,23 C6,23 1.2,18 1.2,12 C1.2,6 6,1 12,1 Z" />
  </Svg>
);
