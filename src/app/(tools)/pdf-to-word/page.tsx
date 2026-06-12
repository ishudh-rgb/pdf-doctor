'use client';

import { PdfToWordToolPage } from '@/components/tools/pdf-to-word-tool-page';

export default function PdfToWordPage() {
  return (
    <PdfToWordToolPage
      relatedTools={[
        { name: 'Word to PDF', href: '/word-to-pdf' },
        { name: 'Merge PDF', href: '/merge-pdf' },
        { name: 'Compress PDF', href: '/compress-pdf' },
        { name: 'Split PDF', href: '/split-pdf' },
      ]}
    />
  );
}
