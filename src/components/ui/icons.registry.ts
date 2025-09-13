// Modern icon registry - curated selection of beautiful, consistent icons
import { ComponentType } from 'react'

// Phosphor Icons (weight-based system)
import { 
  ChartLine, 
  Eye, 
  Target, 
  TrendUp, 
  Users, 
  Lightning, 
  Shield, 
  Rocket,
  Brain,
  Globe,
  Star,
  Heart,
  ArrowRight,
  Play,
  Download,
  CheckCircle,
  Info,
  Warning,
  X,
  List,
  Plus,
  Minus,
  Trash,
  Copy
} from 'phosphor-react'

// Tabler Icons (clean, minimalist)
import {
  IconBrandGoogle,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconAnalyze,
  IconReportAnalytics,
  IconDashboard,
  IconChartPie,
  IconChartBar,
  IconTrendingUp,
  IconDatabase,
  IconCloud,
  IconDeviceAnalytics,
  IconBulb,
  IconRocket as TablerRocket,
  IconShield as TablerShield,
  IconTarget as TablerTarget,
  IconUsers as TablerUsers,
  IconEye as TablerEye,
  IconHeart as TablerHeart,
  IconStar as TablerStar,
  IconCheck,
  IconAlertTriangle,
  IconX as TablerX,
  IconMenu2,
  IconSearch as TablerSearch,
  IconSettings as TablerSettings,
  IconUser as TablerUser,
  IconBell as TablerBell,
  IconCalendar as TablerCalendar,
  IconClock as TablerClock,
  IconMapPin as TablerMapPin,
  IconPhone as TablerPhone,
  IconMail as TablerMail,
  IconLink as TablerLink,
  IconShare as TablerShare,
  IconThumbUp,
  IconMessageCircle as TablerMessageCircle,
  IconMessage as TablerMessage,
  IconScale as TablerScale,
  IconBookmark as TablerBookmark,
  IconFilter as TablerFilter,
  IconArrowsSort,
  IconGrid3x3,
  IconList as TablerList,
  IconPlus as TablerPlus,
  IconMinus as TablerMinus,
  IconEdit as TablerEdit,
  IconTrash as TablerTrash,
  IconCopy as TablerCopy,
  IconExternalLink as TablerExternalLink
} from '@tabler/icons-react'

// Iconoir (elegant, modern)
import {
  Eye as IconoirEye,
  Brain as IconoirBrain,
  Globe as IconoirGlobe,
  Star as IconoirStar,
  Heart as IconoirHeart,
  ArrowRight as IconoirArrowRight,
  Download as IconoirDownload,
  CheckCircle as IconoirCheckCircle,
  WarningTriangle,
  Xmark,
  Menu as IconoirMenu,
  Search as IconoirSearch,
  Settings as IconoirSettings,
  User as IconoirUser,
  Bell as IconoirBell,
  Calendar as IconoirCalendar,
  Clock as IconoirClock,
  MapPin as IconoirMapPin,
  Phone as IconoirPhone,
  Mail as IconoirMail,
  Link as IconoirLink,
  ShareAndroid,
  ThumbsUp as IconoirThumbsUp,
  ChatBubbleEmpty,
  Bookmark as IconoirBookmark,
  Filter as IconoirFilter,
  ViewGrid,
  List as IconoirList,
  Plus as IconoirPlus,
  Minus as IconoirMinus,
  EditPencil,
  Trash as IconoirTrash,
  Copy as IconoirCopy,
  OpenInWindow
} from 'iconoir-react'

// Radix Icons (system icons)
import {
  DashboardIcon,
  BarChartIcon,
  ActivityLogIcon,
  EyeOpenIcon,
  TargetIcon,
  PersonIcon,
  LightningBoltIcon,
  RocketIcon as RadixRocket,
  TokensIcon,
  GlobeIcon,
  StarIcon,
  HeartIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlayIcon,
  DownloadIcon,
  CheckCircledIcon,
  CheckIcon as RadixCheckIcon,
  InfoCircledIcon,
  ExclamationTriangleIcon,
  Cross2Icon,
  HamburgerMenuIcon,
  MagnifyingGlassIcon,
  GearIcon,
  AvatarIcon,
  BellIcon,
  CalendarIcon,
  ClockIcon,
  PinTopIcon,
  MobileIcon,
  EnvelopeClosedIcon,
  LinkBreak2Icon,
  Share1Icon,
  ThickArrowUpIcon,
  ChatBubbleIcon,
  BookmarkIcon,
  MixerHorizontalIcon,
  CaretSortIcon,
  CaretDownIcon,
  CaretUpIcon,
  DashIcon,
  PlusIcon,
  MinusIcon,
  Pencil1Icon,
  TrashIcon,
  CopyIcon,
  OpenInNewWindowIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DotsHorizontalIcon,
  DotFilledIcon,
  CircleIcon,
  ActivityLogIcon as RadixActivity,
  DragHandleVerticalIcon
} from '@radix-ui/react-icons'

export interface IconProps {
  className?: string
  size?: number | string
  color?: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}

// Organized icon registry by category and theme
export const iconRegistry: Record<string, ComponentType<any>> = {
  // Analytics & Charts - Phosphor (weight system for data viz)
  'chart-line': ChartLine,
  'chart-bar': IconChartBar, // Using tabler for bars
  'chart-pie': IconChartPie, // Tabler for elegant pie charts
  'chart-donut': IconChartPie, // Tabler for system consistency
  'analytics': IconAnalyze,
  'dashboard': DashboardIcon, // Radix for system UI
  'trending-up': TrendUp,
  'report': IconReportAnalytics,

  // Business & Marketing - Mixed for visual variety
  'eye': Eye, // Phosphor
  'target': TablerTarget, // Tabler for elegance
  'scale': TablerScale, // Tabler for legal scale
  'users': TablerUsers, // Tabler for clean lines
  'brain': Brain, // Phosphor
  'lightning': Lightning, // Phosphor
  'shield': TablerShield, // Tabler
  'rocket': TablerRocket, // Tabler for modern feel
  'globe': GlobeIcon, // Radix
  'bulb': IconBulb, // Tabler

  // UI Actions - Radix for consistency
  'check': CheckCircledIcon,
  'check-simple': RadixCheckIcon,
  'info': InfoCircledIcon,
  'warning': ExclamationTriangleIcon,
  'close': Cross2Icon,
  'x': Cross2Icon, // Alias
  'menu': HamburgerMenuIcon,
  'search': MagnifyingGlassIcon,
  'settings': GearIcon,
  'user': AvatarIcon,
  'bell': BellIcon,
  'calendar': CalendarIcon,
  'clock': ClockIcon,
  'pin': PinTopIcon,
  'phone': MobileIcon,
  'mail': EnvelopeClosedIcon,
  'link': LinkBreak2Icon,
  'share': Share1Icon,
  'thumbs-up': ThickArrowUpIcon,
  'message': ChatBubbleIcon,
  'message-square': TablerMessage,
  'bookmark': BookmarkIcon,
  'filter': MixerHorizontalIcon,
  'sort': CaretSortIcon,
  'grid': ViewGrid, // Iconoir
  'list': TablerList, // Tabler
  'plus': PlusIcon,
  'minus': MinusIcon,
  'edit': Pencil1Icon,
  'trash': TrashIcon,
  'copy': CopyIcon,
  'external-link': OpenInNewWindowIcon,
  
  // Navigation & Arrows - Radix for consistency
  'arrow-left': ArrowLeftIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'caret-down': CaretDownIcon,
  'caret-up': CaretUpIcon,
  'more-horizontal': DotsHorizontalIcon,
  'dot': DotFilledIcon,
  'circle': CircleIcon,
  'activity': RadixActivity,
  'grip-vertical': DragHandleVerticalIcon,
  'panel-left': HamburgerMenuIcon, // Alias for sidebar toggle
  'arrow-right': ArrowRightIcon,
  
  // Common UI aliases for better DX
  'bar-chart-3': BarChartIcon, // From Radix  
  'alert-circle': ExclamationTriangleIcon, // Alias
  'message-circle': ChatBubbleIcon, // Alias

  // Social & Brands - Tabler for brand consistency
  'brand-google': IconBrandGoogle,
  'brand-twitter': IconBrandTwitter,
  'brand-linkedin': IconBrandLinkedin,
  'brand-facebook': IconBrandFacebook,

  // Feedback & Ratings - Phosphor for weight variations
  'star': Star,
  'heart': Heart,
  'play': Play,
  'download': Download,

  // Data & Storage - Tabler for technical icons
  'database': IconDatabase,
  'cloud': IconCloud,
  'device-analytics': IconDeviceAnalytics,
}

// Icon collections for easy access
export const iconCollections = {
  analytics: ['chart-line', 'chart-bar', 'chart-pie', 'analytics', 'dashboard', 'trending-up'],
  business: ['eye', 'target', 'users', 'brain', 'lightning', 'shield', 'rocket', 'globe'],
  ui: ['check', 'info', 'warning', 'close', 'menu', 'search', 'settings', 'user'],
  social: ['brand-google', 'brand-twitter', 'brand-linkedin', 'brand-facebook'],
  feedback: ['star', 'heart', 'thumbs-up', 'play', 'download'],
  data: ['database', 'cloud', 'device-analytics', 'filter', 'sort']
}

// Weight mapping for phosphor icons
export const getPhosphorWeight = (weight?: string): string => {
  const weightMap: Record<string, string> = {
    'thin': 'thin',
    'light': 'light', 
    'regular': 'regular',
    'bold': 'bold',
    'fill': 'fill',
    'duotone': 'duotone'
  }
  return weightMap[weight || 'regular'] || 'regular'
}