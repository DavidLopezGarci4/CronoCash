import React from 'react';
import {
  // Inversión & Finanzas
  TrendingUp,
  Coins,
  LineChart,
  Landmark,
  Gem,
  PiggyBank,
  CreditCard,
  PieChart,
  // Hogar, Servicios & Suministros
  Home,
  Zap,
  Droplets,
  Wifi,
  Tv,
  Building2,
  Key,
  // Transporte & Movilidad
  Car,
  Fuel,
  Bus,
  Train,
  // Trabajo, Educación & Gestión
  Briefcase,
  FileText,
  FileCheck,
  BookOpen,
  GraduationCap,
  // Salud & Bienestar
  HeartPulse,
  Stethoscope,
  Pill,
  Eye,
  Dumbbell,
  // Alimentación, Ocio & Vida Cotidiana
  Utensils,
  Coffee,
  ShoppingCart,
  Music,
  Gamepad2,
  Gift,
  Scissors,
  Palmtree,
  // Seguridad, Protección & Notificaciones
  Shield,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Lock,
  // Aficiones, Gamificación & Coleccionismo
  Bot,
  Package,
  Trophy,
  Crown,
  Sparkles,
  Target,
  Repeat,
  HeartHandshake,
  Smartphone,
  Wrench,
  Tag,
  // Mascotas, Transferencias & Impuestos
  PawPrint,
  ArrowLeftRight,
  ArrowRightLeft,
  ReceiptText,
  Receipt,
} from 'lucide-react';

/**
 * Catálogo Maestro Unificado de Iconos Representativos (100% Lucide React).
 * Disponible para Categorías Funcionales, Bolsas (Buckets) y Cargos Recurrentes.
 */
export const MASTER_ICON_MAP: Record<string, React.ElementType> = {
  // Inversión & Finanzas
  TrendingUp,
  Coins,
  LineChart,
  Landmark,
  Gem,
  PiggyBank,
  CreditCard,
  PieChart,

  // Hogar & Suministros
  Home,
  Zap,
  Droplets,
  Wifi,
  Tv,
  Building2,
  Key,

  // Transporte & Movilidad
  Car,
  Fuel,
  Bus,
  Train,

  // Trabajo, Gestión & Educación
  Briefcase,
  FileText,
  FileCheck,
  BookOpen,
  GraduationCap,

  // Salud & Cuidado Personal
  HeartPulse,
  Stethoscope,
  Pill,
  Eye,
  Dumbbell,

  // Alimentación, Ocio & Compras
  Utensils,
  Coffee,
  ShoppingCart,
  Music,
  Gamepad2,
  Gift,
  Scissors,
  Palmtree,

  // Seguridad & Notificaciones
  Shield,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Lock,

  // Aficiones & Coleccionismo
  Bot,
  Package,
  Trophy,
  Crown,
  Sparkles,
  Target,
  Repeat,
  HeartHandshake,
  Smartphone,
  Wrench,
  Tag,

  // Mascotas, Transferencias & Impuestos
  PawPrint,
  ArrowLeftRight,
  ArrowRightLeft,
  ReceiptText,
  Receipt,
};

/**
 * Lista ordenada de todas las claves de iconos disponibles (56 iconos).
 */
export const MASTER_ICON_KEYS: string[] = Object.keys(MASTER_ICON_MAP);
