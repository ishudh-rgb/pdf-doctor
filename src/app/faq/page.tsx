"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  name: string;
  questions: FaqItem[];
}

const faqData: FaqCategory[] = [
  {
    name: "General",
    questions: [
      {
        question: "What is PDF Doctor?",
        answer:
          "PDF Doctor is a free online PDF toolkit that lets you merge, split, compress, convert, edit, sign, protect, unlock, scan, and summarize PDF documents. It's designed to be fast, secure, and easy to use — no desktop software required.",
      },
      {
        question: "Is PDF Doctor free to use?",
        answer:
          "Yes! PDF Doctor offers a generous free tier with 5 tool uses per day and support for files up to 25 MB. For power users who need more, our Pro plan offers 100 daily uses, 200 MB file size limits, AI tools, and more.",
      },
      {
        question: "Do I need to create an account?",
        answer:
          "No, you can use basic PDF tools as a guest without creating an account. However, creating a free account lets you track your file history, manage downloads, and upgrade to Pro for additional features.",
      },
      {
        question: "What file formats are supported?",
        answer:
          "PDF Doctor primarily works with PDF files. Depending on the tool, we also support DOCX, DOC (Word documents), JPG, JPEG, and PNG (images). Each tool page specifies its accepted file formats.",
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
          "Free users can upload files up to 25 MB per file. Pro users enjoy an increased limit of 200 MB per file, making it suitable for large documents, presentations, and scanned PDFs.",
      },
      {
        question: "How accurate is PDF to Word conversion?",
        answer:
          "Our PDF to Word conversion preserves most formatting, text, images, and layout. However, complex documents with intricate formatting, custom fonts, or unusual layouts may not convert perfectly. We recommend reviewing the output and making manual adjustments if needed.",
      },
      {
        question: "What does the AI PDF Summarizer do?",
        answer:
          "The AI PDF Summarizer reads your entire PDF document and generates a concise summary including key points, action items, and important dates. It's powered by advanced AI models and is available exclusively to Pro users.",
      },
      {
        question: "How does the PDF Scanner work?",
        answer:
          "The PDF Scanner uses your device's camera to capture documents and converts them into clean, high-quality PDF files. It automatically detects edges, corrects perspective, and enhances readability.",
      },
    ],
  },
  {
    name: "Privacy & Security",
    questions: [
      {
        question: "Are my files safe?",
        answer:
          "Absolutely. All files are transmitted over encrypted connections (TLS/SSL), processed in isolated environments, and stored with encryption at rest. No PDF Doctor employee ever accesses your file contents.",
      },
      {
        question: "How long are files stored?",
        answer:
          "Files are automatically and permanently deleted after 2 hours for free users, and after 24 hours for Pro users. Once deleted, files cannot be recovered. You can also manually delete files before the retention period expires.",
      },
      {
        question: "Is my data encrypted?",
        answer:
          "Yes. All data in transit is protected with TLS/SSL encryption. Files stored on our servers use encryption at rest. Your account credentials are hashed and salted using industry-standard algorithms.",
      },
      {
        question: "Do you share my files with anyone?",
        answer:
          "No. We never share, sell, or provide access to your uploaded files to any third party. Files are processed solely for the purpose of performing the requested operation and are then deleted.",
      },
    ],
  },
  {
    name: "Account & Billing",
    questions: [
      {
        question: "What is included in the Pro plan?",
        answer:
          "The Pro plan includes 100 tool uses per day, 200 MB file size limit, access to all tools (including Edit PDF, Sign PDF, and AI Summarizer), priority processing speed, no ads, 24-hour file retention, batch processing, and priority email support.",
      },
      {
        question: "How do I upgrade to Pro?",
        answer:
          "You can upgrade to Pro from the Pricing page or your Dashboard. Click 'Upgrade to Pro', choose monthly or yearly billing, and complete payment through Razorpay. Your Pro features activate immediately.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept all major credit and debit cards, UPI, net banking, and digital wallets through Razorpay. All transactions are processed securely in Indian Rupees (INR).",
      },
      {
        question: "Can I cancel my subscription?",
        answer:
          "Yes, you can cancel your Pro subscription at any time from your Dashboard. You'll continue to have Pro access until the end of your current billing period. No partial refunds are issued for the remaining days.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "We offer a 7-day money-back guarantee on new Pro subscriptions. If you're not satisfied within the first 7 days, contact our support team for a full refund. Refunds are not available after 7 days or for renewal payments.",
      },
    ],
  },
  {
    name: "Technical",
    questions: [
      {
        question: "Why did my PDF conversion fail?",
        answer:
          "Conversions can fail due to corrupted PDF files, password-protected documents (use Unlock PDF first), files exceeding size limits, or extremely complex formatting. Try re-uploading the file or using a different tool. If the issue persists, contact support.",
      },
      {
        question: "What browsers are supported?",
        answer:
          "PDF Doctor works on all modern browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, and Opera. We recommend using the latest version of your browser for the best experience.",
      },
      {
        question: "Is there a mobile app?",
        answer:
          "PDF Doctor is a web-based application that works on any device with a browser, including smartphones and tablets. We don't currently have a native mobile app, but our website is fully responsive and optimized for mobile use.",
      },
      {
        question: "Can I use PDF Doctor offline?",
        answer:
          "No, PDF Doctor requires an internet connection as all file processing happens on our secure cloud servers. This ensures we can handle large files and complex operations without taxing your device.",
      },
    ],
  },
];

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  function toggleItem(key: string) {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Find answers to common questions about PDF Doctor. Can&apos;t find
              what you&apos;re looking for?{" "}
              <a href="/contact" className="text-blue-600 hover:underline">
                Contact us
              </a>
              .
            </p>
          </div>

          <div className="mt-12 space-y-10">
            {faqData.map((category) => (
              <section key={category.name}>
                <h2 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h2>
                <div className="mt-4 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
                  {category.questions.map((item) => {
                    const key = `${category.name}-${item.question}`;
                    const isOpen = openItems[key] ?? false;
                    return (
                      <div key={key}>
                        <button
                          onClick={() => toggleItem(key)}
                          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                        >
                          <span>{item.question}</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4">
                            <p className="text-sm leading-relaxed text-gray-600">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
      </div>
    </div>
  );
}
