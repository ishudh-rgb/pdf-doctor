import type { LegalDocument } from "./index";

export const cookiesLegal: Record<"en" | "hi", LegalDocument> = {
  en: {
    pageTitle: "Cookie Policy",
    lastUpdated: "June 5, 2026",
    sections: [
      {
        title: "What are cookies?",
        paragraphs: [
          "Cookies are small text files on your device. OnlyMyPDF uses them for security, preferences, and — with consent — analytics or marketing.",
        ],
      },
      {
        title: "Cookie categories",
        bullets: [
          "Essential (always on): authentication, security, guest session, load balancing.",
          "Analytics (optional): anonymous usage statistics — disabled until you accept.",
          "Marketing (optional): ad personalization if ads are enabled — disabled until you accept.",
        ],
      },
      {
        title: "Managing preferences",
        paragraphs: [
          "Use the cookie banner or Dashboard → Privacy & data to accept, reject, or reset preferences.",
        ],
      },
      {
        title: "Third-party cookies",
        paragraphs: [
          "Payment (Razorpay) or analytics providers may set cookies when you use those features. See their policies for details.",
        ],
      },
    ],
  },
  hi: {
    pageTitle: "कुकी नीति",
    lastUpdated: "5 जून, 2026",
    sections: [
      {
        title: "कुकीज़ क्या हैं?",
        paragraphs: [
          "कुकीज़ छोटी टेक्स्ट फ़ाइलें हैं। OnlyMyPDF सुरक्षा, प्राथमिकताओं और — सहमति पर — analytics/marketing के लिए उनका उपयोग करता है।",
        ],
      },
      {
        title: "कुकी श्रेणियाँ",
        bullets: [
          "आवश्यक (हमेशा): प्रमाणीकरण, सुरक्षा, गेस्ट सेशन, लोड बैलेंसिंग।",
          "Analytics (वैकल्पिक): अनाम उपयोग आँकड़े — स्वीकृति तक बंद।",
          "Marketing (वैकल्पिक): विज्ञापन — स्वीकृति तक बंद।",
        ],
      },
      {
        title: "प्राथमिकताएँ प्रबंधित करें",
        paragraphs: [
          "कुकी बैनर या डैशबोर्ड → Privacy & data से स्वीकार/अस्वीकार/रीसेट करें।",
        ],
      },
      {
        title: "तृतीय-पक्ष कुकीज़",
        paragraphs: [
          "Razorpay या analytics प्रदाता संबंधित फीचर्स पर कुकी सेट कर सकते हैं। विवरण के लिए उनकी नीतियाँ देखें।",
        ],
      },
    ],
  },
};
