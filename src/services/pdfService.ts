import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GameAttempt, GameId, SeminarHallId } from '../types';
import { GAME_DEFINITIONS } from '../data/gamesData';
import { HALL_NAMES } from './gameService';

interface GeneratePdfOptions {
  hallId: SeminarHallId;
  adminUsername: string;
  gameId: GameId;
  attempts: GameAttempt[];
}

export function generateHallGamePdf({
  hallId,
  adminUsername,
  gameId,
  attempts,
}: GeneratePdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const game = GAME_DEFINITIONS[gameId];
  const hallName = HALL_NAMES[hallId];

  // Hall accent colors for PDF banner:
  // Hall 1: Google Blue (#1A73E8 = [26, 115, 232])
  // Hall 2: Google Green (#188038 = [24, 128, 56])
  // Hall 3: Google Amber (#B06000 = [176, 96, 0])
  const accentColor: [number, number, number] =
    hallId === 'HALL_1'
      ? [26, 115, 232]
      : hallId === 'HALL_2'
      ? [24, 128, 56]
      : [176, 96, 0];

  // 1. Header Banner
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 210, 38, 'F');

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TECH QUEST', 14, 16);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('ORIENTATION PROGRAM 2026  •  OFFICIAL RESULTS REPORT', 14, 23);

  doc.setFontSize(9);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  // Hall badge on top right of banner
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(138, 9, 58, 20, 3, 3, 'F');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(hallName.toUpperCase(), 167, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(95, 99, 104);
  doc.setFont('helvetica', 'normal');
  doc.text(`Admin: ${adminUsername}`, 167, 24, { align: 'center' });

  // 2. Metadata Cards Section
  doc.setTextColor(31, 31, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Game: ${game.name}`, 14, 48);

  const completedCount = attempts.filter((a) => a.status === 'completed').length;
  const notCompletedCount = attempts.length - completedCount;

  // Stats Box
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(218, 220, 224);
  doc.roundedRect(14, 52, 182, 18, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(95, 99, 104);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Participants', 24, 59);
  doc.text('Completed Attempts', 74, 59);
  doc.text('Incomplete / Stopped', 126, 59);
  doc.text('Max Possible Score', 170, 59, { align: 'right' });

  doc.setFontSize(12);
  doc.setTextColor(31, 31, 31);
  doc.setFont('helvetica', 'bold');
  doc.text(attempts.length.toString(), 24, 66);
  doc.setTextColor(24, 128, 56); // Green
  doc.text(completedCount.toString(), 74, 66);
  doc.setTextColor(217, 48, 37); // Red
  doc.text(notCompletedCount.toString(), 126, 66);
  doc.setTextColor(31, 31, 31);
  doc.text(`${game.questionCount} pts`, 170, 66, { align: 'right' });

  // 3. Prepare Leaderboard Sorted Data
  // Ranking logic: score DESC -> timeTaken ASC -> completedAt ASC
  const sortedAttempts = [...attempts].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.timeTaken !== b.timeTaken) {
      return a.timeTaken - b.timeTaken;
    }
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return aTime - bTime;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const tableData = sortedAttempts.map((att, idx) => {
    const isCompleted = att.status === 'completed';
    const rankDisplay = isCompleted ? (idx + 1).toString() : '-';
    const timeDisplay = formatTime(att.timeTaken);
    const completedAtDisplay = att.completedAt
      ? new Date(att.completedAt).toLocaleTimeString()
      : 'Incomplete';
    const statusDisplay =
      att.status === 'completed'
        ? 'Completed'
        : att.status === 'stopped_by_admin'
        ? 'Stopped by Admin'
        : 'In Progress';

    return [
      rankDisplay,
      att.admissionNumber,
      `${att.score} / ${att.totalQuestions}`,
      timeDisplay,
      completedAtDisplay,
      statusDisplay,
    ];
  });

  // 4. Render Table
  autoTable(doc, {
    startY: 76,
    head: [['Rank', 'Admission Number', 'Score', 'Time Taken', 'Completed At', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      textColor: [31, 31, 31],
      lineColor: [232, 234, 237],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      1: { halign: 'left', cellWidth: 44, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 36 },
      5: { halign: 'center', cellWidth: 34 },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageStr = `Page ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(154, 160, 166);
      doc.text(
        `TECH QUEST 2026  •  ${hallName}  •  ${game.name}`,
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        pageStr,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    },
  });

  // 5. Filename formatting per spec:
  // e.g. SeminarHall1_GuessTheLogo_Results.pdf
  const sanitizedHall = hallName.replace(/\s+/g, '');
  const sanitizedGame = game.name.replace(/\s+/g, '');
  const filename = `${sanitizedHall}_${sanitizedGame}_Results.pdf`;

  doc.save(filename);
}

export interface GenerateStudentScorecardOptions {
  admissionNumber: string;
  hallId: SeminarHallId;
  hallName: string;
  attempts: GameAttempt[];
}

export function generateStudentScorecardPdf({
  admissionNumber,
  hallId,
  hallName,
  attempts,
}: GenerateStudentScorecardOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const accentColor: [number, number, number] =
    hallId === 'HALL_1'
      ? [26, 115, 232]
      : hallId === 'HALL_2'
      ? [24, 128, 56]
      : [176, 96, 0];

  // 1. Header Banner
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DEVPATH 2.O', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('ORIENTATION 2026  •  OFFICIAL STUDENT SCORECARD', 14, 24);

  doc.setFontSize(8.5);
  doc.text('GDG on Campus Sri Vasavi Engineering College  ×  AIKYAM', 14, 32);

  // Student details badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(130, 8, 66, 26, 3, 3, 'F');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ADMISSION NUMBER', 163, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(31, 31, 31);
  doc.text(admissionNumber, 163, 22, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(95, 99, 104);
  doc.text(hallName, 163, 29, { align: 'center' });

  // 2. Summary stats
  const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalPossible = attempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);
  const overallPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
  const totalTimeSeconds = attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
  };

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(218, 220, 224);
  doc.roundedRect(14, 50, 182, 22, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(95, 99, 104);
  doc.text('Challenges Completed', 24, 57);
  doc.text('Total Points Earned', 74, 57);
  doc.text('Accuracy Rating', 124, 57);
  doc.text('Total Time Taken', 168, 57, { align: 'right' });

  doc.setFontSize(13);
  doc.setTextColor(31, 31, 31);
  doc.setFont('helvetica', 'bold');
  doc.text(`${attempts.length} / 6`, 24, 66);
  doc.text(`${totalScore} / ${totalPossible}`, 74, 66);
  doc.setTextColor(24, 128, 56);
  doc.text(`${overallPercentage}%`, 124, 66);
  doc.setTextColor(31, 31, 31);
  doc.text(formatSecs(totalTimeSeconds), 168, 66, { align: 'right' });

  // 3. Challenge Results Table
  const tableData = Object.values(GAME_DEFINITIONS).map((def, idx) => {
    const att = attempts.find((a) => a.gameId === def.id);
    if (att) {
      const pct = att.totalQuestions > 0 ? Math.round((att.score / att.totalQuestions) * 100) : 0;
      return [
        (idx + 1).toString(),
        def.name,
        `${att.score} / ${att.totalQuestions}`,
        `${pct}%`,
        `${att.timeTaken}s`,
        att.completedAt ? new Date(att.completedAt).toLocaleTimeString() : 'Completed',
        'COMPLETED',
      ];
    }
    return [
      (idx + 1).toString(),
      def.name,
      '-',
      '-',
      '-',
      '-',
      'PENDING',
    ];
  });

  autoTable(doc, {
    startY: 80,
    head: [['#', 'Challenge Name', 'Score', 'Accuracy', 'Time', 'Completed At', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3.5,
      textColor: [31, 31, 31],
      lineColor: [232, 234, 237],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
      1: { halign: 'left', cellWidth: 52, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 32 },
      6: { halign: 'center', cellWidth: 26 },
    },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(154, 160, 166);
      doc.text(
        `DevPath 2.O  •  GDG on Campus SVEC × AIKYAM  •  ${admissionNumber}`,
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    },
  });

  const cleanAd = admissionNumber.replace(/\//g, '_');
  doc.save(`DevPath_${cleanAd}_Scorecard.pdf`);
}
