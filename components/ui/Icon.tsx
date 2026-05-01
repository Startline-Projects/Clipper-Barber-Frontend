import React from 'react';
import Svg, {
  Path,
  Line,
  Polyline,
  Polygon,
  Circle,
  Rect,
} from 'react-native-svg';
import { useColors } from '@/lib/theme/colors';

export type IconName =
  | 'home'
  | 'calendar'
  | 'bookings'
  | 'chat'
  | 'more'
  | 'bell'
  | 'back'
  | 'loop'
  | 'check'
  | 'x'
  | 'plus'
  | 'scissors'
  | 'dollar'
  | 'user'
  | 'star'
  | 'starOutline'
  | 'clock'
  | 'send'
  | 'chevron'
  | 'settings'
  | 'map'
  | 'camera'
  | 'card'
  | 'shield'
  | 'bank'
  | 'alert'
  | 'external'
  | 'image'
  | 'trash'
  | 'search'
  | 'close'
  | 'info'
  | 'link'
  | 'location';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 22, color, strokeWidth }: IconProps) {
  const colors = useColors();
  const c = color ?? colors.primary;
  const sw = strokeWidth ?? defaultStrokeWidth[name] ?? 1.8;

  const icon = getIcon(name, c, sw);
  if (!icon) return null;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon}
    </Svg>
  );
}

const defaultStrokeWidth: Partial<Record<IconName, number>> = {
  back: 2.2,
  loop: 2.2,
  check: 2.5,
  x: 2.2,
  plus: 2.2,
  send: 2.2,
  dollar: 2,
  chevron: 2,
  starOutline: 1.6,
};

function getIcon(name: IconName, color: string, _sw: number) {
  switch (name) {
    case 'home':
      return (
        <>
          <Path d="M3 10.5L12 3l9 7.5V20a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <Polyline points="9 22 9 12 15 12 15 22" />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={3} y={4} width={18} height={18} rx={2.5} />
          <Line x1={16} y1={2} x2={16} y2={6} />
          <Line x1={8} y1={2} x2={8} y2={6} />
          <Line x1={3} y1={10} x2={21} y2={10} />
        </>
      );
    case 'bookings':
      return (
        <>
          <Path d="M14.5 2H6.5a2.5 2.5 0 00-2.5 2.5v15a2.5 2.5 0 002.5 2.5h11a2.5 2.5 0 002.5-2.5V7.5z" />
          <Polyline points="14 2 14 8 20 8" />
          <Line x1={16} y1={13} x2={8} y2={13} />
          <Line x1={16} y1={17} x2={8} y2={17} />
        </>
      );
    case 'chat':
      return <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
    case 'more':
      return (
        <>
          <Circle cx={12} cy={5.5} r={1} fill={color} stroke="none" />
          <Circle cx={12} cy={12} r={1} fill={color} stroke="none" />
          <Circle cx={12} cy={18.5} r={1} fill={color} stroke="none" />
        </>
      );
    case 'bell':
      return (
        <>
          <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path d="M13.73 21a2 2 0 01-3.46 0" />
        </>
      );
    case 'back':
      return <Polyline points="15 18 9 12 15 6" />;
    case 'loop':
      return (
        <Path d="M21 2v6h-6M3 12a9 9 0 0115.36-6.36L21 8M3 22v-6h6M21 12a9 9 0 01-15.36 6.36L3 16" />
      );
    case 'check':
      return <Polyline points="6 12 10 16 18 8" />;
    case 'x':
      return (
        <>
          <Line x1={18} y1={6} x2={6} y2={18} />
          <Line x1={6} y1={6} x2={18} y2={18} />
        </>
      );
    case 'plus':
      return (
        <>
          <Line x1={12} y1={5} x2={12} y2={19} />
          <Line x1={5} y1={12} x2={19} y2={12} />
        </>
      );
    case 'scissors':
      return (
        <>
          <Circle cx={6} cy={6} r={3} />
          <Circle cx={6} cy={18} r={3} />
          <Line x1={20} y1={4} x2={8.12} y2={15.88} />
          <Line x1={14.47} y1={14.48} x2={20} y2={20} />
          <Line x1={8.12} y1={8.12} x2={12} y2={12} />
        </>
      );
    case 'dollar':
      return (
        <>
          <Line x1={12} y1={1} x2={12} y2={23} />
          <Path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </>
      );
    case 'user':
      return (
        <>
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <Circle cx={12} cy={7} r={4} />
        </>
      );
    case 'star':
      return (
        <Polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill={color}
          stroke="none"
        />
      );
    case 'starOutline':
      return (
        <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      );
    case 'clock':
      return (
        <>
          <Circle cx={12} cy={12} r={10} />
          <Polyline points="12 6 12 12 16 14" />
        </>
      );
    case 'send':
      return (
        <>
          <Line x1={22} y1={2} x2={11} y2={13} />
          <Polygon points="22 2 15 22 11 13 2 9 22 2" />
        </>
      );
    case 'chevron':
      return <Polyline points="9 18 15 12 9 6" />;
    case 'settings':
      return (
        <>
          <Circle cx={12} cy={12} r={3} />
          <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </>
      );
    case 'map':
      return (
        <>
          <Path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
          <Circle cx={12} cy={10} r={3} />
        </>
      );
    case 'camera':
      return (
        <>
          <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <Circle cx={12} cy={13} r={4} />
        </>
      );
    case 'card':
      return (
        <>
          <Rect x={2} y={5} width={20} height={14} rx={2} />
          <Line x1={2} y1={10} x2={22} y2={10} />
        </>
      );
    case 'shield':
      return <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
    case 'bank':
      return (
        <>
          <Line x1={3} y1={22} x2={21} y2={22} />
          <Line x1={6} y1={18} x2={6} y2={11} />
          <Line x1={10} y1={18} x2={10} y2={11} />
          <Line x1={14} y1={18} x2={14} y2={11} />
          <Line x1={18} y1={18} x2={18} y2={11} />
          <Polygon points="12 2 20 7 4 7 12 2" />
        </>
      );
    case 'alert':
      return (
        <>
          <Circle cx={12} cy={12} r={10} />
          <Line x1={12} y1={8} x2={12} y2={12} />
          <Line x1={12} y1={16} x2={12.01} y2={16} />
        </>
      );
    case 'external':
      return (
        <>
          <Path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <Polyline points="15 3 21 3 21 9" />
          <Line x1={10} y1={14} x2={21} y2={3} />
        </>
      );
    case 'image':
      return (
        <>
          <Rect x={3} y={3} width={18} height={18} rx={2} />
          <Circle cx={8.5} cy={8.5} r={1.5} />
          <Polyline points="21 15 16 10 5 21" />
        </>
      );
    case 'trash':
      return (
        <>
          <Polyline points="3 6 5 6 21 6" />
          <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          <Line x1={10} y1={11} x2={10} y2={17} />
          <Line x1={14} y1={11} x2={14} y2={17} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx={11} cy={11} r={8} />
          <Line x1={21} y1={21} x2={16.65} y2={16.65} />
        </>
      );
    case 'close':
      return (
        <>
          <Line x1={18} y1={6} x2={6} y2={18} />
          <Line x1={6} y1={6} x2={18} y2={18} />
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx={12} cy={12} r={10} />
          <Line x1={12} y1={16} x2={12} y2={12} />
          <Line x1={12} y1={8} x2={12.01} y2={8} />
        </>
      );
    case 'link':
      return (
        <>
          <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </>
      );
    case 'location':
      return (
        <>
          <Path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
          <Circle cx={12} cy={10} r={3} />
        </>
      );
    default:
      return null;
  }
}
