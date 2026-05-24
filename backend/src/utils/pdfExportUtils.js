/**
 * PDF Export Utility
 * Generate PDF reports using PDFKit
 */

const PDFDocument = require('pdfkit');

/**
 * Create a PDF document with headers and styling
 */
const createBasicPDF = (title, subtitle = null) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text(title, { underline: true });

  if (subtitle) {
    doc.fontSize(12).font('Helvetica').text(subtitle, { link: null });
  }

  // Generate timestamp
  const timestamp = new Date().toLocaleString();
  doc.fontSize(9).fillColor('#666666').text(`Generated: ${timestamp}`, { align: 'right' });

  doc.moveDown(0.5);

  return doc;
};

/**
 * Add a table to PDF
 */
const addTableToPDF = (doc, columns, rows, options = {}) => {
  const {
    columnWidths = null,
    rowHeight = 25,
    headerBg = '#333333',
    headerColor = '#FFFFFF',
    alternateRowBg = '#F5F5F5',
  } = options;

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const calculatedColumnWidths = columnWidths || columns.map(() => pageWidth / columns.length);

  let x = doc.page.margins.left;
  let y = doc.y;

  // Draw header
  doc.fillColor(headerBg);
  doc.rect(x, y, pageWidth, rowHeight).fill();

  doc.fillColor(headerColor).fontSize(10).font('Helvetica-Bold');
  columns.forEach((col, i) => {
    doc.text(col, x + 5 + (i > 0 ? calculatedColumnWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0), y + 5, {
      width: calculatedColumnWidths[i] - 10,
      align: 'left',
    });
  });

  y += rowHeight;

  // Draw rows
  rows.forEach((row, rowIndex) => {
    const bg = rowIndex % 2 === 0 ? '#FFFFFF' : alternateRowBg;
    doc.fillColor(bg);
    doc.rect(x, y, pageWidth, rowHeight).fill();

    doc.fillColor('#000000').fontSize(9).font('Helvetica');
    row.forEach((cell, i) => {
      doc.text(String(cell), x + 5 + (i > 0 ? calculatedColumnWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0), y + 5, {
        width: calculatedColumnWidths[i] - 10,
        align: 'left',
      });
    });

    y += rowHeight;

    // Check if need new page
    if (y > doc.page.height - 40) {
      doc.addPage();
      y = doc.page.margins.top;
    }
  });

  doc.y = y;
  return doc;
};

/**
 * Add metrics section to PDF
 */
const addMetricsSection = (doc, title, metrics) => {
  doc.fontSize(14).font('Helvetica-Bold').text(title);
  doc.moveDown(0.3);

  const metricsPerRow = 2;
  let currentRow = 0;
  let startY = doc.y;

  metrics.forEach((metric, index) => {
    const isNewRow = index % metricsPerRow === 0;

    if (isNewRow && index > 0) {
      doc.y = startY + 80;
      startY = doc.y;
    }

    const x = doc.page.margins.left + (index % metricsPerRow) * (doc.page.width / 2 - 20);
    const y = doc.y;

    // Metric box
    doc.rect(x, y, 180, 70).stroke();

    // Label
    doc.fontSize(10).font('Helvetica-Bold').text(metric.label, x + 10, y + 10, { width: 160 });

    // Value
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937').text(String(metric.value), x + 10, y + 30, { width: 160 });

    // Unit
    if (metric.unit) {
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280').text(metric.unit, x + 10, y + 50, { width: 160 });
    }

    doc.fillColor('#000000');
  });

  doc.moveDown(4);
};

/**
 * Generate overview metrics PDF
 */
const generateOverviewMetricsPDF = (metrics, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'Overview Metrics Report');

  doc.moveDown();

  const metricsToDisplay = [
    { label: 'Total Referrals', value: metrics.totalReferrals || 0, unit: 'referrals' },
    { label: 'Active Internships', value: metrics.activeInternships || 0, unit: 'internships' },
    { label: 'Completed Internships', value: metrics.completedInternships || 0, unit: 'internships' },
    { label: 'SLA Breaches', value: metrics.slaBreaches || 0, unit: 'breaches' },
  ];

  addMetricsSection(doc, 'Key Metrics', metricsToDisplay);

  return doc;
};

/**
 * Generate onboarding funnel PDF
 */
const generateOnboardingFunnelPDF = (funnel, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'Onboarding Funnel Report');

  doc.moveDown();

  const columns = ['Stage', 'Count', 'Percentage'];
  const rows = funnel.map((item) => [item.stage || 'N/A', String(item.count || 0), `${item.percentage || 0}%`]);

  addTableToPDF(doc, columns, rows);

  return doc;
};

/**
 * Generate referral conversion PDF
 */
const generateReferralConversionPDF = (conversion, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'Referral Conversion Report');

  doc.moveDown();

  const metricsToDisplay = [
    { label: 'Total Referrals', value: conversion.total || 0, unit: 'referrals' },
    { label: 'Converted', value: conversion.converted || 0, unit: 'referrals' },
    { label: 'Conversion Rate', value: `${conversion.conversionRate || 0}%`, unit: 'rate' },
    { label: 'Rejection Rate', value: `${conversion.rejectionRate || 0}%`, unit: 'rate' },
    { label: 'Pending', value: conversion.pending || 0, unit: 'referrals' },
  ];

  addMetricsSection(doc, 'Conversion Metrics', metricsToDisplay);

  return doc;
};

/**
 * Generate SLA metrics PDF
 */
const generateSLAMetricsPDF = (slaData, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'SLA Performance Report');

  doc.moveDown();

  const metricsToDisplay = [
    { label: 'Total Items', value: slaData.total || 0, unit: 'items' },
    { label: 'On Time', value: slaData.onTime || 0, unit: 'items' },
    { label: 'Breached', value: slaData.breached || 0, unit: 'items' },
    { label: 'Compliance Rate', value: `${slaData.complianceRate || 0}%`, unit: 'rate' },
  ];

  addMetricsSection(doc, 'SLA Metrics', metricsToDisplay);

  return doc;
};

/**
 * Generate workflow bottlenecks PDF
 */
const generateWorkflowBottlenecksPDF = (bottlenecks, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'Workflow Bottlenecks Report');

  doc.moveDown();

  const columns = ['Workflow Stage', 'Count', 'Avg Days'];
  const rows = bottlenecks.map((item) => [
    item.stage || 'N/A',
    String(item.count || 0),
    String(item.avgDaysInStage || 0),
  ]);

  addTableToPDF(doc, columns, rows);

  return doc;
};

/**
 * Generate completion metrics PDF
 */
const generateCompletionMetricsPDF = (completion, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'Completion Metrics Report');

  doc.moveDown();

  const metricsToDisplay = [
    { label: 'Total', value: completion.total || 0, unit: 'internships' },
    { label: 'Completed', value: completion.completed || 0, unit: 'internships' },
    { label: 'Completion Rate', value: `${completion.completionRate || 0}%`, unit: 'rate' },
    { label: 'Active', value: completion.active || 0, unit: 'internships' },
    { label: 'Certificates Issued', value: completion.certificateIssued || 0, unit: 'certificates' },
  ];

  addMetricsSection(doc, 'Completion Metrics', metricsToDisplay);

  return doc;
};

/**
 * Generate mentor analytics PDF
 */
const generateMentorAnalyticsPDF = (mentors, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'Mentor Analytics Report');

  doc.moveDown();

  const columns = ['Mentor Name', 'Total Referrals', 'Completed', 'Active', 'Completion %'];
  const rows = mentors.slice(0, 20).map((mentor) => [
    mentor.mentorName || 'N/A',
    String(mentor.totalReferrals || 0),
    String(mentor.completed || 0),
    String(mentor.active || 0),
    `${mentor.completionRate || 0}%`,
  ]);

  addTableToPDF(doc, columns, rows);

  if (mentors.length > 20) {
    doc.fontSize(9).text(`... and ${mentors.length - 20} more mentors`);
  }

  return doc;
};

/**
 * Generate detailed report PDF
 */
const generateDetailedReportPDF = (records, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'Detailed Report');

  doc.moveDown();

  const columns = ['Candidate', 'Email', 'Status', 'Stage', 'Mentor'];
  const rows = records.slice(0, 30).map((record) => [
    record.candidateName || 'N/A',
    record.candidateEmail || 'N/A',
    record.status || 'N/A',
    record.workflowStage || 'N/A',
    record.mentorName || 'N/A',
  ]);

  addTableToPDF(doc, columns, rows, { columnWidths: [100, 150, 80, 100, 80] });

  if (records.length > 30) {
    doc.fontSize(9).text(`Total records: ${records.length} (Showing first 30)`);
  }

  return doc;
};

/**
 * Generate access provisioning PDF
 */
const generateAccessProvisioningPDF = (provisioning, filters = {}) => {
  const doc = createBasicPDF('Intern Flow Analytics', 'Access Provisioning Report');

  doc.moveDown();

  const metricsToDisplay = [
    { label: 'Total Requests', value: provisioning.total || 0, unit: 'requests' },
    { label: 'Pending', value: provisioning.pending || 0, unit: 'requests' },
    { label: 'Completed', value: provisioning.completed || 0, unit: 'requests' },
    { label: 'Completion Rate', value: `${provisioning.completionRate || 0}%`, unit: 'rate' },
  ];

  addMetricsSection(doc, 'Access Provisioning Metrics', metricsToDisplay);

  return doc;
};

module.exports = {
  createBasicPDF,
  addTableToPDF,
  addMetricsSection,
  generateOverviewMetricsPDF,
  generateOnboardingFunnelPDF,
  generateReferralConversionPDF,
  generateSLAMetricsPDF,
  generateWorkflowBottlenecksPDF,
  generateCompletionMetricsPDF,
  generateMentorAnalyticsPDF,
  generateDetailedReportPDF,
  generateAccessProvisioningPDF,
};
