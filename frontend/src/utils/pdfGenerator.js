import { jsPDF } from 'jspdf';

// Theme colors matching the website
const THEME = {
  primary: '#9d2235', // VJTI Maroon
  accent: '#d4a017',  // Gold
  textDark: '#1a1a2e',
  textLight: '#888899',
  lightBg: '#f0f2f5',
  white: '#ffffff',
  lightPink: '#fdf0f2',
};

export const generateStudentAchievementsPDF = (achievements, filters = {}) => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 4;

    // Helper functions
    const addPage = () => {
      pdf.addPage();
      yPosition = 15;
    };

    const checkPageSpace = (space = 10) => {
      if (yPosition > pageHeight - space) {
        addPage();
      }
    };

    const addWrappedText = (text, fontSize, fontType = 'normal', maxWidth = contentWidth, color = THEME.textDark) => {
      pdf.setFontSize(fontSize);
      pdf.setFont(undefined, fontType);
      pdf.setTextColor(...hexToRgb(color));
      const lines = pdf.splitTextToSize(String(text), maxWidth);
      lines.forEach((line) => {
        checkPageSpace(lineHeight + 2);
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Header with decorative line
    pdf.setFillColor(...hexToRgb(THEME.primary));
    pdf.rect(0, 0, pageWidth, 22, 'F');

    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('VJTI Student Achievements', margin, 12);

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Hall of Excellence Report', margin, 18);

    yPosition = 28;

    // Timestamp and info
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...hexToRgb(THEME.textLight));
    const timestamp = new Date().toLocaleString('en-IN');
    pdf.text(`Generated on: ${timestamp}`, margin, yPosition);
    yPosition += 5;

    // Filter summary
    if (Object.keys(filters).length > 0) {
      checkPageSpace(15);
      pdf.setFillColor(...hexToRgb(THEME.lightPink));
      pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, 12, 'F');

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...hexToRgb(THEME.primary));
      pdf.text('Filters Applied:', margin, yPosition + 2);
      yPosition += 6;

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(...hexToRgb(THEME.textDark));

      if (filters.category && filters.category !== 'All') {
        pdf.text(`• Category: ${filters.category}`, margin + 2, yPosition);
        yPosition += 4;
      }
      if (filters.department && filters.department !== 'All') {
        pdf.text(`• Department: ${filters.department}`, margin + 2, yPosition);
        yPosition += 4;
      }
      if (filters.status && filters.status !== 'All') {
        pdf.text(`• Status: ${filters.status}`, margin + 2, yPosition);
        yPosition += 4;
      }
      if (filters.level && filters.level !== 'All') {
        pdf.text(`• Level: ${filters.level}`, margin + 2, yPosition);
        yPosition += 4;
      }
      if (filters.search) {
        pdf.text(`• Search: "${filters.search}"`, margin + 2, yPosition);
        yPosition += 4;
      }

      yPosition += 3;
    }

    // Summary stats
    checkPageSpace(20);
    pdf.setFillColor(...hexToRgb(THEME.lightBg));
    pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, 14, 'F');

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...hexToRgb(THEME.primary));
    pdf.text(`Total Achievements: ${achievements.length}`, margin + 2, yPosition + 2);

    yPosition += 12;

    // Achievements list
    checkPageSpace(15);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...hexToRgb(THEME.textDark));
    pdf.text('Achievements List', margin, yPosition);
    yPosition += 8;

    // Table header
    const colWidth = [60, 35, 35, 30];
    const headers = ['Title / Student', 'Category', 'Level', 'Date'];

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(...hexToRgb(THEME.primary));

    let xPos = margin;
    headers.forEach((header, i) => {
      pdf.rect(xPos, yPosition, colWidth[i], 6, 'F');
      pdf.text(header, xPos + 2, yPosition + 4);
      xPos += colWidth[i];
    });

    yPosition += 8;

    // Table rows
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...hexToRgb(THEME.textDark));

    achievements.forEach((achievement, index) => {
      checkPageSpace(10);

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(...hexToRgb(THEME.lightBg));
        xPos = margin;
        headers.forEach((_, i) => {
          pdf.rect(xPos, yPosition, colWidth[i], 6, 'F');
          xPos += colWidth[i];
        });
      }

      xPos = margin;

      // Title / Student
      const studentName = achievement.name || 'N/A';
      const title = (achievement.title || '').substring(0, 35);
      const cellText = `${title}\nBy: ${studentName}`;
      const lines = pdf.splitTextToSize(cellText, colWidth[0] - 3);
      lines.forEach((line, idx) => {
        pdf.text(line, xPos + 1, yPosition + 2 + idx * 2.5);
      });

      xPos += colWidth[0];

      // Category
      const category = (achievement.category_name || 'N/A').substring(0, 15);
      pdf.text(category, xPos + 1, yPosition + 4);

      xPos += colWidth[1];

      // Level
      const level = (achievement.level || 'N/A').substring(0, 10);
      pdf.text(level, xPos + 1, yPosition + 4);

      xPos += colWidth[2];

      // Date
      const date = achievement.created_at
        ? new Date(achievement.created_at).toLocaleDateString('en-IN')
        : 'N/A';
      pdf.text(date, xPos + 1, yPosition + 4);

      yPosition += 8;
    });

    // Footer with page numbers
    const totalPages = pdf.internal.getNumberOfPages();
    pdf.setFontSize(7);
    pdf.setTextColor(...hexToRgb(THEME.textLight));

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );

      // Decorative footer line
      pdf.setDrawColor(...hexToRgb(THEME.primary));
      pdf.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);
    }

    return pdf;
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
};

export const generateAdminReportPDF = (data) => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 4;

    const checkPageSpace = (space = 10) => {
      if (yPosition > pageHeight - space) {
        pdf.addPage();
        yPosition = 15;
      }
    };

    const addWrappedText = (text, fontSize, fontType = 'normal', maxWidth = contentWidth, color = THEME.textDark) => {
      pdf.setFontSize(fontSize);
      pdf.setFont(undefined, fontType);
      pdf.setTextColor(...hexToRgb(color));
      const lines = pdf.splitTextToSize(String(text), maxWidth);
      lines.forEach((line) => {
        checkPageSpace(lineHeight + 2);
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Header
    pdf.setFillColor(...hexToRgb(THEME.primary));
    pdf.rect(0, 0, pageWidth, 22, 'F');

    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('NBA Admin Report', margin, 12);

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text(data.title || 'Administrative Data Export', margin, 18);

    yPosition = 28;

    // Timestamp
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...hexToRgb(THEME.textLight));
    const timestamp = new Date().toLocaleString('en-IN');
    pdf.text(`Generated on: ${timestamp}`, margin, yPosition);
    yPosition += 6;

    // Filters
    if (data.filters && Object.keys(data.filters).length > 0) {
      checkPageSpace(15);
      pdf.setFillColor(...hexToRgb(THEME.lightPink));
      pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, 12, 'F');

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...hexToRgb(THEME.primary));
      pdf.text('Active Filters:', margin, yPosition + 2);
      yPosition += 5;

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(...hexToRgb(THEME.textDark));

      const filterEntries = Object.entries(data.filters).filter(([_, v]) => v && v !== 'all' && v !== '');
      filterEntries.forEach(([key, value]) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        pdf.text(`• ${label}: ${value}`, margin + 2, yPosition);
        yPosition += 3;
      });

      yPosition += 3;
    }

    // Content sections
    if (data.sections) {
      data.sections.forEach((section) => {
        checkPageSpace(15);

        // Section title with accent line
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(...hexToRgb(THEME.primary));
        pdf.line(margin, yPosition + 0.5, margin + 30, yPosition + 0.5);

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...hexToRgb(THEME.primary));
        pdf.text(section.title, margin + 32, yPosition);
        yPosition += 6;

        // Section content
        if (section.stats) {
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(...hexToRgb(THEME.textDark));

          Object.entries(section.stats).forEach(([key, value]) => {
            pdf.text(`${key}: ${value}`, margin + 2, yPosition);
            yPosition += 4;
          });

          yPosition += 2;
        }

        if (section.items) {
          pdf.setFontSize(8);
          section.items.forEach((item) => {
            checkPageSpace(8);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(...hexToRgb(THEME.primary));
            pdf.text(item.title, margin + 2, yPosition);
            yPosition += 3;

            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(...hexToRgb(THEME.textDark));
            if (item.details) {
              item.details.forEach((detail) => {
                pdf.text(`• ${detail}`, margin + 4, yPosition);
                yPosition += 3;
              });
            }
            yPosition += 1;
          });
        }
      });
    }

    // Footer
    const totalPages = pdf.internal.getNumberOfPages();
    pdf.setFontSize(7);
    pdf.setTextColor(...hexToRgb(THEME.textLight));

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
      pdf.setDrawColor(...hexToRgb(THEME.primary));
      pdf.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);
    }

    return pdf;
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
};

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}
