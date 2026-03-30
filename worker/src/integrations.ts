export const INTEGRATION_PROVIDERS = {
  GOOGLE_DRIVE: 'google_drive',
  GITHUB: 'github',
  GMAIL: 'gmail',
  OUTLOOK: 'outlook',
  WHATSAPP: 'whatsapp',
  CLOUDFLARE: 'cloudflare',
} as const;

export type IntegrationProvider = typeof INTEGRATION_PROVIDERS[keyof typeof INTEGRATION_PROVIDERS];

export const INTEGRATION_METADATA = {
  google_drive: {
    name: 'Google Drive',
    icon: 'FileText',
    color: 'from-blue-500 to-blue-600',
    description: 'Access and manage your Google Drive files',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  },
  github: {
    name: 'GitHub',
    icon: 'Github',
    color: 'from-gray-700 to-gray-900',
    description: 'Access your repositories and commit history',
    scopes: ['repo', 'user:email'],
  },
  gmail: {
    name: 'Gmail',
    icon: 'Mail',
    color: 'from-red-500 to-red-600',
    description: 'Read and manage your Gmail inbox',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  },
  outlook: {
    name: 'Outlook',
    icon: 'Mail',
    color: 'from-blue-600 to-blue-700',
    description: 'Access your Outlook email and calendar',
    scopes: ['Mail.Read', 'Calendar.Read'],
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: 'MessageCircle',
    color: 'from-green-500 to-green-600',
    description: 'Connect WhatsApp Business API',
    scopes: [],
  },
  cloudflare: {
    name: 'Cloudflare',
    icon: 'Cloud',
    color: 'from-orange-500 to-orange-600',
    description: 'Manage Workers, Pages, and R2 storage',
    scopes: [],
  },
} as const;

export const SOCIAL_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github',
  APPLE: 'apple',
  MICROSOFT: 'microsoft',
} as const;

export type SocialProvider = typeof SOCIAL_PROVIDERS[keyof typeof SOCIAL_PROVIDERS];

export const SOCIAL_METADATA = {
  google: {
    name: 'Google',
    icon: 'Mail',
    color: 'from-blue-500 to-blue-600',
  },
  github: {
    name: 'GitHub',
    icon: 'Github',
    color: 'from-gray-700 to-gray-900',
  },
  apple: {
    name: 'Apple',
    icon: 'Apple',
    color: 'from-gray-800 to-gray-900',
  },
  microsoft: {
    name: 'Microsoft',
    icon: 'Windows',
    color: 'from-blue-600 to-blue-700',
  },
} as const;
