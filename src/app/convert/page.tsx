import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  FileUp,
  Image as ImageIcon,
  Table,
  Presentation,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Convert PDF — PDF to Word, Excel, PowerPoint & More | PDF Doctor",
  description:
    "Convert files to and from PDF format. PDF to Word, Excel, PowerPoint, Word/Excel/PPT to PDF — free, fast, and secure.",
};

const convertTools = [
  {
    name: "PDF to Word",
    slug: "pdf-to-word",
    description: "Convert PDF files to editable Word documents (.docx).",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
    borderColor: "border-blue-200 hover:border-blue-300",
  },
  {
    name: "PDF to Excel",
    slug: "pdf-to-excel",
    description: "Extract PDF text and tables into an Excel spreadsheet (.xlsx).",
    icon: Table,
    color: "bg-green-100 text-green-700",
    borderColor: "border-green-200 hover:border-green-300",
  },
  {
    name: "PDF to PowerPoint",
    slug: "pdf-to-ppt",
    description: "Turn PDF pages into an editable PowerPoint presentation (.pptx).",
    icon: Presentation,
    color: "bg-orange-100 text-orange-700",
    borderColor: "border-orange-200 hover:border-orange-300",
  },
  {
    name: "Word to PDF",
    slug: "word-to-pdf",
    description: "Convert Word documents (.doc, .docx) to PDF format.",
    icon: FileUp,
    color: "bg-red-100 text-red-600",
    borderColor: "border-red-200 hover:border-red-300",
  },
  {
    name: "Excel to PDF",
    slug: "excel-to-pdf",
    description: "Convert Excel spreadsheets (.xls, .xlsx) to PDF documents.",
    icon: FileSpreadsheet,
    color: "bg-green-100 text-green-700",
    borderColor: "border-green-200 hover:border-green-300",
  },
  {
    name: "PowerPoint to PDF",
    slug: "ppt-to-pdf",
    description: "Convert PowerPoint presentations (.ppt, .pptx) to PDF.",
    icon: Presentation,
    color: "bg-orange-100 text-orange-700",
    borderColor: "border-orange-200 hover:border-orange-300",
  },
  {
    name: "JPG to PDF",
    slug: "jpg-to-pdf",
    description: "Convert JPG, PNG, and other images to PDF.",
    icon: ImageIcon,
    color: "bg-purple-100 text-purple-600",
    borderColor: "border-purple-200 hover:border-purple-300",
  },
];

export default function ConvertPage() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Convert PDF Files
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            Convert your documents to and from PDF format — free, fast, and secure.
          </p>
        </div>

        <div className="mt-14 grid gap-6">
          {convertTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className={`group flex items-start gap-5 rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${tool.borderColor}`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tool.color}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
