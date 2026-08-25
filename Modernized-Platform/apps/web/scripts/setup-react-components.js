import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reactDir = path.resolve(__dirname, '../src/components/react');

const mappings = {
  auth: ['AuthModal', 'TwoFactorSetupModal', 'StepUpAuthModal', 'StepUpVerificationModal', 'OnboardingModal', 'PasswordResetModal', 'WelcomeScreen'],
  discovery: ['DiscoveryView', 'FilterPanel', 'DoctorCard', 'TravelModeModal', 'MatchIntelligenceModal', 'MatchTunerModal', 'ProfileCard', 'ProfileDetailModal'],
  profile: ['ProfileEditView', 'BiodataPDFTemplate', 'MediaAccessRequestModal', 'RightSidebar', 'ProfileDetailWidget', 'VerificationModal', 'CredentialVerificationModal'],
  chat: ['MessagesView', 'ChatThread', 'ShareBiodataModal', 'CallModal', 'PremiumMessagingModal'],
  messages: ['MessagesView', 'ChatThread', 'ShareBiodataModal', 'CallModal', 'PremiumMessagingModal'],
  progression: ['ProgressionView', 'MilestoneTracker', 'VenueBudgetLedger'],
  settings: ['SettingsView', 'PackageCheckoutModal', 'TrustContactsModal', 'TwoFactorSetupModal'],
  proposals: ['ProposalModal', 'DeclineModal'],
  dashboard: ['RightSidebar'],
  wallet: ['WalletView', 'PaymentModal'],
  referrals: ['ReferralView', 'ReferralPopupModal'],
  community: ['CommunityView'],
  family: ['FamilyPortalView'],
  notifications: ['NotificationsView', 'NotificationDetailModal'],
  payments: ['SubscriptionModal', 'PaymentModal'],
  verification: ['VerificationModal', 'CredentialVerificationModal'],
  common: ['Sidebar', 'FloatingContactButton', 'LanguageToggle', 'PasswordField', 'CountryCodeSelector', 'ErrorBoundary', 'LoadingTimeoutFallback', 'ReportModal'],
  marketing: ['ProfileTeaser'],
};

for (const [folder, components] of Object.entries(mappings)) {
  const folderPath = path.join(reactDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  for (const comp of components) {
    const compPath = path.join(folderPath, `${comp}.tsx`);
    const content = `export { default } from '../${comp}';\nexport * from '../${comp}';\n`;
    fs.writeFileSync(compPath, content, 'utf8');
  }
}

console.log('Successfully structured all React subfolders & exports.');
