"use client";

import { Star, Quote } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils/cn";

interface Testimonial {
  name: string;
  role: string;
  country: string;
  flag: string;
  rating: number;
  text: string;
  avatar: string;
  accent: string;
}

const TESTIMONIALS: Testimonial[] = [
  { name: "Priya Sharma", role: "Freelance Designer", country: "India", flag: "🇮🇳", rating: 5, text: "PDF Doctor saved me hours of work. The merge and compress tools are blazing fast, and the quality is perfect every time.", avatar: "PS", accent: "from-pink-500 to-rose-600" },
  { name: "James Wilson", role: "Marketing Manager", country: "USA", flag: "🇺🇸", rating: 5, text: "Switched from Adobe Acrobat. PDF Doctor does everything I need for free — convert, edit, sign. The UI is clean and intuitive.", avatar: "JW", accent: "from-blue-500 to-indigo-600" },
  { name: "Aisha Mohammed", role: "University Student", country: "UAE", flag: "🇦🇪", rating: 5, text: "I use PDF Doctor daily for my assignments. Converting Word to PDF and merging files is so easy. Best free PDF tool online!", avatar: "AM", accent: "from-emerald-500 to-teal-600" },
  { name: "Carlos Mendoza", role: "Accountant", country: "Mexico", flag: "🇲🇽", rating: 5, text: "The PDF to Excel converter is incredible. It extracted all my tables perfectly — something other tools always messed up.", avatar: "CM", accent: "from-amber-500 to-orange-600" },
  { name: "Sophie Laurent", role: "Legal Assistant", country: "France", flag: "🇫🇷", rating: 5, text: "I feel safe uploading confidential documents. The 256-bit encryption and auto-delete after 2 hours give me peace of mind.", avatar: "SL", accent: "from-violet-500 to-purple-600" },
  { name: "Takeshi Yamamoto", role: "Software Engineer", country: "Japan", flag: "🇯🇵", rating: 5, text: "Clean interface, fast processing, no bloatware. The HTML to PDF converter renders my documentation perfectly.", avatar: "TY", accent: "from-cyan-500 to-sky-600" },
  { name: "Fatima Al-Hassan", role: "Teacher", country: "Saudi Arabia", flag: "🇸🇦", rating: 5, text: "My students love the simplicity. Upload, process, download — three steps and they have their converted PDF ready.", avatar: "FH", accent: "from-rose-500 to-pink-600" },
  { name: "Liam O'Brien", role: "Startup Founder", country: "Ireland", flag: "🇮🇪", rating: 5, text: "We use PDF Doctor across our entire team. The batch processing and no file size limits are game-changers for us.", avatar: "LO", accent: "from-green-500 to-emerald-600" },
  { name: "Chen Wei", role: "Finance Analyst", country: "China", flag: "🇨🇳", rating: 5, text: "The PDF to PowerPoint conversion is spot-on. Every slide, chart, and image comes through perfectly. Highly recommended!", avatar: "CW", accent: "from-red-500 to-rose-600" },
  { name: "Maria Santos", role: "HR Manager", country: "Brazil", flag: "🇧🇷", rating: 5, text: "We process hundreds of employee documents weekly. PDF Doctor handles large files without breaking a sweat. Love the speed!", avatar: "MS", accent: "from-yellow-500 to-amber-600" },
  { name: "David Kim", role: "Graphic Designer", country: "South Korea", flag: "🇰🇷", rating: 5, text: "JPG to PDF and the compress tool keep my design portfolio looking sharp while keeping file sizes manageable.", avatar: "DK", accent: "from-indigo-500 to-blue-600" },
  { name: "Elena Popov", role: "Researcher", country: "Russia", flag: "🇷🇺", rating: 5, text: "The AI PDF Summarizer saves me so much time reviewing papers. It extracts key points accurately. A must-have for academics.", avatar: "EP", accent: "from-purple-500 to-violet-600" },
  { name: "Michael Thompson", role: "Real Estate Agent", country: "Canada", flag: "🇨🇦", rating: 5, text: "I sign and edit contracts on the go. Works great on my phone and tablet — no app download needed.", avatar: "MT", accent: "from-teal-500 to-cyan-600" },
  { name: "Anya Müller", role: "Project Manager", country: "Germany", flag: "🇩🇪", rating: 5, text: "Organized 200+ pages using the rotate, delete, and extract tools. The page preview is fantastic!", avatar: "AM", accent: "from-orange-500 to-red-600" },
  { name: "Raj Patel", role: "CA Student", country: "India", flag: "🇮🇳", rating: 5, text: "PDF Doctor's Excel to PDF and PDF to Excel tools are accurate. No formatting issues. Perfect for financial statements.", avatar: "RP", accent: "from-blue-600 to-indigo-700" },
  { name: "Emma Johnson", role: "Content Writer", country: "UK", flag: "🇬🇧", rating: 5, text: "The TXT to PDF converter with font options is brilliant. I convert my manuscripts with Courier font — looks professional.", avatar: "EJ", accent: "from-fuchsia-500 to-pink-600" },
  { name: "Ahmed El-Said", role: "IT Specialist", country: "Egypt", flag: "🇪🇬", rating: 4, text: "Great tool for converting and protecting PDFs. The password protection feature is reliable. Would love dark mode next!", avatar: "AE", accent: "from-sky-500 to-blue-600" },
  { name: "Yuki Tanaka", role: "Photographer", country: "Japan", flag: "🇯🇵", rating: 5, text: "I convert my photo collections to PDF catalogs. The JPG to PDF tool preserves image quality perfectly.", avatar: "YT", accent: "from-lime-500 to-green-600" },
  { name: "Isabella Rossi", role: "Lawyer", country: "Italy", flag: "🇮🇹", rating: 5, text: "Privacy is non-negotiable for legal work. PDF Doctor's GDPR compliance and auto-deletion policy earned my trust.", avatar: "IR", accent: "from-red-600 to-rose-700" },
  { name: "Lucas Silva", role: "Data Analyst", country: "Portugal", flag: "🇵🇹", rating: 5, text: "Extracted tables from 50+ page reports flawlessly. The converter understood my complex multi-column layouts.", avatar: "LS", accent: "from-emerald-600 to-teal-700" },
  { name: "Zara Nkosi", role: "NGO Coordinator", country: "South Africa", flag: "🇿🇦", rating: 5, text: "We work with limited internet. PDF Doctor loads fast, processes quickly, and compressed files are easy to share.", avatar: "ZN", accent: "from-amber-600 to-yellow-700" },
  { name: "Oliver Brown", role: "College Professor", country: "Australia", flag: "🇦🇺", rating: 5, text: "The split PDF tool is exactly what I needed for separating exam papers. Each student gets their individual section.", avatar: "OB", accent: "from-violet-600 to-purple-700" },
  { name: "Mei Lin", role: "E-commerce Owner", country: "Singapore", flag: "🇸🇬", rating: 5, text: "I create product catalogs by merging multiple PDFs. The drag-and-drop interface makes it super easy.", avatar: "ML", accent: "from-cyan-600 to-sky-700" },
  { name: "Andrei Volkov", role: "Architect", country: "Ukraine", flag: "🇺🇦", rating: 5, text: "Large blueprint PDFs compressed to half size without losing clarity. My clients can download plans much faster.", avatar: "AV", accent: "from-blue-500 to-cyan-600" },
  { name: "Nina Johansson", role: "Journalist", country: "Sweden", flag: "🇸🇪", rating: 5, text: "Quick, reliable, and free. I convert interview transcripts and research docs to PDF daily. Never had an issue.", avatar: "NJ", accent: "from-indigo-600 to-violet-700" },
  { name: "Kofi Asante", role: "Business Owner", country: "Ghana", flag: "🇬🇭", rating: 5, text: "PDF Doctor helps me create professional invoices. The Word to PDF conversion is flawless — clients are impressed.", avatar: "KA", accent: "from-green-600 to-emerald-700" },
  { name: "Hana Park", role: "UX Designer", country: "South Korea", flag: "🇰🇷", rating: 5, text: "The extract pages tool with live preview is so well designed. Finally a PDF tool that cares about UX!", avatar: "HP", accent: "from-pink-600 to-fuchsia-700" },
  { name: "Marco Bianchi", role: "Sales Director", country: "Italy", flag: "🇮🇹", rating: 5, text: "Our sales team sends proposals daily. PDF Doctor's merge + compress workflow means we never miss a deadline.", avatar: "MB", accent: "from-orange-600 to-red-700" },
  { name: "Deepika Reddy", role: "Medical Student", country: "India", flag: "🇮🇳", rating: 5, text: "Rotating and organizing my scanned notes is a breeze. The page zoom preview helps me check everything.", avatar: "DR", accent: "from-teal-600 to-cyan-700" },
  { name: "Thomas Anderson", role: "Consultant", country: "USA", flag: "🇺🇸", rating: 5, text: "I've tried every PDF tool out there. PDF Doctor strikes the perfect balance between simplicity and power.", avatar: "TA", accent: "from-slate-500 to-gray-700" },
  { name: "Sara García", role: "Translator", country: "Spain", flag: "🇪🇸", rating: 5, text: "Converting documents between formats while preserving layout is crucial. PDF Doctor handles it perfectly.", avatar: "SG", accent: "from-rose-600 to-pink-700" },
  { name: "Daniel Okafor", role: "Civil Engineer", country: "Nigeria", flag: "🇳🇬", rating: 5, text: "The watermark feature is great for marking draft documents. Clean, professional, and flexible positioning.", avatar: "DO", accent: "from-amber-500 to-yellow-600" },
];

const ROW1 = TESTIMONIALS.slice(0, 16);
const ROW2 = TESTIMONIALS.slice(16);

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

function MarqueeRow({ items, reverse = false }: { items: Testimonial[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-track relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-pd-background to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-pd-background to-transparent sm:w-24" />

      <div
        className="flex w-max gap-4 py-2"
        style={{
          animation: `${reverse ? "marquee-reverse" : "marquee"} 80s linear infinite`,
        }}
      >
        {doubled.map((t, i) => (
          <div key={i} className="w-[320px] shrink-0 sm:w-[340px]">
            <TestimonialCard testimonial={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden bg-pd-background pd-section sm:py-20">
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      <div className="relative">
        <div className="pd-container">
          <div className="mb-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              Loved by thousands
            </span>
          </div>
          <SectionHeading
            title="What Our Users Say"
            description="Trusted by students, professionals, and teams across 50+ countries"
          />
        </div>

        {/* Marquee rows */}
        <div className="mt-10 space-y-4">
          <MarqueeRow items={ROW1} />
          <MarqueeRow items={ROW2} reverse />
        </div>

        {/* Summary stats */}
        <div className="pd-container">
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-extrabold text-gray-900">4.9 <span className="text-base font-normal text-gray-400">/ 5</span></p>
              <p className="mt-0.5 text-xs font-medium text-gray-400">Average Rating</p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-extrabold text-gray-900">10,000+</p>
              <p className="mt-0.5 text-xs font-medium text-gray-400">Happy Users</p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-extrabold text-gray-900">50+</p>
              <p className="mt-0.5 text-xs font-medium text-gray-400">Countries</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <div className={cn(
      "group relative h-full overflow-hidden rounded-xl border border-white/80 bg-white p-4",
      "shadow-[0_1px_8px_-2px_rgba(0,0,0,0.06)]",
      "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)]"
    )}>
      <Quote className="absolute -right-1 -top-1 h-10 w-10 rotate-180 text-gray-50" />

      <div className="relative">
        <StarRating rating={t.rating} />
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-gray-600">
          &ldquo;{t.text}&rdquo;
        </p>

        <div className="mt-3 flex items-center gap-2.5 border-t border-gray-50 pt-3">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white shadow-sm",
            t.accent
          )}>
            {t.avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-gray-800">{t.name}</p>
            <p className="truncate text-[11px] text-gray-400">
              {t.role} · {t.flag} {t.country}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
