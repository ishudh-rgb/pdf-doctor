import { FILE_LIMITS, SUPPORT_EMAIL, formatFileSizeMarketingLabel } from "@/config/constants";
import type { LegalDocument } from "./index";

const freeMb = FILE_LIMITS.maxFreeFileSizeMB;
const proMb = FILE_LIMITS.maxProFileSizeMB;
const freeSizeLabel = formatFileSizeMarketingLabel(freeMb);
const proSizeLabel = formatFileSizeMarketingLabel(proMb);

export const termsLegal: Record<"en" | "hi", LegalDocument> = {
  en: {
    pageTitle: "Terms of Service",
    lastUpdated: "May 22, 2026",
    sections: [
      {
        title: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing or using OnlyMyPDF (\"the Service\"), you agree to these Terms of Service. If you do not agree, do not use the Service.",
          "We may update these terms at any time. Continued use after changes constitutes acceptance.",
        ],
      },
      {
        title: "2. Description of Service",
        paragraphs: [
          "OnlyMyPDF provides online PDF tools including merge, split, compress, convert, edit, sign, protect, and AI summarization.",
          "The Service is available in a free tier (daily usage limits) and a paid Pro tier (enhanced limits and features).",
        ],
      },
      {
        title: "3. User Accounts",
        bullets: [
          "Provide accurate registration information and keep credentials secure.",
          "You are responsible for activity under your account.",
          "Guest users may access basic tools with stricter limits.",
        ],
      },
      {
        title: "4. Acceptable Use",
        bullets: [
          "Do not upload unlawful, harmful, or copyrighted content without permission.",
          "Do not attempt to bypass usage limits, security, or access other users' data.",
          "Do not use automated scraping or denial-of-service against the Service.",
        ],
      },
      {
        title: "5. File Upload Policy",
        bullets: [
          "Auto-deletion: files are deleted after 2 hours (free) or 24 hours (Pro).",
          `File size: Free — ${freeSizeLabel}; Pro — ${proSizeLabel}.`,
          "Daily limits: Free — 5 tool uses/day; Pro — 100 tool uses/day.",
          "Supported formats vary by tool (PDF, Office, images, HTML, etc.).",
        ],
      },
      {
        title: "6. Payment and Subscriptions",
        bullets: [
          "Pro plans are billed via Razorpay in INR (monthly or yearly).",
          "Subscriptions renew unless cancelled before the billing date.",
          "Refunds follow our refund policy and applicable law.",
        ],
      },
      {
        title: "7. Intellectual Property",
        paragraphs: [
          "You retain ownership of files you upload. You grant us a limited license to process files solely to provide the Service.",
          "OnlyMyPDF branding, software, and site content remain our property.",
        ],
      },
      {
        title: "8. Disclaimer of Warranties",
        paragraphs: [
          "The Service is provided \"as is\" without warranties of any kind. We do not guarantee conversion accuracy for every document.",
        ],
      },
      {
        title: "9. Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by law, OnlyMyPDF is not liable for indirect or consequential damages arising from use of the Service.",
        ],
      },
      {
        title: "10. Contact",
        paragraphs: [`Questions about these terms: ${SUPPORT_EMAIL}`],
      },
    ],
  },
  hi: {
    pageTitle: "सेवा की शर्तें",
    lastUpdated: "22 मई, 2026",
    sections: [
      {
        title: "1. शर्तों की स्वीकृति",
        paragraphs: [
          "OnlyMyPDF (\"सेवा\") का उपयोग करके आप इन सेवा की शर्तों से बंधे होते हैं। असहमति होने पर सेवा का उपयोग न करें।",
          "हम किसी भी समय शर्तें अपडेट कर सकते हैं। बदलाव के बाद उपयोग जारी रखना स्वीकृति माना जाएगा।",
        ],
      },
      {
        title: "2. सेवा का विवरण",
        paragraphs: [
          "OnlyMyPDF मर्ज, स्प्लिट, कम्प्रेस, कन्वर्ट, एडिट, साइन, प्रोटेक्ट और AI सारांश सहित ऑनलाइन PDF टूल्स प्रदान करता है।",
          "सेवा फ्री टियर (दैनिक सीमा) और Pro टियर (बढ़ी हुई सीमा और फीचर्स) में उपलब्ध है।",
        ],
      },
      {
        title: "3. उपयोगकर्ता खाते",
        bullets: [
          "सही पंजीकरण जानकारी दें और क्रेडेंशियल सुरक्षित रखें।",
          "अपने खाते के अंतर्गत गतिविधि की जिम्मेदारी आपकी है।",
          "गेस्ट उपयोगकर्ता सख्त सीमाओं के साथ बुनियादी टूल्स उपयोग कर सकते हैं।",
        ],
      },
      {
        title: "4. स्वीकार्य उपयोग",
        bullets: [
          "गैर-कानूनी, हानिकारक या बिना अनुमति कॉपीराइट सामग्री अपलोड न करें।",
          "उपयोग सीमा, सुरक्षा या अन्य उपयोगकर्ताओं के डेटा तक पहुँच बायपास न करें।",
          "सेवा पर स्वचालित स्क्रैपिंग या DOS हमले न करें।",
        ],
      },
      {
        title: "5. फ़ाइल अपलोड नीति",
        bullets: [
          "ऑटो-डिलीट: फ्री — 2 घंटे; Pro — 24 घंटे के बाद फ़ाइलें हटाई जाती हैं।",
          `फ़ाइल साइज़: फ्री — ${freeSizeLabel}; Pro — ${proSizeLabel}.`,
          "दैनिक सीमा: फ्री — 5 उपयोग/दिन; Pro — 100 उपयोग/दिन।",
          "समर्थित फॉर्मैट टूल के अनुसार (PDF, Office, इमेज, HTML, आदि)।",
        ],
      },
      {
        title: "6. भुगतान और सब्सक्रिप्शन",
        bullets: [
          "Pro प्लान Razorpay के ज़रिए INR में (मासिक/वार्षिक) बिल होते हैं।",
          "बिलिंग तिथि से पहले रद्द न करने पर सब्सक्रिप्शन नवीनीकृत होता है।",
          "रिफंड हमारी रिफंड नीति और लागू कानून के अनुसार।",
        ],
      },
      {
        title: "7. बौद्धिक संपदा",
        paragraphs: [
          "अपलोड की गई फ़ाइलों का स्वामित्व आपका रहता है। सेवा देने के लिए सीमित प्रसंस्करण लाइसेंस आप हमें देते हैं।",
          "OnlyMyPDF ब्रांडिंग, सॉफ़्टवेयर और साइट सामग्री हमारी संपत्ति है।",
        ],
      },
      {
        title: "8. वारंटी अस्वीकरण",
        paragraphs: [
          "सेवा \"जैसी है\" आधार पर दी जाती है। हर दस्तावेज़ के लिए रूपांतरण की पूर्ण सटीकता की गारंटी नहीं।",
        ],
      },
      {
        title: "9. दायित्व की सीमा",
        paragraphs: [
          "कानून द्वारा अनुमत अधिकतम सीमा तक, अप्रत्यक्ष या परिणामी नुकसान के लिए OnlyMyPDF उत्तरदायी नहीं।",
        ],
      },
      {
        title: "10. संपर्क",
        paragraphs: [`शर्तों से संबंधित प्रश्न: ${SUPPORT_EMAIL}`],
      },
    ],
  },
};
