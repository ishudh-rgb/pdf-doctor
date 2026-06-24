export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  name: string;
  questions: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    name: "General",
    questions: [
      {
        question: "What is OnlyMyPDF?",
        answer:
          "OnlyMyPDF is a free online PDF toolkit that lets you merge, split, compress, convert, edit, sign, protect, unlock, scan, and summarize PDF documents. It's designed to be fast, secure, and easy to use — no desktop software required.",
      },
      {
        question: "Is OnlyMyPDF free to use?",
        answer:
          "Yes! OnlyMyPDF offers a generous free tier with 5 tool uses per day and no file size limit. For power users who need more, our Pro plan offers 100 daily uses, AI tools, priority processing, and more.",
      },
      {
        question: "Do I need to create an account?",
        answer:
          "No, you can use basic PDF tools as a guest without creating an account. However, creating a free account lets you track your file history, manage downloads, and upgrade to Pro for additional features.",
      },
      {
        question: "What file formats are supported?",
        answer:
          "OnlyMyPDF primarily works with PDF files. Depending on the tool, we also support DOCX, DOC (Word documents), JPG, JPEG, and PNG (images). Each tool page specifies its accepted file formats.",
      },
    ],
  },
  {
    name: "Tools",
    questions: [
      {
        question: "How do I merge PDF files?",
        answer:
          "Navigate to the Merge PDF tool, upload multiple PDF files (drag and drop or click to browse), arrange them in your desired order, and click 'Merge'. Your combined PDF will be ready to download within seconds.",
      },
      {
        question: "What is the maximum file size I can upload?",
        answer:
          "There is no file size limit — upload PDFs and documents of any size on every tool.",
      },
      {
        question: "How accurate is PDF to Word conversion?",
        answer:
          "Our PDF to Word conversion preserves most formatting, text, images, and layout. However, complex documents with intricate formatting, custom fonts, or unusual layouts may not convert perfectly.",
      },
      {
        question: "What does the AI PDF Summarizer do?",
        answer:
          "The AI PDF Summarizer reads your entire PDF document and generates a concise summary including key points, action items, and important dates. It's available exclusively to Pro users.",
      },
      {
        question: "How does the PDF Scanner work?",
        answer:
          "The PDF Scanner uses your device's camera to capture documents and converts them into clean, high-quality PDF files with edge detection and perspective correction.",
      },
    ],
  },
  {
    name: "Privacy & Security",
    questions: [
      {
        question: "Are my files safe?",
        answer:
          "Absolutely. All files are transmitted over encrypted connections (TLS/SSL), processed in isolated environments, and stored with encryption at rest.",
      },
      {
        question: "How long are files stored?",
        answer:
          "Files are automatically deleted after 2 hours for free users, and after 24 hours for Pro users. You can also manually delete files before the retention period expires.",
      },
      {
        question: "Is my data encrypted?",
        answer:
          "Yes. All data in transit is protected with TLS/SSL encryption. Files stored on our servers use encryption at rest.",
      },
      {
        question: "Do you share my files with anyone?",
        answer:
          "No. We never share, sell, or provide access to your uploaded files to any third party.",
      },
    ],
  },
  {
    name: "Account & Billing",
    questions: [
      {
        question: "What is included in the Pro plan?",
        answer:
          "The Pro plan includes 100 tool uses per day, no file size limit, all tools including Sign PDF and AI Summarizer, priority processing, no ads, and priority email support.",
      },
      {
        question: "How do I upgrade to Pro?",
        answer:
          "You can upgrade to Pro from the Pricing page or your Dashboard. Complete payment through Razorpay and Pro features activate immediately.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept credit/debit cards, UPI, net banking, and digital wallets through Razorpay. All transactions are processed securely in INR.",
      },
      {
        question: "Can I cancel my subscription?",
        answer:
          "Yes, you can cancel your Pro subscription at any time from your Dashboard. You'll continue to have Pro access until the end of your current billing period.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "We offer a 7-day money-back guarantee on new Pro subscriptions. Contact support within 7 days for a full refund.",
      },
    ],
  },
  {
    name: "Technical",
    questions: [
      {
        question: "Why did my PDF conversion fail?",
        answer:
          "Conversions can fail due to corrupted PDFs, password protection, files exceeding size limits, or complex formatting. Try Unlock PDF first or contact support.",
      },
      {
        question: "What browsers are supported?",
        answer:
          "OnlyMyPDF works on Chrome, Firefox, Edge, Safari, and Opera. We recommend using the latest version for the best experience.",
      },
      {
        question: "Is there a mobile app?",
        answer:
          "OnlyMyPDF is a responsive web application optimized for mobile browsers. We don't currently have a native mobile app.",
      },
      {
        question: "Can I use OnlyMyPDF offline?",
        answer:
          "No, OnlyMyPDF requires an internet connection as all file processing happens on our secure cloud servers.",
      },
    ],
  },
];

export function getAllFaqItems(): FaqItem[] {
  return FAQ_CATEGORIES.flatMap((category) => category.questions);
}
