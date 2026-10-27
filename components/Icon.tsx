import React from 'react';
import { Text, View } from 'react-native';
import {
  Sword, Briefcase, HardHat, Wheat, BookOpen, Church, Building2, Shield,
  Factory, Route, TrainTrack, Anchor, GraduationCap, Plus, HeartHandshake,
  Receipt, Eye, Scale, Scroll, Megaphone, Vote, UserX, Newspaper, Map,
  Handshake, Ban, Globe, Users, Ship, Banknote, Wallet, Landmark, Mountain,
  TrendingUp, TrendingDown, Package, Building, Home, Music, Flame, AlertTriangle,
  Crown, Swords, Flag, Mail, CloudRain, Sun, Droplet, Leaf, Lightbulb, Zap,
  Bus, Award, FlaskConical, Wifi, Heart, Star, Cpu, Coins, PieChart,
  ChevronRight, ChevronLeft, X, Check, ArrowRight, Settings, RotateCcw,
  Play, Pause, Plus as PlusIcon, Minus, Info, Bell, TrendingUp as TrendUp,
  type LucideIcon,
} from 'lucide-react-native';
import { COLORS } from './theme';

const MAP: Record<string, LucideIcon> = {
  Sword, Briefcase, HardHat, Wheat, BookOpen, Church, Building2, Shield,
  Factory, Route, TrainTrack, Anchor, GraduationCap, Plus, HeartHandshake,
  Receipt, Eye, Scale, Scroll, Megaphone, Vote, UserX, Newspaper, Map,
  Handshake, Ban, Globe, Users, Ship, Banknote, Wallet, Landmark, Mountain,
  TrendingUp, TrendingDown, Package, Building, Home, Music, Flame, AlertTriangle,
  Crown, Swords, Flag, Mail, CloudRain, Sun, Droplet, Leaf, Lightbulb, Zap,
  Bus, Award, FlaskConical, Wifi, Heart, Star, Cpu, Coins, PieChart,
  ChevronRight, ChevronLeft, X, Check, ArrowRight, Settings, RotateCcw,
  Play, Pause, Minus, Info, Bell,
};

export function Icon({ name, size = 22, color = COLORS.text }: { name: string; size?: number; color?: string }) {
  const C = MAP[name];
  if (!C) return <View style={{ width: size, height: size }} />;
  return <C size={size} color={color} strokeWidth={2} />;
}
