/**
 * Bulk Export Utilities
 * Handles various export formats for patent data
 */

import { jsPDF } from 'jspdf';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'xml';
  includeMetadata?: boolean;
  includeAbstracts?: boolean;
  includeClaims?: boolean;
  customFields?: string[];
}

export class BulkExporter {
  private static formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  private static sanitizeForCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  static exportToCSV(patents: any[], options: ExportOptions = {}): Blob {
    const headers = [
      'Patent Number',
      'Title',
      'Assignee',
      'Publication Date',
      'Status',
      'Jurisdiction',
      'Inventors',
      'Citations'
    ];

    if (options.includeAbstracts) {
      headers.push('Abstract');
    }

    if (options.includeMetadata) {
      headers.push('Filing Date', 'Expiry Date', 'Priority Date');
    }

    const csvContent = [
      headers.join(','),
      ...patents.map(patent => {
        const row = [
          this.sanitizeForCSV(patent.patent_number),
          this.sanitizeForCSV(patent.title),
          this.sanitizeForCSV(patent.assignee),
          this.sanitizeForCSV(this.formatDate(patent.publication_date)),
          this.sanitizeForCSV(patent.status),
          this.sanitizeForCSV(patent.jurisdiction),
          this.sanitizeForCSV(patent.inventors?.join('; ') || ''),
          this.sanitizeForCSV(patent.citation_count || 0)
        ];

        if (options.includeAbstracts) {
          row.push(this.sanitizeForCSV(patent.abstract || ''));
        }

        if (options.includeMetadata) {
          row.push(
            this.sanitizeForCSV(patent.filing_date ? this.formatDate(patent.filing_date) : ''),
            this.sanitizeForCSV(patent.expiry_date ? this.formatDate(patent.expiry_date) : ''),
            this.sanitizeForCSV(patent.priority_date ? this.formatDate(patent.priority_date) : '')
          );
        }

        return row.join(',');
      })
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  static exportToJSON(patents: any[], options: ExportOptions = {}): Blob {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: patents.length,
        format: 'json',
        options
      },
      patents: patents.map(patent => {
        const exportPatent: any = {
          patent_number: patent.patent_number,
          title: patent.title,
          assignee: patent.assignee,
          publication_date: patent.publication_date,
          status: patent.status,
          jurisdiction: patent.jurisdiction,
          inventors: patent.inventors || [],
          citation_count: patent.citation_count || 0
        };

        if (options.includeAbstracts && patent.abstract) {
          exportPatent.abstract = patent.abstract;
        }

        if (options.includeMetadata) {
          exportPatent.filing_date = patent.filing_date;
          exportPatent.expiry_date = patent.expiry_date;
          exportPatent.priority_date = patent.priority_date;
          exportPatent.family_id = patent.family_id;
          exportPatent.legal_status = patent.legal_status;
        }

        if (options.includeClaims && patent.claims) {
          exportPatent.claims = patent.claims;
        }

        return exportPatent;
      })
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  }

  static exportToPDF(patents: any[], options: ExportOptions = {}): Blob {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.text('Patent Search Results', margin, yPosition);
    yPosition += 15;

    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    doc.text(`Total Patents: ${patents.length}`, pageWidth - margin - 50, yPosition);
    yPosition += 15;

    doc.setFontSize(8);

    patents.forEach((patent, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = margin;
      }

      // Patent number and title
      doc.setFont(undefined, 'bold');
      doc.text(`${patent.patent_number}`, margin, yPosition);
      yPosition += 5;

      doc.setFont(undefined, 'normal');
      const titleLines = doc.splitTextToSize(patent.title, pageWidth - 2 * margin);
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 4;

      // Patent details
      const details = [
        `Assignee: ${patent.assignee}`,
        `Publication: ${this.formatDate(patent.publication_date)}`,
        `Status: ${patent.status}`,
        `Jurisdiction: ${patent.jurisdiction}`
      ];

      if (patent.inventors && patent.inventors.length > 0) {
        details.push(`Inventors: ${patent.inventors.slice(0, 3).join(', ')}${patent.inventors.length > 3 ? ` +${patent.inventors.length - 3} more` : ''}`);
      }

      details.forEach(detail => {
        doc.text(detail, margin, yPosition);
        yPosition += 4;
      });

      // Abstract if requested
      if (options.includeAbstracts && patent.abstract) {
        yPosition += 3;
        doc.setFont(undefined, 'bold');
        doc.text('Abstract:', margin, yPosition);
        yPosition += 4;
        
        doc.setFont(undefined, 'normal');
        const abstractLines = doc.splitTextToSize(patent.abstract, pageWidth - 2 * margin);
        doc.text(abstractLines.slice(0, 8), margin, yPosition); // Limit abstract length
        yPosition += Math.min(abstractLines.length, 8) * 3;
      }

      yPosition += 8; // Space between patents
    });

    return doc.output('blob');
  }

  static exportToXML(patents: any[], options: ExportOptions = {}): Blob {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const rootOpen = '<patents>\n';
    const rootClose = '</patents>';

    const xmlContent = patents.map(patent => {
      let patentXml = '  <patent>\n';
      patentXml += `    <patent_number>${this.escapeXML(patent.patent_number)}</patent_number>\n`;
      patentXml += `    <title>${this.escapeXML(patent.title)}</title>\n`;
      patentXml += `    <assignee>${this.escapeXML(patent.assignee)}</assignee>\n`;
      patentXml += `    <publication_date>${patent.publication_date}</publication_date>\n`;
      patentXml += `    <status>${this.escapeXML(patent.status)}</status>\n`;
      patentXml += `    <jurisdiction>${this.escapeXML(patent.jurisdiction)}</jurisdiction>\n`;
      
      if (patent.inventors && patent.inventors.length > 0) {
        patentXml += '    <inventors>\n';
        patent.inventors.forEach((inventor: string) => {
          patentXml += `      <inventor>${this.escapeXML(inventor)}</inventor>\n`;
        });
        patentXml += '    </inventors>\n';
      }

      if (patent.citation_count) {
        patentXml += `    <citation_count>${patent.citation_count}</citation_count>\n`;
      }

      if (options.includeAbstracts && patent.abstract) {
        patentXml += `    <abstract>${this.escapeXML(patent.abstract)}</abstract>\n`;
      }

      patentXml += '  </patent>\n';
      return patentXml;
    }).join('');

    const fullXml = xmlHeader + rootOpen + xmlContent + rootClose;
    return new Blob([fullXml], { type: 'application/xml' });
  }

  private static escapeXML(str: string): string {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async bulkExport(
    patents: any[], 
    format: ExportOptions['format'], 
    options: ExportOptions = {}
  ): Promise<void> {
    let blob: Blob;
    let filename: string;

    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `patent_search_results_${timestamp}`;

    switch (format) {
      case 'csv':
        blob = this.exportToCSV(patents, options);
        filename = `${baseFilename}.csv`;
        break;
      case 'json':
        blob = this.exportToJSON(patents, options);
        filename = `${baseFilename}.json`;
        break;
      case 'pdf':
        blob = this.exportToPDF(patents, options);
        filename = `${baseFilename}.pdf`;
        break;
      case 'xml':
        blob = this.exportToXML(patents, options);
        filename = `${baseFilename}.xml`;
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    this.downloadBlob(blob, filename);
  }
}