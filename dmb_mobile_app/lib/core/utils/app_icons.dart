import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Icon mapping utility for DMB App
/// Maps lucide-react icons to Flutter equivalents
/// 
/// This provides a centralized icon reference ensuring consistency
/// across the entire application.
class AppIcons {
  AppIcons._();

  // ============================================
  // NAVIGATION ICONS
  // ============================================
  
  static const IconData home = LucideIcons.home;
  static const IconData search = LucideIcons.search;
  static const IconData compass = LucideIcons.compass;
  static const IconData settings = LucideIcons.settings;
  static const IconData menu = LucideIcons.menu;
  static const IconData gridView = LucideIcons.layoutGrid;
  static const IconData listView = LucideIcons.list;
  
  // ============================================
  // USER & PROFILE ICONS
  // ============================================
  
  static const IconData user = LucideIcons.user;
  static const IconData userCircle = LucideIcons.userCircle;
  static const IconData userCheck = LucideIcons.userCheck;
  static const IconData userPlus = LucideIcons.userPlus;
  static const IconData userMinus = LucideIcons.userMinus;
  static const IconData userX = LucideIcons.userX;
  static const IconData userCog = LucideIcons.userCog;
  static const IconData users = LucideIcons.users;
  static const IconData users2 = LucideIcons.users2;
  
  // ============================================
  // AUTHENTICATION & SECURITY ICONS
  // ============================================
  
  static const IconData lock = LucideIcons.lock;
  static const IconData unlock = LucideIcons.unlock;
  static const IconData key = LucideIcons.key;
  static const IconData keyRound = LucideIcons.keyRound;
  static const IconData shield = LucideIcons.shield;
  static const IconData shieldCheck = LucideIcons.shieldCheck;
  static const IconData shieldAlert = LucideIcons.shieldAlert;
  static const IconData fingerprint = LucideIcons.fingerprint;
  static const IconData scan = LucideIcons.scan;
  static const IconData scanFace = LucideIcons.scanFace;
  static const IconData eye = LucideIcons.eye;
  static const IconData eyeOff = LucideIcons.eyeOff;
  static const IconData qrCode = LucideIcons.qrCode;
  
  // ============================================
  // COMMUNICATION ICONS
  // ============================================
  
  static const IconData messageSquare = LucideIcons.messageSquare;
  static const IconData messageCircle = LucideIcons.messageCircle;
  static const IconData messages = LucideIcons.messagesSquare;
  static const IconData send = LucideIcons.send;
  static const IconData phone = LucideIcons.phone;
  static const IconData phoneOff = LucideIcons.phoneOff;
  static const IconData phoneCall = LucideIcons.phoneCall;
  static const IconData video = LucideIcons.video;
  static const IconData videoOff = LucideIcons.videoOff;
  static const IconData mic = LucideIcons.mic;
  static const IconData micOff = LucideIcons.micOff;
  static const IconData bell = LucideIcons.bell;
  static const IconData bellOff = LucideIcons.bellOff;
  static const IconData bellRing = LucideIcons.bellRing;
  
  // ============================================
  // MATCHING & DISCOVERY ICONS
  // ============================================
  
  static const IconData heart = LucideIcons.heart;
  static const IconData heartHandshake = LucideIcons.heartHandshake;
  static const IconData heartPulse = LucideIcons.heartPulse;
  static const IconData sparkles = LucideIcons.sparkles;
  static const IconData zap = LucideIcons.zap;
  static const IconData star = LucideIcons.star;
  static const IconData crown = LucideIcons.crown;
  static const IconData wand2 = LucideIcons.wand2;
  static const IconData brain = LucideIcons.brain;
  static const IconData target = LucideIcons.target;
  static const IconData filter = LucideIcons.filter;
  static const IconData sliders = LucideIcons.slidersHorizontal;
  static const IconData arrowLeftRight = LucideIcons.arrowLeftRight;
  
  // ============================================
  // ACTION ICONS
  // ============================================
  
  static const IconData check = LucideIcons.check;
  static const IconData checkCircle = LucideIcons.checkCircle;
  static const IconData checkCircle2 = LucideIcons.checkCircle2;
  static const IconData x = LucideIcons.x;
  static const IconData xCircle = LucideIcons.xCircle;
  static const IconData plus = LucideIcons.plus;
  static const IconData plusCircle = LucideIcons.plusCircle;
  static const IconData minus = LucideIcons.minus;
  static const IconData minusCircle = LucideIcons.minusCircle;
  static const IconData edit = LucideIcons.edit;
  static const IconData edit2 = LucideIcons.edit2;
  static const IconData trash = LucideIcons.trash;
  static const IconData trash2 = LucideIcons.trash2;
  static const IconData copy = LucideIcons.copy;
  static const IconData share = LucideIcons.share;
  static const IconData share2 = LucideIcons.share2;
  static const IconData download = LucideIcons.download;
  static const IconData upload = LucideIcons.upload;
  static const IconData refresh = LucideIcons.refreshCw;
  static const IconData loader = LucideIcons.loader2;
  static const IconData moreHorizontal = LucideIcons.moreHorizontal;
  static const IconData moreVertical = LucideIcons.moreVertical;
  static const IconData externalLink = LucideIcons.externalLink;
  static const IconData bookmark = LucideIcons.bookmark;
  static const IconData flag = LucideIcons.flag;
  static const IconData ban = LucideIcons.ban;
  static const IconData logOut = LucideIcons.logOut;
  
  // ============================================
  // NAVIGATION ARROWS
  // ============================================
  
  static const IconData arrowLeft = LucideIcons.arrowLeft;
  static const IconData arrowRight = LucideIcons.arrowRight;
  static const IconData arrowUp = LucideIcons.arrowUp;
  static const IconData arrowDown = LucideIcons.arrowDown;
  static const IconData chevronLeft = LucideIcons.chevronLeft;
  static const IconData chevronRight = LucideIcons.chevronRight;
  static const IconData chevronUp = LucideIcons.chevronUp;
  static const IconData chevronDown = LucideIcons.chevronDown;
  static const IconData chevronsUpDown = LucideIcons.chevronsUpDown;
  
  // ============================================
  // MEDIA ICONS
  // ============================================
  
  static const IconData camera = LucideIcons.camera;
  static const IconData image = LucideIcons.image;
  static const IconData imageMultiple = Icons.photo_library;
  static const IconData play = LucideIcons.play;
  static const IconData playCircle = LucideIcons.playCircle;
  static const IconData pause = LucideIcons.pause;
  static const IconData pauseCircle = LucideIcons.pauseCircle;
  static const IconData file = LucideIcons.file;
  static const IconData fileText = LucideIcons.fileText;
  
  // ============================================
  // STATUS & FEEDBACK ICONS
  // ============================================
  
  static const IconData info = LucideIcons.info;
  static const IconData alertCircle = LucideIcons.alertCircle;
  static const IconData alertTriangle = LucideIcons.alertTriangle;
  static const IconData helpCircle = LucideIcons.helpCircle;
  static const IconData checkCircleFilled = Icons.check_circle;
  static const IconData circleDot = LucideIcons.circleDot;
  static const IconData circle = LucideIcons.circle;
  static const IconData clock = LucideIcons.clock;
  static const IconData clock3 = LucideIcons.clock3;
  static const IconData timer = LucideIcons.timer;
  static const IconData history = LucideIcons.history;
  
  // ============================================
  // LOCATION & TRAVEL ICONS
  // ============================================
  
  static const IconData mapPin = LucideIcons.mapPin;
  static const IconData map = LucideIcons.map;
  static const IconData navigation = LucideIcons.navigation;
  static const IconData globe = LucideIcons.globe;
  static const IconData globe2 = LucideIcons.globe2;
  static const IconData plane = LucideIcons.plane;
  static const IconData routeIcon = Icons.route;
  static const IconData building = LucideIcons.building;
  static const IconData building2 = LucideIcons.building2;
  static const IconData hospitalIcon = Icons.local_hospital;
  
  // ============================================
  // PROFESSIONAL & EDUCATION ICONS
  // ============================================
  
  static const IconData briefcase = LucideIcons.briefcase;
  static const IconData graduationCap = LucideIcons.graduationCap;
  static const IconData badgeCheck = LucideIcons.badgeCheck;
  static const IconData award = LucideIcons.award;
  static const IconData trophy = LucideIcons.trophy;
  static const IconData stethoscope = Icons.medical_services;
  static const IconData receipt = LucideIcons.receipt;
  static const IconData calculator = LucideIcons.calculator;
  static const IconData barChart = LucideIcons.barChart;
  static const IconData barChart2 = LucideIcons.barChart2;
  static const IconData pieChart = LucideIcons.pieChart;
  static const IconData lineChart = LucideIcons.lineChart;
  static const IconData trendingUp = LucideIcons.trendingUp;
  static const IconData trendingDown = LucideIcons.trendingDown;
  static const IconData signal = LucideIcons.signal;
  
  // ============================================
  // PAYMENT & SUBSCRIPTION ICONS
  // ============================================
  
  static const IconData creditCard = LucideIcons.creditCard;
  static const IconData wallet = LucideIcons.wallet;
  static const IconData shoppingBag = LucideIcons.shoppingBag;
  static const IconData gift = LucideIcons.gift;
  static const IconData ticket = LucideIcons.ticket;
  static const IconData tag = LucideIcons.tag;
  
  // ============================================
  // DEVICE ICONS
  // ============================================
  
  static const IconData smartphone = LucideIcons.smartphone;
  static const IconData tablet = LucideIcons.tablet;
  static const IconData laptop = LucideIcons.laptop;
  static const IconData monitor = LucideIcons.monitor;
  static const IconData nfc = Icons.nfc;
  
  // ============================================
  // LIFESTYLE ICONS
  // ============================================
  
  static const IconData sun = LucideIcons.sun;
  static const IconData moon = LucideIcons.moon;
  static const IconData coffee = LucideIcons.coffee;
  static const IconData utensils = LucideIcons.utensils;
  static const IconData dumbbell = LucideIcons.dumbbell;
  static const IconData umbrella = LucideIcons.umbrella;
  static const IconData smile = LucideIcons.smile;
  static const IconData partyPopper = LucideIcons.partyPopper;
  static const IconData cake = LucideIcons.cake;
  static const IconData calendar = LucideIcons.calendar;
  static const IconData calendarDays = LucideIcons.calendarDays;
  static const IconData calendarCheck = LucideIcons.calendarCheck;
  static const IconData store = LucideIcons.store;
  static const IconData ruler = LucideIcons.ruler;
  static const IconData lightbulb = LucideIcons.lightbulb;
  
  // ============================================
  // FAMILY & RELATIONSHIPS ICONS
  // ============================================
  
  static const IconData baby = LucideIcons.baby;
  static const IconData handshakeIcon = Icons.handshake;
  static const IconData siren = LucideIcons.siren;
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  /// Get an icon by name string (useful for dynamic icon loading)
  static IconData? getIcon(String name) {
    return _iconMap[name.toLowerCase()];
  }
  
  static final Map<String, IconData> _iconMap = {
    'home': home,
    'search': search,
    'compass': compass,
    'settings': settings,
    'user': user,
    'users': users,
    'heart': heart,
    'star': star,
    'check': check,
    'x': x,
    'plus': plus,
    'minus': minus,
    'edit': edit,
    'trash': trash,
    'send': send,
    'phone': phone,
    'video': video,
    'camera': camera,
    'message': messageSquare,
    'bell': bell,
    'lock': lock,
    'shield': shield,
    'eye': eye,
    'eyeoff': eyeOff,
    'calendar': calendar,
    'clock': clock,
    'mappin': mapPin,
    'globe': globe,
    'creditcard': creditCard,
    'wallet': wallet,
    'briefcase': briefcase,
    'graduationcap': graduationCap,
    'brain': brain,
    'sparkles': sparkles,
    'zap': zap,
    'crown': crown,
    'flag': flag,
    'ban': ban,
    'info': info,
    'alertcircle': alertCircle,
    'alerttriangle': alertTriangle,
    'helpcircle': helpCircle,
    'arrowleft': arrowLeft,
    'arrowright': arrowRight,
    'chevronleft': chevronLeft,
    'chevronright': chevronRight,
    'chevrondown': chevronDown,
    'chevronup': chevronUp,
    'morevertical': moreVertical,
    'morehorizontal': moreHorizontal,
    'externallink': externalLink,
    'download': download,
    'upload': upload,
    'refresh': refresh,
    'loader': loader,
    'filter': filter,
    'sliders': sliders,
    'logout': logOut,
    'fingerprint': fingerprint,
    'qrcode': qrCode,
    'mic': mic,
    'micoff': micOff,
  };
}
