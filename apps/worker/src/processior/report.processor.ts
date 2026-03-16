import PDFDocument from 'pdfkit';
import {
  logger,
  minioUploadBuffer,
  minioGetPresignedUrl,
  minioBuildObjectName,
} from '@dam/config';

import { sendReportEmail } from '@dam/mail';
import { line, sectionTitle, kv, table } from '../helper/pdfKIt.helper.js';
import { fetchDashboardData } from '../helper/dashboardData.js';

interface ReportJob {
  scope: 'platform' | 'org' | 'project';
  scopeId?: number;
  requestedBy: number;
  email: string;
  range: { from: string; to: string };
}

export async function processReport(job: ReportJob): Promise<void> {
  const { scope, scopeId, email, range } = job;

  const dateRange = {
    from: new Date(range.from),
    to: new Date(range.to),
  };

  logger.info('Processing report job', { scope, scopeId, email });

  const data = await fetchDashboardData(scope, scopeId, dateRange);
  const buffer = await generatePDF(data, { scope, dateRange });

  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];
  const objectName = `reports/${scope}${scopeId ? `_${scopeId}` : ''}_${fromStr}_${toStr}_${Date.now()}.pdf`;

  await minioUploadBuffer(buffer, objectName, 'application/pdf');
  logger.info('Report uploaded to MinIO', { objectName });

  const downloadUrl = await minioGetPresignedUrl(objectName, 24 * 60 * 60);

  await sendReportEmail(email, buffer, { scope, fromStr, toStr });

  logger.info('Report job done', { scope, scopeId, email });
}

function generatePDF(
  data: any,
  meta: { scope: string; dateRange: { from: Date; to: Date } },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fromStr = meta.dateRange.from.toISOString().split('T')[0];
    const toStr = meta.dateRange.to.toISOString().split('T')[0];

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('DAM Analytics Report', { align: 'center' });
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#444')
      .text(`Scope: ${meta.scope.toUpperCase()}`, { align: 'center' });
    doc
      .fontSize(10)
      .fillColor('#888')
      .text(`Period: ${fromStr} to ${toStr}`, { align: 'center' });
    doc.moveDown();
    line(doc);
    doc.moveDown();

    if (data.overview) {
      sectionTitle(doc, 'Overview');
      const ov = data.overview;
      if (ov.orgs)
        kv(doc, 'Total Orgs', `${ov.orgs.total}  (Active: ${ov.orgs.active})`);
      if (ov.users)
        kv(
          doc,
          'Total Users',
          `${ov.users.total}  (New in period: ${ov.users.newInRange})`,
        );
      if (ov.projects)
        kv(
          doc,
          'Projects',
          `${ov.projects.total}  (Active: ${ov.projects.active})`,
        );
      if (ov.tasks) kv(doc, 'Total Tasks', ov.tasks.total);
      if (ov.members !== undefined) kv(doc, 'Members', ov.members);
      if (ov.assets)
        kv(
          doc,
          'Total Assets',
          `${ov.assets.total}  (${(ov.assets.totalSize / 1048576).toFixed(1)} MB)`,
        );
      if (ov.storage) {
        const pct =
          ov.storage.percent ??
          Math.round((ov.storage.usedBytes / ov.storage.limitBytes) * 100);
        kv(
          doc,
          'Storage Used',
          `${(ov.storage.usedBytes / 1073741824).toFixed(2)} GB  of  ${(ov.storage.limitBytes / 1073741824).toFixed(2)} GB  (${pct}%)`,
        );
      }
      if (ov.hoursLogged !== undefined) kv(doc, 'Hours Logged', ov.hoursLogged);
      doc.moveDown();
    }

    if (data.tasks) {
      sectionTitle(doc, 'Tasks');
      if (data.tasks.byStatus?.length) {
        table(
          doc,
          ['Status', 'Count'],
          data.tasks.byStatus.map((t: any) => [t.status, t.count]),
        );
      }
      if (data.tasks.byPriority?.length) {
        doc.moveDown(0.5);
        table(
          doc,
          ['Priority', 'Count'],
          data.tasks.byPriority.map((t: any) => [t.priority, t.count]),
        );
      }
      if (data.tasks.completionRate !== undefined) {
        doc.moveDown(0.3);
        kv(doc, 'Completion Rate', `${data.tasks.completionRate}%`);
        kv(doc, 'Overdue', data.tasks.overdue ?? 0);
      }
      doc.moveDown();
    }

    if (data.approvals) {
      sectionTitle(doc, 'Approvals');
      const ap = data.approvals;
      if (ap.byStatus?.length) {
        table(
          doc,
          ['Status', 'Count'],
          ap.byStatus.map((a: any) => [a.status, a.count]),
        );
      } else {
        kv(doc, 'Total', ap.total ?? 0);
        kv(doc, 'Pending', ap.pending ?? 0);
        kv(doc, 'Approved', ap.approved ?? 0);
        kv(doc, 'Rejected', ap.rejected ?? 0);
        kv(
          doc,
          'Approval Rate',
          ap.approvalRate != null ? `${ap.approvalRate}%` : '...',
        );
        kv(
          doc,
          'Avg Review Time',
          ap.avgReviewHours != null ? `${ap.avgReviewHours} hrs` : '...',
        );
      }
      doc.moveDown();
    }

    if (data.members?.length) {
      sectionTitle(doc, 'Members');
      table(
        doc,
        ['Member', 'Role', 'Tasks Done', 'Hours', 'Assets'],
        data.members.map((m: any) => [
          m.username,
          m.role ?? '...',
          m.tasksDone ?? m.tasks?.done ?? 0,
          m.hoursLogged ?? 0,
          m.assetsUploaded ?? 0,
        ]),
      );
      doc.moveDown();
    }

    if (data.assets) {
      sectionTitle(doc, 'Assets');
      kv(doc, 'Total', data.assets.total ?? 0);
      kv(
        doc,
        'Total Size',
        `${((data.assets.totalSize ?? 0) / 1048576).toFixed(1)} MB`,
      );
      kv(doc, 'Finalized', data.assets.finalized?.total ?? 0);
      if (data.assets.byType?.length) {
        doc.moveDown(0.3);
        table(
          doc,
          ['File Type', 'Count', 'Size (MB)'],
          data.assets.byType.map((a: any) => [
            a.fileType,
            a.count,
            (a.totalSize / 1048576).toFixed(1),
          ]),
        );
      }
      doc.moveDown();
    }

    if (data.timeLogs) {
      sectionTitle(doc, 'Time Logs');
      kv(doc, 'Total Hours', data.timeLogs.totalHours ?? 0);
      if (data.timeLogs.byMember?.length) {
        doc.moveDown(0.3);
        table(
          doc,
          ['Member', 'Hours'],
          data.timeLogs.byMember.map((m: any) => [m.username, m.hours]),
        );
      }
      doc.moveDown();
    }

    if (data.projects?.length) {
      sectionTitle(doc, 'Projects');
      table(
        doc,
        ['Name', 'Status', 'Tasks', 'Members'],
        data.projects.map((p: any) => [p.name, p.status, p.tasks, p.members]),
      );
      doc.moveDown();
    }

    if (data.orgs?.length) {
      sectionTitle(doc, 'Organizations');
      table(
        doc,
        ['Name', 'Status', 'Members', 'Projects', 'Storage %'],
        data.orgs.map((o: any) => [
          o.name,
          o.status,
          o.members,
          o.projects,
          `${o.storagePercent}%`,
        ]),
      );
      doc.moveDown();
    }

    doc
      .fontSize(8)
      .fillColor('#aaa')
      .text(
        `Generated on ${new Date().toUTCString()} · DAM Platform`,
        50,
        780,
        { align: 'center' },
      );

    doc.end();
  });
}
