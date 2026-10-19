import React from 'react';
import { BRAND_CONFIG, BRAND_ASSETS } from '../../config/branding';
import {
  Calendar,
  Award,
  Heart,
  Compass,
  Eye,
  CheckCircle2,
  Users,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  const leadership = [
    {
      name: 'Chef Guansa Wolde',
      position: 'Founder',
      photo: '/Founder.jpg',
      description: "Chef Guansa Wolde founded Guansa Ma'ed to celebrate Ethiopian highland cuisine and the tradition of sharing a meal. The restaurant's vision brings authentic flavors and warm, communal hospitality together. Chef Guansa's culinary expertise and dedication to preserving Ethiopian food culture have made Guansa Ma'ed a beloved destination for locals and visitors alike. ",
    },
    {
      name: 'Wubegzire Shimels',
      position: 'Current Director',
      photo: '/Director.jpg',
      description: "As Current Director, Wubegzire Shimels helps guide Guansa Ma'ed and its team, supporting the restaurant's mission to deliver an authentic and welcoming Ethiopian dining experience. Wubegzire Shimels' leadership ensures that every guest enjoys the rich flavors, cultural traditions, and warm hospitality that define Guansa Ma'ed.",
    },
    {
      name: 'Wubegzire Shimels',
      position: 'Manager',
      photo: '/Manager.jpg',
      description: "As Manager, Wubegzire Shimels supports the restaurant's day-to-day service and helps the team provide attentive care to every guest at Guansa Ma'ed. Wubegzire Shimels' management ensures that the restaurant maintains its high standards of quality, authenticity, and hospitality, creating a memorable dining experience for all visitors.",
    },
    {
      name: 'Wubegzire Shimels',
      position: 'Shareholders',
      photo: '/Owner.jpg',
      description: "As a Shareholder, Wubegzire Shimels supports Guansa Ma'ed's future and its commitment to Ethiopian culinary heritage, quality, and hospitality. The restaurant's shareholders are dedicated to preserving the cultural and culinary traditions of Ethiopia. What Is a Shareholder? A shareholder is a person, company, or institution that owns at least one share of a company’s stock or a share of a mutual fund. Shareholders essentially own the company and this comes with the right to share in the profits.Shareholders benefit from increased stock valuations or profits distributed as dividends when the company is successful. They also have the right to participate in corporate elections. They can lose money as well, however, when the company does and share prices drop. Shareholders can claim any remaining assets after the company's debts are paid if the company fails.",
    },
  ];

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8 space-y-16 bg-white text-[#344BC2]">
      {/* Header */}
      <div className="mx-auto max-w-none space-y-3 text-center">
        <h1 className="whitespace-nowrap text-[clamp(1rem,4vw,3rem)] font-extrabold tracking-tight bg-gradient-to-r from-[#159E37] to-[#344BC2] bg-clip-text text-transparent font-serif">
          Well Come to Gunsa Ma'ed ጓንሳ ማዕድ
        </h1>
        <p className="text-xs sm:text-sm text-[#344BC2]/80 leading-relaxed">
          Rooted in ancient highland traditions, founded on June 21, 2024 G.C, and dedicated to the sacred art of breaking bread together.
        </p>
      </div>

      {/* Part 1: History, Founder, Founded Date, Service Excellency & Why the Name (BEFORE Mission/Vision/Values) */}
      <div className="space-y-12">
        {/* Foundation & Founder Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            {/* Reverse Founded Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#344BC2] text-white text-xs font-semibold shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Founded on {BRAND_CONFIG.foundedDate}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#159E37]">
              The Genesis of Our Highland Dining House
            </h3>

            <p >
              Guansa Ma'ed was founded on <strong className="text-[#b45309]">June 21, 2024 G.C</strong> by <strong className="text-[#344BC2]">{BRAND_CONFIG.founder}</strong> in the vibrant heart of Addis Ababa. Inspired by centuries of communal family feasts across the Ethiopian highlands, our restaurant was conceived as a living sanctuary for authentic culinary traditions.               In an era where fast food often displaces traditional culinary patience, Chef Guansa vowed to preserve the laborious, time-honored slow-cooking methods: sun-drying heirloom red berbere chilies, slow-clarifying mountain butter with Kosseret and Besobila herbs, and naturally fermenting pure high-grade teff flour for three full days.               The name <strong className="text-[#b45309]">"Guansa Ma'ed"</strong> (ጓንሳ ማዕድ) embodies our mission: "Guansa" honors the fertile highland soils and the artisanal wisdom of Ethiopian farmers, while "Ma'ed" signifies the sacred communal table where bonds are forged and traditions are celebrated. Together, they represent a commitment to authenticity, community, and culinary excellence.
            </p>
            {/* <p>
              The name <strong className="text-[#b45309]">"Guansa Ma'ed"</strong> (ጓንሳ ማዕድ) embodies our mission: "Guansa" honors the fertile highland soils and the artisanal wisdom of Ethiopian farmers, while "Ma'ed" signifies the sacred communal table where bonds are forged and traditions are celebrated. Together, they represent a commitment to authenticity, community, and culinary excellence.
            </p> */}
            <p>
              At Guansa Ma'ed, every dish is a testament to our dedication to heritage and quality. From the ceremonial Jebena coffee service to the meticulously crafted injera and stews, we invite our guests to partake in a dining experience that transcends mere sustenance, offering instead a journey into the heart of Ethiopian culture and hospitality.               Join us at Guansa Ma'ed, where every meal is a celebration of tradition, every gathering a testament to community, and every visit an invitation to experience the warmth and richness of Ethiopian culinary artistry.
            </p>
          <p>
            Guansa Ma'ed - ጓንሳ ማዕድ is Top 10 Restaurant in Ethiopia, Guansa is more than a restaurant; it is a destination where tradition, community, and exceptional Ethiopian cuisine come together. From signature dishes to the cherished Jebena coffee ceremony, every experience reflects our passion for heritage, quality, and hospitality.
          </p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border-2 border-[#159E37] shadow-2xl">
              <img
                src={BRAND_ASSETS.heroDining}
                alt="Communal dining at Guansa Ma'ed"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#344BC2] via-transparent to-transparent flex items-end p-6">
                <div className="text-xs text-amber-200">
                  <p className="font-bold text-white text-sm">Chef Guansa Wolde & Kitchen Artisans</p>
                  <p className="text-white/80">Passing the warmth of ancestral highland feasts to every guest.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section aria-labelledby="leadership-heading" className="-mx-4 space-y-5 px-[5%] sm:-mx-6 lg:-mx-8">
          <div className="text-center">
            <h3 id="leadership-heading" className="text-2xl font-bold font-serif text-[#159E37]">
              Our Leadership
            </h3>
          </div>
          <div className="w-full space-y-8 lg:space-y-10">
            {leadership.map(({ name, position, photo, description }, index) => {
              const imageFirst = index % 2 === 1;
              return (
              <article key={position} className={`grid items-center gap-6 border-b border-[#159E37]/30 pb-8 last:border-b-0 last:pb-0 md:gap-[5%] ${imageFirst ? 'md:grid-cols-[25%_minmax(0,1fr)]' : 'md:grid-cols-[minmax(0,1fr)_25%]'}`}>
                <div className={`space-y-4 ${imageFirst ? 'md:order-2' : 'md:order-1'}`}>
                  <h4 className="inline-block border-b-2 border-[#159E37] pb-1 text-xl font-bold text-[#159E37] sm:text-2xl">
                    {position}
                  </h4>
                  <p className="text-sm leading-relaxed text-[#344BC2]/90 sm:text-base">
                    {description}
                  </p>
                </div>
                <div className={`mx-auto w-full max-w-[16rem] overflow-hidden rounded-lg border-2 border-[#159E37] bg-white shadow-lg ${imageFirst ? 'md:order-1' : 'md:order-2'}`}>
                  <img
                    src={photo}
                    alt={`${name}, ${position}`}
                    className="aspect-[4/5] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="space-y-1 bg-[#344BC2] px-3 py-3 text-center text-white">
                    <p className="text-sm font-bold">{name}</p>
                    <p className="text-xs font-semibold">{position}</p>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        </section>

        {/* Why the Business Name is "Guansa Ma'ed" & Service Excellency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card: Why the Name Guansa Ma'ed (Reverse Box for Maximum Visual Clarity & Accessibility) */}
          <div className="bg-[#344BC2] text-white border border-[#159E37] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-serif">
                  Why the Name "Guansa Ma'ed" (ጓንሳ ማዕድ)?
                </h4>
                <p className="text-[11px] text-white font-ethiopic font-medium">የስያሜው ጥልቅ ትርጉምና ታሪክ</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-white/90 leading-relaxed">
              <p>
                In Ethiopian civilization, <strong className="text-amber-300">"Ma'ed" (ማዕድ)</strong> is never merely a table or food; it is a sacred covenant. It is the communal woven circle where elders, travelers, family, and neighbors sit together as equals to share food from a single platter. To break Ma'ed is to establish lifelong friendship and trust.
              </p>
              <p>
                <strong className="text-amber-300">"Guansa" (ጓንሳ)</strong> honors the ancient highland heritage, fertility of the volcanic soil, and the resilient wisdom of Ethiopian artisans who hand-weave the ceremonial Mesob and harvest the finest teff crops.
              </p>
              <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-amber-200 text-xs italic">
                "At Guansa Ma'ed, every visitor is welcomed not as a customer, but as an honored guest invited to our family's sacred communal table."
              </div>
            </div>
          </div>

          {/* Card: Service Excellency (Crisp High-Contrast White Surface) */}
          <div className="bg-slate-50 text-[#344BC2] border-2 border-[#159E37] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#344BC2] text-amber-300">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#344BC2] font-serif">
                  Service Excellency & Highland Hospitality
                </h4>
                <p className="text-[11px] text-[#159E37] font-ethiopic font-semibold">የአገልግሎት ልቀትና ሞቅ ያለ መስተንግዶ</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#344BC2]/85 leading-relaxed">
              <p>
                Service Excellency is the cornerstone of Guansa Ma'ed. Our hospitality team undergoes intensive training in traditional Ethiopian ceremonial customs, etiquette, and international hygiene standards:
              </p>
              <ul className="space-y-2 text-xs text-[#344BC2]/90">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>The Masebtecha Hand-Washing Ritual:</strong> Warm water poured from traditional brass pitchers before and after every meal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Ceremonial Gursha Etiquette:</strong> Respectful cultural feeding customs that honor shared affection and goodwill.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Strict Farm-to-Table Freshness:</strong> Zero artificial preservatives; only organic highland ingredients delivered daily.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Mission, Vision, and Values */}
      <div className="space-y-10 pt-6 border-t border-[#159E37]">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#b45309] font-mono">
            Guiding Philosophy · ተልዕኮ፣ ራዕይና እሴቶች
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#159E37]">
            Our Mission, Vision & Core Values
          </h3>
        </div>

        {/* Mission & Vision Split with Alternating High Contrast Reverse Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mission */}
          <div className="p-6 rounded-2xl bg-slate-50 border-2 border-[#159E37] space-y-3 text-[#344BC2] shadow-md">
            <div className="flex items-center gap-2.5 text-[#344BC2]">
              <Compass className="w-5 h-5 text-[#b45309]" />
              <h4 className="text-lg font-bold text-[#344BC2]">Our Mission · ተልዕኳችን</h4>
            </div>
            <p className="text-sm sm:text-base text-[#344BC2] leading-relaxed">
              To preserve, celebrate, and elevate authentic Ethiopian culinary traditions by serving meticulously handcrafted dishes made from pure organic highland ingredients, delivering service excellency that honors ancestral hospitality and brings people together in joyful communion.
            </p>
          </div>

          {/* Vision (Reverse High Contrast Box) */}
          <div className="p-6 rounded-2xl bg-[#344BC2] border border-[#159E37] space-y-3 text-white shadow-xl">
            <div className="flex items-center gap-2.5 text-amber-300">
              <Eye className="w-5 h-5" />
              <h4 className="text-lg font-bold text-white">Our Vision · ራዕያችን</h4>
            </div>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              To stand as Ethiopia's benchmark restaurant for cultural dining integrity and culinary prestige—inspiring both local food lovers and international travelers to experience the profound warmth, rich flavors, and unifying spirit of the Ethiopian Mesob.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white border-2 border-[#159E37] space-y-2 text-[#344BC2] shadow-sm hover:border-[#159E37] transition-all">
            <div className="p-2 w-fit rounded-lg bg-[#344BC2] text-amber-400">
              <Heart className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-sm text-[#344BC2]">Communal Fellowship</h5>
            <p className="text-[11px] text-[#159E37] font-ethiopic font-semibold">የጋራ ማዕድና ፍቅር</p>
            <p className="text-xs text-[#344BC2]/75 leading-relaxed">
              Promoting unity through the communal Mesob, where sharing injera and Gursha breaks down barriers and builds lasting harmony.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-[#159E37] space-y-2 text-[#344BC2] shadow-sm hover:border-[#159E37] transition-all">
            <div className="p-2 w-fit rounded-lg bg-[#344BC2] text-emerald-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-sm text-[#344BC2]">Purity & Freshness</h5>
            <p className="text-[11px] text-[#159E37] font-ethiopic font-semibold">ንጹህና ትኩስ ግብአቶች</p>
            <p className="text-xs text-[#344BC2]/75 leading-relaxed">
              100% genuine teff injera, stone-ground berbere, and grass-fed butter directly sourced from highland farmers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-[#159E37] space-y-2 text-[#344BC2] shadow-sm hover:border-[#159E37] transition-all">
            <div className="p-2 w-fit rounded-lg bg-[#344BC2] text-blue-300">
              <Award className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-sm text-[#344BC2]">Service Excellency</h5>
            <p className="text-[11px] text-[#159E37] font-ethiopic font-semibold">የአገልግሎት ልቀት</p>
            <p className="text-xs text-[#344BC2]/75 leading-relaxed">
              Attentive, courteous, and culturally respectful care for every guest from arrival to departure.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-[#159E37] space-y-2 text-[#344BC2] shadow-sm hover:border-[#159E37] transition-all">
            <div className="p-2 w-fit rounded-lg bg-[#344BC2] text-amber-300">
              <Users className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-sm text-[#344BC2]">Living Cultural Heritage</h5>
            <p className="text-[11px] text-[#159E37] font-ethiopic font-semibold">የባህል ቅርስ ጥበቃ</p>
            <p className="text-xs text-[#344BC2]/75 leading-relaxed">
              Keeping our ancestral coffee ceremonies, music, and banquet arts vibrant for future generations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
