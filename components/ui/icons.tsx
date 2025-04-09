import React from 'react';
import { Feather } from '@expo/vector-icons';

interface IconProps {
  size: number;
  color: string;
}

// Export icon components for consistent usage across the app
export const HomeIcon = ({ size, color }: IconProps) => <Feather name="home" size={size} color={color} />;
export const CalendarIcon = ({ size, color }: IconProps) => <Feather name="calendar" size={size} color={color} />;
export const BellIcon = ({ size, color }: IconProps) => <Feather name="bell" size={size} color={color} />;
export const UserIcon = ({ size, color }: IconProps) => <Feather name="user" size={size} color={color} />;
export const ClockIcon = ({ size, color }: IconProps) => <Feather name="clock" size={size} color={color} />;
export const PlusIcon = ({ size, color }: IconProps) => <Feather name="plus" size={size} color={color} />;
export const CheckCircleIcon = ({ size, color }: IconProps) => <Feather name="check-circle" size={size} color={color} />;
export const ChevronRightIcon = ({ size, color }: IconProps) => <Feather name="chevron-right" size={size} color={color} />;
export const TrashIcon = ({ size, color }: IconProps) => <Feather name="trash-2" size={size} color={color} />;
export const DragIcon = ({ size, color }: IconProps) => <Feather name="menu" size={size} color={color} />;
export const SettingsIcon = ({ size, color }: IconProps) => <Feather name="settings" size={size} color={color} />;
export const ChevronLeftIcon = ({ size, color }: IconProps) => <Feather name="chevron-left" size={size} color={color} />;
