/**
 * Guansa Ma'ed Restaurant Branding & Asset Configuration
 * 
 * NOTE FOR DEVELOPERS / ADMINS IN VS CODE:
 * You can effortlessly change the restaurant's logo, hero photo, contact numbers, 
 * Telegram username, order recipient email, and social links right here.
 */

// Culinary image asset mappings (change paths or replace images in src/assets/images)
export const BRAND_ASSETS = {
  // Logo image served from the public directory
  logo: '/Guansa_Logo.png',
  
  // Hero section background photography
  // heroDining: '/src/assets/images/hero_ethiopian_mesob_1791644952612.jpg',
  
  // Real Ethiopian Mesob photography uploaded to public folder
  heroDining: '/Ethiopian _Mesob.png',
  mesobHero: '/Ethiopian _Mesob.png',
  mesobHeroFallback: '/src/assets/images/ethiopian_mesob_hero_1792129029834.jpg',
  // Featured culinary dishes
  doroWat: '/src/assets/images/doro_wat_special_1791644962658.jpg',
  beyaynetu: '/src/assets/images/beyaynetu_fasting_platter_1791644974409.jpg',
  bunaCeremony: '/src/assets/images/ethiopian_coffee_ceremony_1791644984662.jpg',
  sizzlingTibs: '/src/assets/images/special_sizzling_tibs_1791645008523.jpg',
  kitfoSpecial: '/src/assets/images/gursha_kitfo_special_1791645018121.jpg',
};

export const BRAND_CONFIG = {
  name: "Guansa Ma'ed",
  nameAmharic: "ጓንሳ ማዕድ",
  fullName: "Guansa Ma'ed ጓንሳ ማዕድ Restaurant",
  tagline: "Authentic Ethiopian Culinary Heritage & Highland Hospitality",
  taglineAmharic: "የኢትዮጵያ ባህላዊ ማዕድ እና የከፍታዎች መስተንግዶ",

  // Business foundation & cultural history
  foundedDate: "June 21, 2024 G.C",
  founder: "Chef Guansa Wolde & Family",
  location: "4 Kilo, Nib International Bank Building, 3rd Floor",
  secondaryLocation: "4 Kilo, Nib International Bank Building, 3rd Floor",
  
  // Telegram handle for order redirects (https://t.me/Paulos_21)
  telegramUsername: "Paulos_21",
  telegramOrderUrl: "https://t.me/Paulos_21",

  // Telegram channel on footer (https://t.me/En_TechSC)
  telegramChannelUrl: "https://t.me/En_TechSC",
  
  // Order recipient & support email address
  orderEmail: "enyewmekete65@gmail.com",
  supportEmail: "enyewmekete65@gmail.com",
  
  // Official Ethiopian phone contact numbers
  primaryPhone: "0943305937",
  secondaryPhone: "0115502331",
  
  // Opening hours
  hours: "Monday – Sunday: 7:00 AM – 11:30 PM (EAT)",

  // Social media handles
  socialLinks: {
    telegram: "https://t.me/En_TechSC", // Official Footer Channel
    telegramOrder: "https://t.me/Paulos_21", // Apply to Order Direct
    instagram: "https://instagram.com/guansa_maed",
    facebook: "https://facebook.com/guansamaed",
    tiktok: "https://tiktok.com/@guansamaed",
    youtube: "https://youtube.com/@guansamaed",
  },

  // Color theme definition
  colors: {
    brandBlue: "#344BC2",
    brandGold: "#F59E0B",
    brandRed: "#C0392B",
    brandGreen: "#15803D",
  },

  // Cultural story details
  culturalNamingMeaning: `In Ethiopian heritage, "Ma'ed" (ማዕድ) is far more than a meal—it is the sacred communal dining circle where family, elders, and cherished guests gather around a single Mesob to share injera in unbroken love, reciprocity, and peace (Gursha). "Guansa" (ጓንሳ) pays homage to ancient highland craftsmanship, fertility of the soil, and the timeless culinary secrets passed down through generations. Guansa Ma'ed was founded on June 21, 2024 G.C with a steadfast vow to preserve this ancestral hospitality while setting the gold standard of contemporary restaurant service excellence.`,
};
