// 1. IMPORTS
import Svg, { Path, Circle, Line } from 'react-native-svg';
import {
    Mail,
    Send,
    Paperclip,
    Ticket,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    Key,
    User,
    Filter,
    Search,
    Settings,
    Edit2,
    Check,
    CheckCircle,
    Crown,
    MessageCircle,
    Heart,
    Headphones,
    Star,
    Smartphone,
    MapPin,
    Briefcase,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Shield,
    ShieldOff,
    Globe,
    BarChart2,
    Camera,
    Trophy,
    Medal,
    Stethoscope,
    Bell,
    Home,
    Compass,
    LogOut,
    X,
    Plus,
    Minus,
    Phone,
    Video,
    CheckCheck,
    Clock,
    Info,
    Users,
    FileText,
    QrCode,
    Share2,
    Download,
    Trash2,
    XCircle,
    GraduationCap,
    Building2,
    Calendar,
    DollarSign,
    PartyPopper,
    Handshake,
    Store,
    Menu,
    Brain,
    Mic,
    MicOff,
    VideoOff,
    PhoneOff,
    MoreVertical,
    Monitor,
    Tablet,
    Bot,
    Wand2,
    Lightbulb,
    Settings2,
    FileBadge,
    Trash2 as Trash2IconRaw,
    // New icons for feature parity
    Coffee,
    Utensils,
    Wine,
    Cigarette,
    Dumbbell,
    Moon,
    Sun,
    Image,
    PlayCircle,
    Bookmark,
    BookmarkPlus,
    CreditCard,
    Wallet,
    Receipt,
    Gift,
    AlertTriangle,
    HelpCircle,
    MessageSquare,
    LifeBuoy,
    Flag,
    Ban,
    UserX,
    UserCheck,
    History,
    Activity,
    TrendingUp,
    Award,
    Zap,
    Link,
    Copy,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    Sliders,
    SlidersHorizontal,
    Target,
    Crosshair,
    Navigation,
    AlertCircle,
    Save,
    Loader2,
    Upload,
    ImagePlus,
    VolumeX,
    Volume2,
    ArrowUpRight,
    ArrowDownLeft,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';

// 2. INTEROP FOR LUCIDE
function wrapLucide(Icon: any) {
    cssInterop(Icon, {
        className: {
            target: 'style',
            nativeStyleToProp: {
                width: true,
                height: true,
                color: true,
            },
        },
    });
    return Icon;
}

// 3. EXPORTS (Lucide Wrappers)
export const MenuIcon = wrapLucide(Menu);
export const CalendarIcon = wrapLucide(Calendar);
export const DollarIcon = wrapLucide(DollarSign);
export const PartyPopperIcon = wrapLucide(PartyPopper);
export const HandshakeIcon = wrapLucide(Handshake);
export const StoreIcon = wrapLucide(Store);
export const GraduationCapIcon = wrapLucide(GraduationCap);
export const BuildingIcon = wrapLucide(Building2);
export const UsersIcon = wrapLucide(Users);
export const FileTextIcon = wrapLucide(FileText);
export const QrCodeIcon = wrapLucide(QrCode);
export const ShareIcon = wrapLucide(Share2);
export const DownloadIcon = wrapLucide(Download);
export const TrashIcon = wrapLucide(Trash2);
export const XCircleIcon = wrapLucide(XCircle);
export const MailIcon = wrapLucide(Mail);
export const SendIcon = wrapLucide(Send);
export const PaperclipIcon = wrapLucide(Paperclip);
export const TicketIcon = wrapLucide(Ticket);
export const LockIcon = wrapLucide(Lock);
export const EyeIcon = wrapLucide(Eye);
export const BrainIcon = wrapLucide(Brain);
export const EyeOffIcon = wrapLucide(EyeOff);
export const RefreshCwIcon = wrapLucide(RefreshCw);
export const KeyIcon = wrapLucide(Key);
export const UserIcon = wrapLucide(User);
export const FilterIcon = wrapLucide(Filter);
export const SearchIcon = wrapLucide(Search);
export const SettingsIcon = wrapLucide(Settings);
export const EditIcon = wrapLucide(Edit2);
export const CheckIcon = wrapLucide(Check);
export const CheckCircleIcon = wrapLucide(CheckCircle);
export const CrownIcon = wrapLucide(Crown);
export const MessageIcon = wrapLucide(MessageCircle);
export const HeartIcon = wrapLucide(Heart);
export const HeadsetIcon = wrapLucide(Headphones);
export const StarIcon = wrapLucide(Star);
export const SmartphoneIcon = wrapLucide(Smartphone);
export const MapPinIcon = wrapLucide(MapPin);
export const BriefcaseIcon = wrapLucide(Briefcase);
export const SparklesIcon = wrapLucide(Sparkles);
export const ChevronRightIcon = wrapLucide(ChevronRight);
export const ChevronLeftIcon = wrapLucide(ChevronLeft);
export const ShieldIcon = wrapLucide(Shield);
export const ShieldOffIcon = wrapLucide(ShieldOff);
export const GlobeIcon = wrapLucide(Globe);
export const ChartBarIcon = wrapLucide(BarChart2);
export const CameraIcon = wrapLucide(Camera);
export const TrophyIcon = wrapLucide(Trophy);
export const BadgeIcon = wrapLucide(Medal);
export const StethoscopeIcon = wrapLucide(Stethoscope);
export const BellIcon = wrapLucide(Bell);
export const HomeIcon = wrapLucide(Home);
export const CompassIcon = wrapLucide(Compass);
export const LogOutIcon = wrapLucide(LogOut);
export const XIcon = wrapLucide(X);
export const PlusIcon = wrapLucide(Plus);
export const MinusIcon = wrapLucide(Minus);
export const PhoneIcon = wrapLucide(Phone);
export const VideoIcon = wrapLucide(Video);
export const CheckCheckIcon = wrapLucide(CheckCheck);
export const ClockIcon = wrapLucide(Clock);
export const InfoIcon = wrapLucide(Info);
export const MicIcon = wrapLucide(Mic);
export const MicOffIcon = wrapLucide(MicOff);
export const VideoOffIcon = wrapLucide(VideoOff);
export const PhoneOffIcon = wrapLucide(PhoneOff);
export const MoreVerticalIcon = wrapLucide(MoreVertical);
export const MonitorIcon = wrapLucide(Monitor);
export const TabletIcon = wrapLucide(Tablet);
export const RobotIcon = wrapLucide(Bot);
export const MagicWandIcon = wrapLucide(Wand2);
export const LightbulbIcon = wrapLucide(Lightbulb);
export const TuneIcon = wrapLucide(Settings2);
export const FileBadgeIcon = wrapLucide(FileBadge);
export const Trash2Icon = wrapLucide(Trash2IconRaw);
export const MessageCircleIcon = wrapLucide(MessageCircle);
export const ArrowUpRightIcon = wrapLucide(ArrowUpRight);
export const ArrowDownLeftIcon = wrapLucide(ArrowDownLeft);

// New Icons for Feature Parity
export const CoffeeIcon = wrapLucide(Coffee);
export const UtensilsIcon = wrapLucide(Utensils);
export const WineIcon = wrapLucide(Wine);
export const CigaretteIcon = wrapLucide(Cigarette);
export const DumbbellIcon = wrapLucide(Dumbbell);
export const MoonIcon = wrapLucide(Moon);
export const SunIcon = wrapLucide(Sun);
export const ImageIcon = wrapLucide(Image);
export const PlayCircleIcon = wrapLucide(PlayCircle);
export const BookmarkIcon = wrapLucide(Bookmark);
export const BookmarkPlusIcon = wrapLucide(BookmarkPlus);
export const CreditCardIcon = wrapLucide(CreditCard);
export const WalletIcon = wrapLucide(Wallet);
export const ReceiptIcon = wrapLucide(Receipt);
export const GiftIcon = wrapLucide(Gift);
export const AlertTriangleIcon = wrapLucide(AlertTriangle);
export const HelpCircleIcon = wrapLucide(HelpCircle);
export const MessageSquareIcon = wrapLucide(MessageSquare);
export const LifeBuoyIcon = wrapLucide(LifeBuoy);
export const FlagIcon = wrapLucide(Flag);
export const BanIcon = wrapLucide(Ban);
export const UserXIcon = wrapLucide(UserX);
export const UserCheckIcon = wrapLucide(UserCheck);
export const HistoryIcon = wrapLucide(History);
export const ActivityIcon = wrapLucide(Activity);
export const TrendingUpIcon = wrapLucide(TrendingUp);
export const AwardIcon = wrapLucide(Award);
export const ZapIcon = wrapLucide(Zap);
export const LinkIcon = wrapLucide(Link);
export const CopyIcon = wrapLucide(Copy);
export const ExternalLinkIcon = wrapLucide(ExternalLink);
export const ChevronDownIcon = wrapLucide(ChevronDown);
export const ChevronUpIcon = wrapLucide(ChevronUp);
export const MoreHorizontalIcon = wrapLucide(MoreHorizontal);
export const SlidersIcon = wrapLucide(Sliders);
export const SlidersHorizontalIcon = wrapLucide(SlidersHorizontal);
export const TargetIcon = wrapLucide(Target);
export const CrosshairIcon = wrapLucide(Crosshair);
export const NavigationIcon = wrapLucide(Navigation);
export const AlertCircleIcon = wrapLucide(AlertCircle);
export const SaveIcon = wrapLucide(Save);
export const Loader2Icon = wrapLucide(Loader2);
export const UploadIcon = wrapLucide(Upload);
export const ImagePlusIcon = wrapLucide(ImagePlus);
export const VolumeXIcon = wrapLucide(VolumeX);
export const Volume2Icon = wrapLucide(Volume2);

// 4. CUSTOM SVG ICONS
export const GoogleIcon = ({
    size = 24,
    color = 'black',
    style,
}: {
    size?: number;
    color?: string;
    style?: any;
}) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <Path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <Path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <Path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </Svg>
);

export const AppleIcon = ({
    size = 24,
    color = 'currentColor',
    style,
}: {
    size?: number;
    color?: string;
    style?: any;
}) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
        <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24.02-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.99 4.31-.82c.59.03 2.25.16 3.3 1.64-2.65 1.4-2.2 5.18.51 6.32-.58 1.61-1.39 3.19-3.2 4.94zM12.03 7.25c-.11-2.35 1.91-4.33 4.24-4.55.24 2.65-2.5 4.77-4.24 4.55z" />
    </Svg>
);

export const CaduceusIcon = ({
    size = 24,
    color = 'currentColor',
    className,
    style,
}: {
    size?: number;
    color?: string;
    className?: string;
    style?: any;
}) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Line x1="50" y1="15" x2="50" y2="90" stroke={color} />
        <Circle cx="50" cy="15" r="5" fill={color} stroke="none" />
        <Path
            d="M50 25 C 20 25, 10 5, 5 15 C 10 25, 30 35, 50 35"
            stroke="none"
            fill="#ef4444"
            fillOpacity="0.8"
        />
        <Path
            d="M50 25 C 80 25, 90 5, 95 15 C 90 25, 70 35, 50 35"
            stroke="none"
            fill="#ef4444"
            fillOpacity="0.8"
        />
        <Path d="M50 90 Q 70 70 50 50 Q 30 30 50 20" stroke={color} fill="none" />
        <Path d="M50 90 Q 30 70 50 50 Q 70 30 50 20" stroke={color} fill="none" />
    </Svg>
);
