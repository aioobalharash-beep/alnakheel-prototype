export interface ClientTheme {
  primary: string;
  secondary: string;
}

export interface ClientAdmin {
  email: string;
  name: string;
}

export interface ClientSocial {
  whatsapp: string;
  instagram?: string;
}

export interface ClientConfig {
  chaletName: string;
  logoPath: string | null;
  theme: ClientTheme;
  admin: ClientAdmin;
  social: ClientSocial;
}

export const FALLBACK_CLIENT_CONFIG: ClientConfig = {
  chaletName: 'Luxury Stay',
  logoPath: null,
  theme: {
    primary: '#011F36',
    secondary: '#D4AF37',
  },
  admin: {
    email: '',
    name: 'Administrator',
  },
  social: {
    whatsapp: '',
  },
};

export const CLIENT_CONFIG: ClientConfig = {
  chaletName: 'Al-Nakheel Luxury Chalet',
  logoPath: null,
  theme: {
    primary: '#011F36',
    secondary: '#D4AF37',
  },
  admin: {
    email: 'ahmed@alnakheel.om',
    name: 'Ahmed Al-Said',
  },
  social: {
    whatsapp: '96891000001',
    instagram: 'https://instagram.com',
  },
};

export function getClientConfig(): ClientConfig {
  const raw = CLIENT_CONFIG as Partial<ClientConfig> | null | undefined;
  if (!raw) return FALLBACK_CLIENT_CONFIG;
  return {
    chaletName: raw.chaletName?.trim() || FALLBACK_CLIENT_CONFIG.chaletName,
    logoPath: raw.logoPath?.trim() || null,
    theme: {
      primary: raw.theme?.primary || FALLBACK_CLIENT_CONFIG.theme.primary,
      secondary: raw.theme?.secondary || FALLBACK_CLIENT_CONFIG.theme.secondary,
    },
    admin: {
      email: (raw.admin?.email || FALLBACK_CLIENT_CONFIG.admin.email).toLowerCase(),
      name: raw.admin?.name || FALLBACK_CLIENT_CONFIG.admin.name,
    },
    social: {
      whatsapp: (raw.social?.whatsapp || '').replace(/\D/g, ''),
      instagram: raw.social?.instagram || FALLBACK_CLIENT_CONFIG.social.instagram,
    },
  };
}

export function whatsappHref(number: string | undefined): string | null {
  const digits = (number || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

export function applyTheme(theme: ClientTheme): void {
  const root = document.documentElement;
  root.style.setProperty('--color-primary-navy', theme.primary);
  root.style.setProperty('--color-secondary-gold', theme.secondary);
}
