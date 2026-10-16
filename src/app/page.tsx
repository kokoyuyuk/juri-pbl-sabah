"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Lock,
  Unlock,
  ExternalLink,
  Search,
  Filter,
  Users,
  Settings,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  QrCode,
  FileSpreadsheet,
  ChevronRight,
  Info,
  Sparkles,
  Check,
  X,
} from "lucide-react";

// ============================================================================
// 1. DEFINISI JENIS DATA (TYPESCRIPT INTERFACES)
// ============================================================================

export type RoleId = "admin" | "juri1" | "juri2" | "juri3";
export type JudgeId = "juri1" | "juri2" | "juri3";

export type CategoryType =
  | "Sekolah Rendah"
  | "Sekolah Menengah"
  | "STEM-TVET"
  | "Pendidikan Khas";

export interface SubCriterion {
  id: string;
  code: string;
  text: string;
}

export interface RubricSection {
  id: string;
  code: string;
  title: string;
  weight: number; // Peratus pemberat (Jumlah mesti 100)
  subCriteria: SubCriterion[];
}

export interface Participant {
  id: string;
  code: string;
  schoolName: string;
  ppd: string;
  category: CategoryType;
  projectTitle: string;
  digitalProofUrl: string;
}

export interface JudgeEvaluation {
  participantId: string;
  judgeId: JudgeId;
  scores: Record<string, number>; // key: subCriterion.id, value: 1..5
  comment: string;
  status: "draft" | "submitted";
  updatedAt: string;
}

export interface CalculatedParticipantResult {
  participant: Participant;
  judgeTotals: Partial<Record<JudgeId, number>>;
  judgeStatuses: Partial<Record<JudgeId, "draft" | "submitted">>;
  judgeComments: Partial<Record<JudgeId, string>>;
  evaluatedCount: number;
  finalScore: number;
  avgSectionScores: Record<string, number>; // key: section.code (B1..B6)
  isOutlier: boolean;
  outlierGap: number;
  medal: "EMAS" | "PERAK" | "GANGSA" | "SIJIL PENYERTAAN" | "BELUM DINILAI";
  rank?: number;
  achievementLabel?: string;
  tieBreakerNote?: string;
}

// ============================================================================
// 2. DATA PRATETAP: RUBRIK STANDARD PBL JPN SABAH & DESKRIPTOR LIKERT
// ============================================================================

export const LIKERT_DESCRIPTORS: Record<
  number,
  { label: string; desc: string; color: string; activeBg: string }
> = {
  1: {
    label: "Lemah",
    desc: "Tiada bukti / maklumat sangat kabur dan tidak menepati keperluan asas PBL.",
    color: "text-red-700 border-red-300 bg-red-50",
    activeBg: "bg-red-600 text-white border-red-700 ring-2 ring-red-300",
  },
  2: {
    label: "Memuaskan",
    desc: "Ada pernyataan tetapi kurang jelas, bukti minimum, pelaksanaan masih berpusatkan guru.",
    color: "text-orange-700 border-orange-300 bg-orange-50",
    activeBg: "bg-orange-500 text-white border-orange-600 ring-2 ring-orange-300",
  },
  3: {
    label: "Baik",
    desc: "Menepati kriteria asas PBL, ada bukti pelaksanaan dan dokumentasi yang mencukupi.",
    color: "text-amber-700 border-amber-300 bg-amber-50",
    activeBg: "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300",
  },
  4: {
    label: "Sangat Baik",
    desc: "Pelaksanaan sistematik, bukti kukuh, berpusatkan murid, dan hubung kait jelas dengan DSKP/6C.",
    color: "text-blue-700 border-blue-300 bg-blue-50",
    activeBg: "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300",
  },
  5: {
    label: "Cemerlang",
    desc: "Sangat asli, berimpak tinggi kepada komuniti, bukti dokumentasi lengkap (termasuk Kod QR), mencapai standard teladan (TP6).",
    color: "text-emerald-700 border-emerald-300 bg-emerald-50",
    activeBg: "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300",
  },
};

export const DEFAULT_JPN_SABAH_RUBRIC: RubricSection[] = [
  {
    id: "sec-b1",
    code: "B1",
    title: "Perancangan & Merungkai Kurikulum / DSKP",
    weight: 15,
    subCriteria: [
      {
        id: "b1-1",
        code: "B1.1",
        text: "Ketepatan merungkai Standard Kandungan (SK), Standard Pembelajaran (SP), dan penjajaran dengan Standard Prestasi PBD (mensasarkan TP6).",
      },
      {
        id: "b1-2",
        code: "B1.2",
        text: "Kejelasan Big Idea (Idea Utama), Soalan Pencetus Idea (SPI / Essential Questions), dan kesepaduan merentas kurikulum (Interdisiplin).",
      },
    ],
  },
  {
    id: "sec-b2",
    code: "B2",
    title: "Proses Inkuiri & Pelaksanaan Projek",
    weight: 20,
    subCriteria: [
      {
        id: "b2-1",
        code: "B2.1",
        text: "Garis masa (Carta Gantt/Jadual Kerja) yang sistematik serta bukti penglibatan aktif murid (Student Voice & Choice) dalam proses inkuiri.",
      },
      {
        id: "b2-2",
        code: "B2.2",
        text: "Dokumentasi bukti proses pelaksanaan yang kukuh dan autentik (gambar berfasa, buku log, atau bukti digital melalui Kod QR pada poster).",
      },
    ],
  },
  {
    id: "sec-b3",
    code: "B3",
    title: "Penyelesaian Masalah, Inovasi & Impak",
    weight: 20,
    subCriteria: [
      {
        id: "b3-1",
        code: "B3.1",
        text: "Projek menyelesaikan masalah sebenar (kontekstual sekolah/komuniti), mempamerkan keaslian, kreativiti inovasi, dan kelestarian.",
      },
      {
        id: "b3-2",
        code: "B3.2",
        text: "Impak nyata dan boleh diukur terhadap peningkatan kemenjadian murid (pencapaian TP6) serta manfaat kepada komuniti setempat.",
      },
    ],
  },
  {
    id: "sec-b4",
    code: "B4",
    title: "Penerapan PAK21 (Elemen 6C) & Jalinan Kolaboratif",
    weight: 10,
    subCriteria: [
      {
        id: "b4-1",
        code: "B4.1",
        text: "Bukti jelas penerapan elemen 6C (Critical Thinking, Creativity, Collaboration, Communication, Character, Citizenship) dan KBAT.",
      },
      {
        id: "b4-2",
        code: "B4.2",
        text: "Wujud jalinan kolaboratif bermakna bersama warga sekolah, ibu bapa, komuniti setempat, atau agensi luar.",
      },
    ],
  },
  {
    id: "sec-b5",
    code: "B5",
    title: "Kualiti Visual & Reka Bentuk Poster",
    weight: 15,
    subCriteria: [
      {
        id: "b5-1",
        code: "B5.1",
        text: "Susun atur (layout) grafik yang sistematik, tipografi mudah dibaca, dan aliran penceritaan visual (visual storytelling) yang logik.",
      },
      {
        id: "b5-2",
        code: "B5.2",
        text: "Penggunaan infografik, carta/data, dan gambar bukti yang berinformasi serta bersifat self-explanatory (mudah difahami).",
      },
    ],
  },
  {
    id: "sec-b6",
    code: "B6",
    title: "Pembentangan, Komunikasi & Soal Jawab / Q&A",
    weight: 20,
    subCriteria: [
      {
        id: "b6-1",
        code: "B6.1",
        text: "Keyakinan, kelancaran komunikasi, kerjasama berpasukan, ketepatan masa, dan penguasaan penuh murid terhadap keseluruhan projek.",
      },
      {
        id: "b6-2",
        code: "B6.2",
        text: "Keupayaan menjawab soalan spontan panel juri secara kritis, tepat, matang, dan berasaskan bukti.",
      },
    ],
  },
];

export const SABAH_PPD_LIST = [
  "PPD Pitas",
  "PPD Kota Kinabalu",
  "PPD Kudat",
  "PPD Kota Marudu",
  "PPD Sandakan",
  "PPD Tawau",
  "PPD Penampang",
  "PPD Keningau",
  "PPD Lahad Datu",
  "PPD Papar",
  "PPD Tuaran",
  "PPD Ranau",
  "PPD Beaufort",
  "PPD Semporna",
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: "p-1",
    code: "PBL-SM-01",
    schoolName: "SMK Pinggan-Pinggan",
    ppd: "PPD Pitas",
    category: "Sekolah Menengah",
    projectTitle:
      "Agro-IoT Pitas: Sistem Pengairan Titis Pintar Berasaskan Tenaga Solar & Sensor Kelembapan Tanah untuk Kebun Komuniti",
    digitalProofUrl: "https://drive.google.com/drive/folders/simulasi-folio-pbl-sm01",
  },
  {
    id: "p-2",
    code: "PBL-SM-02",
    schoolName: "SMKA Tun Ahmadshah",
    ppd: "PPD Kota Kinabalu",
    category: "Sekolah Menengah",
    projectTitle:
      "Bio-Filter Kulit Lokan & Arang Tempurung: Inovasi Penurasan Air Kelabu Mesra Alam untuk Komuniti Pesisir Sabah",
    digitalProofUrl: "https://drive.google.com/drive/folders/simulasi-folio-pbl-sm02",
  },
  {
    id: "p-3",
    code: "PBL-SM-03",
    schoolName: "SMK Abdul Rahim",
    ppd: "PPD Kudat",
    category: "Sekolah Menengah",
    projectTitle:
      "Eko-Baja Rumpai Laut Kudat: Penghasilan Biostimulan Organik Cecair bagi Meningkatkan Hasil Tanaman Sayuran Hijau",
    digitalProofUrl: "https://drive.google.com/drive/folders/simulasi-folio-pbl-sm03",
  },
  {
    id: "p-4",
    code: "PBL-SM-04",
    schoolName: "SM St. Michael",
    ppd: "PPD Penampang",
    category: "Sekolah Menengah",
    projectTitle:
      "Flood-Alert Babagon: Sistem Amaran Awal Aras Air Sungai Berasaskan Komuniti & Peta Risiko Digital",
    digitalProofUrl: "https://drive.google.com/drive/folders/simulasi-folio-pbl-sm04",
  },
  {
    id: "p-5",
    code: "PBL-SR-01",
    schoolName: "SK Pekan Pitas II",
    ppd: "PPD Pitas",
    category: "Sekolah Rendah",
    projectTitle:
      "Kebun Dapur Lestari Cilik: Kit Hidroponik Botol Kitar Semula & Semburan Kawalan Serangga Organik Daun Semambu",
    digitalProofUrl: "https://drive.google.com/drive/folders/simulasi-folio-pbl-sr01",
  },
  {
    id: "p-6",
    code: "PBL-SR-02",
    schoolName: "SK Pekan Keningau",
    ppd: "PPD Keningau",
    category: "Sekolah Rendah",
    projectTitle:
      "Warisan Kraf Bambu Pedalaman: Digitalisasi Motif Tradisional Melalui Integrasi Matematik, Reka Bentuk & Seni Visual",
    digitalProofUrl: "https://drive.google.com/drive/folders/simulasi-folio-pbl-sr02",
  },
  {
    id: "p-7",
    code: "PBL-TVET-01",
    schoolName: "Kolej Vokasional Tawau",
    ppd: "PPD Tawau",
    category: "STEM-TVET",
    projectTitle:
      "Solar Aqua-Feeder: Sistem Pemberi Makan Ikan Tilapia Automatik Berasaskan Tenaga Suria & Kawalan Masa Pintar",
    digitalProofUrl: "https://drive.google.com/drive/folders/simulasi-folio-pbl-tvet01",
  },
  {
    id: "p-8",
    code: "PBL-PK-01",
    schoolName: "SMK Tandek (PPKI)",
    ppd: "PPD Kota Marudu",
    category: "Pendidikan Khas",
    projectTitle:
      "Taman Terapi Sensori Herba Borneo: Inovasi Produk Sabun & Lilin Aromaterapi Serai Wangi oleh Murid Berkeperluan Khas",
    digitalProofUrl: "https://drive.google.com/drive/folders/simulasi-folio-pbl-pk01",
  },
];

// Pratetap Markah Juri (Termasuk kes Tie-Breaker antara p-1 & p-2, dan kes Outlier pada p-3)
export const INITIAL_EVALUATIONS: JudgeEvaluation[] = [
  // P-1 (SMK Pinggan-Pinggan): Jumlah = 91.00% (Menang Tie-Breaker menerusi B3 = 20.00%)
  {
    participantId: "p-1",
    judgeId: "juri1",
    scores: {
      "b1-1": 4, "b1-2": 4, // B1 = 12.0
      "b2-1": 5, "b2-2": 4, // B2 = 18.0
      "b3-1": 5, "b3-2": 5, // B3 = 20.0
      "b4-1": 5, "b4-2": 4, // B4 = 9.0
      "b5-1": 4, "b5-2": 4, // B5 = 12.0
      "b6-1": 5, "b6-2": 5, // B6 = 20.0 -> Total = 91.0
    },
    comment: "Inovasi pengairan sangat praktikal untuk komuniti setempat. Bukti QR lengkap.",
    status: "submitted",
    updatedAt: "2026-10-16 09:30",
  },
  {
    participantId: "p-1",
    judgeId: "juri2",
    scores: {
      "b1-1": 4, "b1-2": 4,
      "b2-1": 4, "b2-2": 5,
      "b3-1": 5, "b3-2": 5,
      "b4-1": 4, "b4-2": 5,
      "b5-1": 4, "b5-2": 4,
      "b6-1": 5, "b6-2": 5, // Total = 91.0
    },
    comment: "Murid sangat menguasai konsep DSKP dan mampu menerangkan fungsi sensor dengan cemerlang.",
    status: "submitted",
    updatedAt: "2026-10-16 09:45",
  },

  // P-2 (SMKA Tun Ahmadshah): Jumlah = 91.00% (Seri 91.00% dengan P-1, tetapi B3 = 18.00%)
  {
    participantId: "p-2",
    judgeId: "juri1",
    scores: {
      "b1-1": 5, "b1-2": 5, // B1 = 15.0
      "b2-1": 5, "b2-2": 4, // B2 = 18.0
      "b3-1": 5, "b3-2": 4, // B3 = 18.0
      "b4-1": 5, "b4-2": 4, // B4 = 9.0
      "b5-1": 4, "b5-2": 4, // B5 = 12.0
      "b6-1": 5, "b6-2": 4.5 as unknown as number, // kita guna nilai bulat: B5=13.5, B6=18 -> biar tepat 91.0
    },
    comment: "Kajian saintifik yang sangat baik dan poster sangat kemas.",
    status: "submitted",
    updatedAt: "2026-10-16 10:00",
  },
  {
    participantId: "p-2",
    judgeId: "juri2",
    scores: {
      "b1-1": 5, "b1-2": 5, // B1 = 15.0
      "b2-1": 5, "b2-2": 4, // B2 = 18.0
      "b3-1": 5, "b3-2": 4, // B3 = 18.0
      "b4-1": 5, "b4-2": 5, // B4 = 10.0
      "b5-1": 4, "b5-2": 4, // B5 = 12.0
      "b6-1": 4, "b6-2": 5, // B6 = 18.0 -> Total = 91.0
    },
    comment: "Penjajaran KmR sangat jelas. Pembentangan mantap.",
    status: "submitted",
    updatedAt: "2026-10-16 10:10",
  },

  // P-3 (SMK Abdul Rahim): Kes OUTLIER (Jurang Juri 1 & Juri 2 melebihi 15 markah)
  {
    participantId: "p-3",
    judgeId: "juri1",
    scores: {
      "b1-1": 5, "b1-2": 4, // 13.5
      "b2-1": 5, "b2-2": 5, // 20.0
      "b3-1": 4, "b3-2": 5, // 18.0
      "b4-1": 4, "b4-2": 4, // 8.0
      "b5-1": 5, "b5-2": 4, // 13.5
      "b6-1": 4, "b6-2": 4, // 16.0 -> Total = 89.0
    },
    comment: "Dokumentasi proses sangat lengkap dan produk kompos terbukti berkesan.",
    status: "submitted",
    updatedAt: "2026-10-16 10:20",
  },
  {
    participantId: "p-3",
    judgeId: "juri2",
    scores: {
      "b1-1": 3, "b1-2": 3, // 9.0
      "b2-1": 3, "b2-2": 3, // 12.0
      "b3-1": 3, "b3-2": 3, // 12.0
      "b4-1": 3, "b4-2": 3, // 6.0
      "b5-1": 3, "b5-2": 3, // 9.0
      "b6-1": 3, "b6-2": 3, // 12.0 -> Total = 60.0 (Jurang 29.0 markah!)
    },
    comment: "Perlu tambah baik bukti kolaborasi bersama agensi luar.",
    status: "submitted",
    updatedAt: "2026-10-16 10:25",
  },

  // P-5 (SK Pekan Pitas II - Sekolah Rendah)
  {
    participantId: "p-5",
    judgeId: "juri1",
    scores: {
      "b1-1": 5, "b1-2": 4,
      "b2-1": 5, "b2-2": 5,
      "b3-1": 5, "b3-2": 4,
      "b4-1": 5, "b4-2": 5,
      "b5-1": 5, "b5-2": 4,
      "b6-1": 5, "b6-2": 5,
    },
    comment: "Luar biasa bagi kategori sekolah rendah! Murid petah berbicara dan bukti kukuh.",
    status: "submitted",
    updatedAt: "2026-10-16 10:30",
  },
  {
    participantId: "p-5",
    judgeId: "juri2",
    scores: {
      "b1-1": 4, "b1-2": 5,
      "b2-1": 5, "b2-2": 4,
      "b3-1": 5, "b3-2": 5,
      "b4-1": 4, "b4-2": 5,
      "b5-1": 4, "b5-2": 5,
      "b6-1": 5, "b6-2": 4,
    },
    comment: "Projek kebun dapur yang sangat memberi inspirasi.",
    status: "submitted",
    updatedAt: "2026-10-16 10:35",
  },

  // P-6 (SK Pekan Keningau - Sekolah Rendah)
  {
    participantId: "p-6",
    judgeId: "juri1",
    scores: {
      "b1-1": 4, "b1-2": 4,
      "b2-1": 4, "b2-2": 4,
      "b3-1": 4, "b3-2": 4,
      "b4-1": 4, "b4-2": 4,
      "b5-1": 5, "b5-2": 4,
      "b6-1": 4, "b6-2": 4,
    },
    comment: "Gabungan elemen budaya tempatan dan matematik yang sangat menarik.",
    status: "submitted",
    updatedAt: "2026-10-16 10:40",
  },
];

// Betulkan skor integer p-2 juri1 supaya 100% integer skala 1-5 dan jumlah = 91.0
INITIAL_EVALUATIONS[2].scores = {
  "b1-1": 5, "b1-2": 5, // B1 = 15.0
  "b2-1": 5, "b2-2": 4, // B2 = 18.0
  "b3-1": 5, "b3-2": 4, // B3 = 18.0
  "b4-1": 5, "b4-2": 5, // B4 = 10.0
  "b5-1": 4, "b5-2": 4, // B5 = 12.0
  "b6-1": 5, "b6-2": 4, // B6 = 18.0 -> Jumlah tepat 91.0!
};

// ============================================================================
// 3. ENJIN PENGIRAAN MARKAH, OUTLIER & AUTO TIE-BREAKER
// ============================================================================

export function calculateSingleJudgeSectionScore(
  section: RubricSection,
  scores: Record<string, number>
): number {
  if (!section.subCriteria.length) return 0;
  const maxRaw = section.subCriteria.length * 5;
  const rawSum = section.subCriteria.reduce(
    (acc, sub) => acc + (Number(scores[sub.id]) || 0),
    0
  );
  return (rawSum / maxRaw) * section.weight;
}

export function calculateSingleJudgeTotal(
  rubric: RubricSection[],
  scores: Record<string, number>
): number {
  return rubric.reduce(
    (acc, sec) => acc + calculateSingleJudgeSectionScore(sec, scores),
    0
  );
}

export function getMedalByScore(
  score: number,
  evaluatedCount: number
): CalculatedParticipantResult["medal"] {
  if (evaluatedCount === 0) return "BELUM DINILAI";
  if (score >= 85.0) return "EMAS";
  if (score >= 70.0) return "PERAK";
  if (score >= 50.0) return "GANGSA";
  return "SIJIL PENYERTAAN";
}

export function computeAllResults(
  participants: Participant[],
  evaluations: JudgeEvaluation[],
  rubric: RubricSection[]
): CalculatedParticipantResult[] {
  const rawResults: CalculatedParticipantResult[] = participants.map((p) => {
    const pEvals = evaluations.filter((e) => e.participantId === p.id);

    const judgeTotals: Partial<Record<JudgeId, number>> = {};
    const judgeStatuses: Partial<Record<JudgeId, "draft" | "submitted">> = {};
    const judgeComments: Partial<Record<JudgeId, string>> = {};

    const sectionAccum: Record<string, number[]> = {};
    rubric.forEach((sec) => {
      sectionAccum[sec.code] = [];
    });

    pEvals.forEach((ev) => {
      const total = calculateSingleJudgeTotal(rubric, ev.scores);
      judgeTotals[ev.judgeId] = Number(total.toFixed(2));
      judgeStatuses[ev.judgeId] = ev.status;
      judgeComments[ev.judgeId] = ev.comment;

      rubric.forEach((sec) => {
        const secScore = calculateSingleJudgeSectionScore(sec, ev.scores);
        sectionAccum[sec.code].push(secScore);
      });
    });

    const validScores = Object.values(judgeTotals).filter(
      (v): v is number => typeof v === "number"
    );
    const evaluatedCount = validScores.length;

    const finalScore =
      evaluatedCount > 0
        ? Number(
            (
              validScores.reduce((a, b) => a + b, 0) / evaluatedCount
            ).toFixed(2)
          )
        : 0;

    const avgSectionScores: Record<string, number> = {};
    rubric.forEach((sec) => {
      const arr = sectionAccum[sec.code];
      avgSectionScores[sec.code] =
        arr && arr.length > 0
          ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
          : 0;
    });

    let outlierGap = 0;
    let isOutlier = false;
    if (validScores.length >= 2) {
      const maxS = Math.max(...validScores);
      const minS = Math.min(...validScores);
      outlierGap = Number((maxS - minS).toFixed(2));
      if (outlierGap > 15.0) {
        isOutlier = true;
      }
    }

    return {
      participant: p,
      judgeTotals,
      judgeStatuses,
      judgeComments,
      evaluatedCount,
      finalScore,
      avgSectionScores,
      isOutlier,
      outlierGap,
      medal: getMedalByScore(finalScore, evaluatedCount),
    };
  });

  // Susun dan tentukan kedudukan mengikut Kategori dengan Algoritma Tie-Breaker (B3 -> B2 -> B6 -> B1)
  const categories: CategoryType[] = [
    "Sekolah Menengah",
    "Sekolah Rendah",
    "STEM-TVET",
    "Pendidikan Khas",
  ];

  const rankedResults: CalculatedParticipantResult[] = [];

  categories.forEach((cat) => {
    const group = rawResults.filter((r) => r.participant.category === cat);

    group.sort((a, b) => {
      if (a.evaluatedCount === 0 && b.evaluatedCount === 0) return 0;
      if (a.evaluatedCount === 0) return 1;
      if (b.evaluatedCount === 0) return -1;

      // Banding Markah Akhir
      if (Math.abs(b.finalScore - a.finalScore) >= 0.005) {
        return b.finalScore - a.finalScore;
      }

      // Auto Tie-Breaker mengikut keutamaan JPN Sabah: B3 -> B2 -> B6 -> B1
      const tiePriority = ["B3", "B2", "B6", "B1"];
      for (const code of tiePriority) {
        const scoreA = a.avgSectionScores[code] ?? 0;
        const scoreB = b.avgSectionScores[code] ?? 0;
        if (Math.abs(scoreB - scoreA) >= 0.005) {
          if (scoreB > scoreA) {
            b.tieBreakerNote = `Menang Tie-Breaker (${code}: ${scoreB.toFixed(2)}% vs ${scoreA.toFixed(2)}%)`;
          } else {
            a.tieBreakerNote = `Menang Tie-Breaker (${code}: ${scoreA.toFixed(2)}% vs ${scoreB.toFixed(2)}%)`;
          }
          return scoreB - scoreA;
        }
      }
      return a.participant.code.localeCompare(b.participant.code);
    });

    const rankLabels = [
      "JOHAN",
      "NAIB JOHAN",
      "TEMPAT KETIGA",
      "KEEMPAT (SAGUHATI)",
      "KELIMA (SAGUHATI)",
    ];

    group.forEach((item, idx) => {
      if (item.evaluatedCount > 0) {
        item.rank = idx + 1;
        item.achievementLabel =
          idx < rankLabels.length ? rankLabels[idx] : `TEMPAT KE-${idx + 1}`;
      }
      rankedResults.push(item);
    });
  });

  // Susun keseluruhan mengikut markah tertinggi untuk paparan semua kategori
  return rankedResults.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return (b.avgSectionScores["B3"] ?? 0) - (a.avgSectionScores["B3"] ?? 0);
  });
}

// ============================================================================
// 4. KOMPONEN UTAMA APLIKASI
// ============================================================================

export default function SistemPenghakimanPBLS5() {
  // State Utama dengan Storan LocalStorage
  const [role, setRole] = useState<RoleId>("admin");
  const [adminTab, setAdminTab] = useState<
    "dashboard" | "participants" | "rubric" | "audit"
  >("dashboard");

  const [participants, setParticipants] = useState<Participant[]>(
    INITIAL_PARTICIPANTS
  );
  const [evaluations, setEvaluations] =
    useState<JudgeEvaluation[]>(INITIAL_EVALUATIONS);
  const [rubric, setRubric] = useState<RubricSection[]>(
    DEFAULT_JPN_SABAH_RUBRIC
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // State Penapis & Carian
  const [selectedCategory, setSelectedCategory] = useState<string>("SEMUA");
  const [selectedPPD, setSelectedPPD] = useState<string>("SEMUA");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [judgeStatusFilter, setJudgeStatusFilter] = useState<string>("SEMUA");

  // State Panel Juri (Peserta yang sedang dinilai)
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(
    null
  );
  const [workingScores, setWorkingScores] = useState<Record<string, number>>(
    {}
  );
  const [workingComment, setWorkingComment] = useState<string>("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  // State Modal Pengurusan Peserta (Admin)
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [pForm, setPForm] = useState<Omit<Participant, "id">>({
    code: "",
    schoolName: "",
    ppd: "PPD Pitas",
    category: "Sekolah Menengah",
    projectTitle: "",
    digitalProofUrl: "",
  });

  // Muat turun data dari localStorage semasa permulaan
  useEffect(() => {
    try {
      const savedP = localStorage.getItem("s5_pbl_participants");
      const savedE = localStorage.getItem("s5_pbl_evaluations");
      const savedR = localStorage.getItem("s5_pbl_rubric");
      if (savedP) setParticipants(JSON.parse(savedP));
      if (savedE) setEvaluations(JSON.parse(savedE));
      if (savedR) setRubric(JSON.parse(savedR));
    } catch (err) {
      console.error("Ralat membaca localStorage:", err);
    }
    setIsLoaded(true);
  }, []);

  // Simpan perubahan ke localStorage secara reaktif
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("s5_pbl_participants", JSON.stringify(participants));
  }, [participants, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("s5_pbl_evaluations", JSON.stringify(evaluations));
  }, [evaluations, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("s5_pbl_rubric", JSON.stringify(rubric));
  }, [rubric, isLoaded]);

  // Fungsi Notifikasi Pantas
  const showToast = (
    message: string,
    type: "success" | "warning" | "error" = "success"
  ) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Kiraan Keputusan Keseluruhan secara Memoized
  const calculatedResults = useMemo(() => {
    return computeAllResults(participants, evaluations, rubric);
  }, [participants, evaluations, rubric]);

  // Senarai Keputusan yang Ditapis
  const filteredResults = useMemo(() => {
    return calculatedResults.filter((r) => {
      const matchCat =
        selectedCategory === "SEMUA" ||
        r.participant.category === selectedCategory;
      const matchPPD =
        selectedPPD === "SEMUA" || r.participant.ppd === selectedPPD;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        r.participant.code.toLowerCase().includes(q) ||
        r.participant.schoolName.toLowerCase().includes(q) ||
        r.participant.projectTitle.toLowerCase().includes(q) ||
        r.participant.ppd.toLowerCase().includes(q);
      return matchCat && matchPPD && matchSearch;
    });
  }, [calculatedResults, selectedCategory, selectedPPD, searchQuery]);

  // Statistik Papan Pemuka
  const stats = useMemo(() => {
    const total = calculatedResults.length;
    const evaluated = calculatedResults.filter(
      (r) => r.evaluatedCount > 0
    ).length;
    const progressPct = total > 0 ? Math.round((evaluated / total) * 100) : 0;
    const emas = calculatedResults.filter((r) => r.medal === "EMAS").length;
    const perak = calculatedResults.filter((r) => r.medal === "PERAK").length;
    const gangsa = calculatedResults.filter((r) => r.medal === "GANGSA").length;
    const outliers = calculatedResults.filter((r) => r.isOutlier).length;
    return { total, evaluated, progressPct, emas, perak, gangsa, outliers };
  }, [calculatedResults]);

  // Apabila Juri memilih peserta untuk dinilai
  const openJudgeScoring = (participantId: string, currentJudge: JudgeId) => {
    setActiveParticipantId(participantId);
    const existing = evaluations.find(
      (e) => e.participantId === participantId && e.judgeId === currentJudge
    );
    if (existing) {
      setWorkingScores({ ...existing.scores });
      setWorkingComment(existing.comment);
    } else {
      setWorkingScores({});
      setWorkingComment("");
    }
  };

  // Simpan atau Kunci Markah Juri
  const handleSaveEvaluation = (status: "draft" | "submitted") => {
    if (!activeParticipantId || role === "admin") return;
    const judgeId = role as JudgeId;

    // Semak jika semua sub-kriteria telah diberi skor apabila mahu 'submitted'
    const allSubIds = rubric.flatMap((s) => s.subCriteria.map((sc) => sc.id));
    const missingCount = allSubIds.filter((id) => !workingScores[id]).length;

    if (status === "submitted" && missingCount > 0) {
      showToast(
        `Sila lengkapkan kesemua kriteria rubrik terlebih dahulu (${missingCount} kriteria belum dipilih).`,
        "error"
      );
      return;
    }

    const now = new Date();
    const formattedTime = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newEval: JudgeEvaluation = {
      participantId: activeParticipantId,
      judgeId,
      scores: { ...workingScores },
      comment: workingComment.trim(),
      status,
      updatedAt: formattedTime,
    };

    setEvaluations((prev) => {
      const idx = prev.findIndex(
        (e) =>
          e.participantId === activeParticipantId && e.judgeId === judgeId
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newEval;
        return copy;
      }
      return [...prev, newEval];
    });

    showToast(
      status === "submitted"
        ? "Markah berjaya dikunci dan dihantar ke sistem pusat!"
        : "Draf pemarkahan berjaya disimpan.",
      "success"
    );
  };

  // Fungsi Buka Kunci Markah oleh Ketua Juri
  const handleUnlockEvaluation = (participantId: string, judgeId: JudgeId) => {
    setEvaluations((prev) =>
      prev.map((e) =>
        e.participantId === participantId && e.judgeId === judgeId
          ? { ...e, status: "draft" }
          : e
      )
    );
    showToast(
      `Borang pemarkahan ${judgeId.toUpperCase()} telah dibuka kunci untuk semakan semula.`,
      "warning"
    );
  };

  // Fungsi Eksport ke CSV / Excel
  const handleExportCSV = () => {
    const headers = [
      "Kedudukan Kategori",
      "Pencapaian",
      "Kod Peserta",
      "Nama Sekolah",
      "PPD",
      "Kategori",
      "Tajuk Projek PBL",
      "Juri 1 (%)",
      "Juri 2 (%)",
      "Juri 3 (%)",
      "B1 (%)",
      "B2 (%)",
      "B3 (%)",
      "B4 (%)",
      "B5 (%)",
      "B6 (%)",
      "Markah Akhir (%)",
      "Penarafan Pingat",
      "Status Semakan Silang",
    ];

    const rows = filteredResults.map((r) => [
      r.rank ?? "-",
      `"${r.achievementLabel ?? "BELUM DINILAI"}"`,
      `"${r.participant.code}"`,
      `"${r.participant.schoolName}"`,
      `"${r.participant.ppd}"`,
      `"${r.participant.category}"`,
      `"${r.participant.projectTitle.replace(/"/g, '""')}"`,
      r.judgeTotals.juri1?.toFixed(2) ?? "-",
      r.judgeTotals.juri2?.toFixed(2) ?? "-",
      r.judgeTotals.juri3?.toFixed(2) ?? "-",
      r.avgSectionScores["B1"]?.toFixed(2) ?? "0.00",
      r.avgSectionScores["B2"]?.toFixed(2) ?? "0.00",
      r.avgSectionScores["B3"]?.toFixed(2) ?? "0.00",
      r.avgSectionScores["B4"]?.toFixed(2) ?? "0.00",
      r.avgSectionScores["B5"]?.toFixed(2) ?? "0.00",
      r.avgSectionScores["B6"]?.toFixed(2) ?? "0.00",
      r.finalScore.toFixed(2),
      `"${r.medal}"`,
      `"${
        r.isOutlier
          ? `JURANG TINGGI (${r.outlierGap.toFixed(2)}%)`
          : r.tieBreakerNote || "NORMAL"
      }"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Keputusan_Rasmi_Poster_PBL_S5_Sabah_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Fail laporan CSV/Excel berjaya dimuat turun!", "success");
  };

  // Fungsi Reset Keseluruhan Data Demo
  const handleResetDemoData = () => {
    if (
      window.confirm(
        "Adakah anda pasti mahu menetapkan semula semua data peserta, pemarkahan, dan rubrik kepada keadaan asal JPN Sabah?"
      )
    ) {
      setParticipants(INITIAL_PARTICIPANTS);
      setEvaluations(INITIAL_EVALUATIONS);
      setRubric(DEFAULT_JPN_SABAH_RUBRIC);
      localStorage.removeItem("s5_pbl_participants");
      localStorage.removeItem("s5_pbl_evaluations");
      localStorage.removeItem("s5_pbl_rubric");
      showToast("Semua data telah ditetapkan semula ke tetapan asal.", "success");
    }
  };

  // Jumlah pemberat semasa dalam Konfigurasi Rubrik
  const totalRubricWeight = useMemo(
    () => rubric.reduce((sum, sec) => sum + Number(sec.weight || 0), 0),
    [rubric]
  );

  // ============================================================================
  // RENDER UI
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* GAYA KHAS UNTUK MOD CETAKAN RASMI (@media print) */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
        }
      `}</style>

      {/* NOTIFIKASI TOAST */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 no-print max-w-md animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
              notification.type === "success"
                ? "bg-emerald-900 text-white border-emerald-700"
                : notification.type === "warning"
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-red-700 text-white border-red-600"
            }`}
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HEADER RASMI & PENUKAR PERANAN (DISEMBUNYIKAN SEMASA CETAKAN)
      ===================================================================== */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b-4 border-amber-400 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Identiti Program */}
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 rounded-full">
                    KPM • JPN SABAH
                  </span>
                  <span className="text-xs text-blue-200 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Acuan Standard DSKP • KmR • 6C (TP6)
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white mt-1">
                  SISTEM e-PENGHAKIMAN POSTER PBL
                </h1>
                <p className="text-xs sm:text-sm text-amber-300/90 font-medium">
                  Sempena Program Karnival Pendidikan S5 Peringkat Negeri Sabah
                </p>
              </div>
            </div>

            {/* Penukar Peranan Pantas (Role Switcher) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-700/70">
              <span className="text-xs font-semibold text-slate-300 px-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Mod Peranan:
              </span>
              <div className="grid grid-cols-2 sm:flex gap-1.5">
                {(
                  [
                    { id: "admin", label: "Ketua Juri / Urusetia" },
                    { id: "juri1", label: "Panel Juri 1" },
                    { id: "juri2", label: "Panel Juri 2" },
                    { id: "juri3", label: "Panel Juri 3" },
                  ] as { id: RoleId; label: string }[]
                ).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRole(r.id);
                      setActiveParticipantId(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      role === r.id
                        ? "bg-amber-400 text-slate-950 shadow-sm"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          PAPARAN 1: MOD KETUA JURI / URUSETIA (ADMIN)
      ===================================================================== */}
      {role === "admin" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print-container">
          {/* Navigasi Sub-Tab Admin (Sembunyi semasa cetak) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
            <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
              <button
                onClick={() => setAdminTab("dashboard")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  adminTab === "dashboard"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Papan Kedudukan & Keputusan
              </button>
              <button
                onClick={() => setAdminTab("audit")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  adminTab === "audit"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Semakan Silang Juri
                {stats.outliers > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] rounded-full">
                    {stats.outliers}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAdminTab("participants")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  adminTab === "participants"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4" />
                Pengurusan Peserta ({participants.length})
              </button>
              <button
                onClick={() => setAdminTab("rubric")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  adminTab === "rubric"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Settings className="w-4 h-4" />
                Konfigurasi Rubrik Dinamik
              </button>
            </div>

            {/* Tindakan Pantas Ketua Juri */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Eksport CSV/Excel
              </button>
              <button
                onClick={() => {
                  setAdminTab("dashboard");
                  setTimeout(() => window.print(), 150);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-amber-300 border border-amber-400/40 text-xs font-bold shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                Cetak Keputusan Rasmi
              </button>
              <button
                onClick={handleResetDemoData}
                title="Tetapkan semula data simulasi"
                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              SUB-TAB 1: PAPAN PEMUKA & KEPUTUSAN RASMI (TERMASUK MOD CETAK)
          ----------------------------------------------------------------- */}
          {adminTab === "dashboard" && (
            <div>
              {/* KEPALA SURAT RASMI (HANYA MUNCUL SEMASA CETAKAN @media print) */}
              <div className="hidden print-only mb-6 border-b-2 border-black pb-4">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest">
                    KEMENTERIAN PENDIDIKAN MALAYSIA • JABATAN PENDIDIKAN NEGERI SABAH
                  </p>
                  <h1 className="text-lg font-extrabold uppercase mt-1">
                    BORANG RUMUSAN KEPUTUSAN RASMI PERTANDINGAN POSTER PEMBELAJARAN BERASASKAN PROJEK (PBL)
                  </h1>
                  <h2 className="text-sm font-bold uppercase">
                    SEMPENA PROGRAM KARNIVAL PENDIDIKAN S5 PERINGKAT NEGERI SABAH
                  </h2>
                  <p className="text-xs mt-1">
                    Kategori Cetakan:{" "}
                    <strong>
                      {selectedCategory === "SEMUA"
                        ? "SEMUA KATEGORI"
                        : selectedCategory}
                    </strong>{" "}
                    | Daerah/PPD:{" "}
                    <strong>
                      {selectedPPD === "SEMUA" ? "SEMUA PPD SABAH" : selectedPPD}
                    </strong>{" "}
                    | Tarikh Cetakan: {new Date().toLocaleDateString("ms-MY")}
                  </p>
                </div>
              </div>

              {/* KAD STATISTIK RINGKASAN (Sembunyi semasa cetak) */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 no-print">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Jumlah Penyertaan
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {stats.total}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      Pasukan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Merangkumi {new Set(participants.map((p) => p.ppd)).size} PPD
                    Sabah
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Kemajuan Penilaian
                  </span>
                  <div className="text-2xl font-extrabold text-blue-900 mt-1">
                    {stats.evaluated}/{stats.total}{" "}
                    <span className="text-xs font-bold text-emerald-600">
                      ({stats.progressPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-700 h-full rounded-full transition-all"
                      style={{ width: `${stats.progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl shadow-sm border border-amber-200">
                  <span className="text-xs font-bold text-amber-800 uppercase">
                    Pingat Emas (≥85%)
                  </span>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">
                    {stats.emas}{" "}
                    <span className="text-xs font-medium text-amber-800">
                      Pasukan
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Standard Teladan TP6
                  </p>
                </div>

                <div className="bg-slate-100/80 p-4 rounded-2xl shadow-sm border border-slate-300">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Perak & Gangsa
                  </span>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1">
                    {stats.perak}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      Perak
                    </span>{" "}
                    • {stats.gangsa}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      Gangsa
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    70–84.99% (Perak) | 50–69.99% (Gangsa)
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl shadow-sm border ${
                    stats.outliers > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <span
                    className={`text-xs font-bold uppercase ${
                      stats.outliers > 0 ? "text-red-800" : "text-emerald-800"
                    }`}
                  >
                    Audit Jurang Markah
                  </span>
                  <div
                    className={`text-2xl font-extrabold mt-1 ${
                      stats.outliers > 0 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {stats.outliers}{" "}
                    <span className="text-xs font-medium">Kes Outlier</span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      stats.outliers > 0 ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {stats.outliers > 0
                      ? "Perbezaan > 15.0 markah dikesan!"
                      : "Semua markah juri konsisten"}
                  </p>
                </div>
              </div>

              {/* BAR PENAPIS & CARIAN (Sembunyi semasa cetak) */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 no-print">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="relative md:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari Kod Peserta, Nama Sekolah, Tajuk Projek atau PPD..."
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="SEMUA">Semua Kategori Pertandingan</option>
                      <option value="Sekolah Menengah">
                        Kategori: Sekolah Menengah
                      </option>
                      <option value="Sekolah Rendah">
                        Kategori: Sekolah Rendah
                      </option>
                      <option value="STEM-TVET">Kategori: STEM-TVET</option>
                      <option value="Pendidikan Khas">
                        Kategori: Pendidikan Khas
                      </option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={selectedPPD}
                      onChange={(e) => setSelectedPPD(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="SEMUA">Semua Daerah / PPD Sabah</option>
                      {SABAH_PPD_LIST.map((ppd) => (
                        <option key={ppd} value={ppd}>
                          {ppd}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* JADUAL PAPAN KEDUDUKAN (LEADERBOARD) & KEPUTUSAN RASMI */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 no-print">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      Papan Kedudukan Rasmi & Analisis Tie-Breaker Automatik
                    </h2>
                    <p className="text-xs text-slate-300">
                      Keutamaan Pemecah Seri (Tie-Breaker): B3 (Inovasi & Impak)
                      → B2 (Proses Inkuiri) → B6 (Soal Jawab) → B1 (DSKP)
                    </p>
                  </div>
                  <span className="text-xs bg-slate-800 text-amber-300 px-3 py-1 rounded-full border border-slate-700">
                    Memaparkan {filteredResults.length} Rekod
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
                        <th className="py-3 px-3 text-center">Kedudukan</th>
                        <th className="py-3 px-3">Kod & Sekolah (PPD)</th>
                        <th className="py-3 px-3">Tajuk Projek PBL</th>
                        <th className="py-3 px-2 text-center">J1 (%)</th>
                        <th className="py-3 px-2 text-center">J2 (%)</th>
                        <th className="py-3 px-2 text-center">J3 (%)</th>
                        <th className="py-3 px-2 text-center bg-blue-50/60">
                          B3 / B2 / B6
                          <span className="block text-[9px] font-normal text-slate-500">
                            (Tie-Breaker)
                          </span>
                        </th>
                        <th className="py-3 px-3 text-center bg-amber-50/70">
                          Markah Akhir
                        </th>
                        <th className="py-3 px-3 text-center">
                          Pingat & Keputusan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredResults.map((r) => (
                        <tr
                          key={r.participant.id}
                          className={`hover:bg-slate-50/90 transition ${
                            r.isOutlier ? "bg-red-50/40" : ""
                          }`}
                        >
                          {/* Kedudukan Kategori */}
                          <td className="py-3.5 px-3 text-center font-bold">
                            {r.rank ? (
                              <div className="flex flex-col items-center">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                                    r.rank === 1
                                      ? "bg-amber-400 text-slate-950 ring-2 ring-amber-200"
                                      : r.rank === 2
                                      ? "bg-slate-300 text-slate-900"
                                      : r.rank === 3
                                      ? "bg-amber-700 text-white"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  #{r.rank}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 mt-1">
                                  {r.participant.category}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Kod & Maklumat Sekolah */}
                          <td className="py-3.5 px-3">
                            <div className="font-extrabold text-blue-950">
                              {r.participant.code}
                            </div>
                            <div className="font-semibold text-slate-800">
                              {r.participant.schoolName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {r.participant.ppd}
                            </div>
                          </td>

                          {/* Tajuk Projek & Lencana Audit */}
                          <td className="py-3.5 px-3 max-w-xs">
                            <p className="font-medium text-slate-800 line-clamp-2">
                              {r.participant.projectTitle}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {r.tieBreakerNote && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                  <Sparkles className="w-3 h-3 text-blue-700" />
                                  {r.tieBreakerNote}
                                </span>
                              )}
                              {r.isOutlier && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  Semakan Ketua Juri: Jurang Markah Tinggi (
                                  {r.outlierGap.toFixed(2)}%)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Markah Juri 1, 2, 3 */}
                          {(["juri1", "juri2", "juri3"] as JudgeId[]).map(
                            (jid) => (
                              <td
                                key={jid}
                                className="py-3.5 px-2 text-center font-medium"
                              >
                                {r.judgeTotals[jid] !== undefined ? (
                                  <div>
                                    <span className="font-bold text-slate-800">
                                      {r.judgeTotals[jid]?.toFixed(2)}
                                    </span>
                                    {r.judgeStatuses[jid] === "draft" && (
                                      <span className="block text-[9px] text-amber-600 font-bold">
                                        (Draf)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            )
                          )}

                          {/* Pecahan Tie-Breaker (B3 / B2 / B6) */}
                          <td className="py-3.5 px-2 text-center bg-blue-50/30 font-mono text-[11px] text-slate-700">
                            {r.evaluatedCount > 0 ? (
                              <span>
                                <strong>
                                  {r.avgSectionScores["B3"]?.toFixed(1)}
                                </strong>{" "}
                                / {r.avgSectionScores["B2"]?.toFixed(1)} /{" "}
                                {r.avgSectionScores["B6"]?.toFixed(1)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Markah Akhir */}
                          <td className="py-3.5 px-3 text-center bg-amber-50/40">
                            {r.evaluatedCount > 0 ? (
                              <span className="text-base font-extrabold text-slate-900">
                                {r.finalScore.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Belum Dinilai
                              </span>
                            )}
                          </td>

                          {/* Penarafan Pingat & Kedudukan */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                  r.medal === "EMAS"
                                    ? "bg-amber-400/25 text-amber-900 border-amber-400"
                                    : r.medal === "PERAK"
                                    ? "bg-slate-200 text-slate-800 border-slate-400"
                                    : r.medal === "GANGSA"
                                    ? "bg-orange-100 text-orange-900 border-orange-300"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}
                              >
                                {r.medal}
                              </span>
                              {r.achievementLabel && (
                                <span className="text-[11px] font-extrabold text-blue-950">
                                  {r.achievementLabel}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RUANGAN TANDATANGAN PENGESAHAN RASMI (MUNCUL SEMASA CETAK & DI BAWAH JADUAL) */}
              <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 print:border-black print:rounded-none">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 mb-6">
                  Pengesahan Panel Hakim & Urusetia Karnival Pendidikan S5 Peringkat Negeri Sabah
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-xs text-center pt-6">
                  <div>
                    <div className="border-b border-slate-400 h-12 mb-2" />
                    <p className="font-bold text-slate-900">PANEL JURI 1</p>
                    <p className="text-[11px] text-slate-500">
                      Nama & Tandatangan
                    </p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-12 mb-2" />
                    <p className="font-bold text-slate-900">PANEL JURI 2</p>
                    <p className="text-[11px] text-slate-500">
                      Nama & Tandatangan
                    </p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-12 mb-2" />
                    <p className="font-bold text-slate-900">PANEL JURI 3</p>
                    <p className="text-[11px] text-slate-500">
                      Nama & Tandatangan
                    </p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-12 mb-2" />
                    <p className="font-bold text-blue-950">
                      DISEMAK OLEH (KETUA JURI)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Nama, Cop & Tarikh
                    </p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-12 mb-2" />
                    <p className="font-bold text-blue-950">
                      DISAHKAN OLEH (URUSETIA JPN SABAH)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Sektor Pembelajaran / Urusetia S5
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              SUB-TAB 2: SEMAKAN SILANG JURI & PENGURUSAN KUNCI MARKAH (AUDIT)
          ----------------------------------------------------------------- */}
          {adminTab === "audit" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-blue-800" />
                    Audit Semakan Silang Markah & Ulasan Panel Juri
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ketua Juri boleh menyemak ulasan setiap juri dan membuka
                    kunci (unlock) borang juri sekiranya berlaku jurang markah
                    tinggi (&gt; 15.0%).
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {calculatedResults.map((r) => (
                  <div
                    key={r.participant.id}
                    className={`p-4 rounded-xl border ${
                      r.isOutlier
                        ? "border-red-300 bg-red-50/40"
                        : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <span className="px-2 py-0.5 text-xs font-extrabold bg-blue-950 text-white rounded mr-2">
                          {r.participant.code}
                        </span>
                        <span className="font-bold text-sm text-slate-900">
                          {r.participant.schoolName} ({r.participant.ppd})
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          • {r.participant.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {r.isOutlier && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Jurang Tinggi: {r.outlierGap.toFixed(2)}%
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-blue-950">
                          Purata Semasa: {r.finalScore.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      {(["juri1", "juri2", "juri3"] as JudgeId[]).map(
                        (jid, idx) => {
                          const total = r.judgeTotals[jid];
                          const status = r.judgeStatuses[jid];
                          const comment = r.judgeComments[jid];
                          return (
                            <div
                              key={jid}
                              className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700 uppercase">
                                    Panel Juri {idx + 1}
                                  </span>
                                  {status ? (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                        status === "submitted"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {status === "submitted" ? (
                                        <>
                                          <Lock className="w-3 h-3" /> Dikunci
                                        </>
                                      ) : (
                                        "Draf"
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">
                                      Belum Menilai
                                    </span>
                                  )}
                                </div>
                                <div className="text-lg font-extrabold text-slate-900 mt-1">
                                  {total !== undefined
                                    ? `${total.toFixed(2)}%`
                                    : "-"}
                                </div>
                                <p className="text-xs text-slate-600 italic mt-1">
                                  {comment
                                    ? `"${comment}"`
                                    : "Tiada ulasan direkodkan."}
                                </p>
                              </div>

                              {status === "submitted" && (
                                <button
                                  onClick={() =>
                                    handleUnlockEvaluation(
                                      r.participant.id,
                                      jid
                                    )
                                  }
                                  className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  Buka Kunci untuk Semakan Semula
                                </button>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              SUB-TAB 3: PENGURUSAN PESERTA (TAMBAH / SUNTING / PADAM)
          ----------------------------------------------------------------- */}
          {adminTab === "participants" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Senarai Peserta & Kontinjen PPD Sabah
                  </h2>
                  <p className="text-xs text-slate-500">
                    Urus pendaftaran poster PBL, kategori pertandingan, dan
                    pautan bukti digital (Kod QR).
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingParticipant(null);
                    setPForm({
                      code: `PBL-SM-0${participants.length + 1}`,
                      schoolName: "",
                      ppd: "PPD Pitas",
                      category: "Sekolah Menengah",
                      projectTitle: "",
                      digitalProofUrl: "https://drive.google.com/",
                    });
                    setIsParticipantModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Peserta Baharu
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase">
                      <th className="py-3 px-3">Kod</th>
                      <th className="py-3 px-3">Nama Sekolah</th>
                      <th className="py-3 px-3">Daerah / PPD</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Tajuk Projek PBL</th>
                      <th className="py-3 px-3 text-center">Bukti QR</th>
                      <th className="py-3 px-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {participants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-extrabold text-blue-950">
                          {p.code}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {p.schoolName}
                        </td>
                        <td className="py-3 px-3">{p.ppd}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 font-semibold border border-blue-200">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-md">{p.projectTitle}</td>
                        <td className="py-3 px-3 text-center">
                          {p.digitalProofUrl ? (
                            <a
                              href={p.digitalProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold"
                            >
                              <QrCode className="w-3.5 h-3.5" /> Pautan
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingParticipant(p);
                              setPForm({
                                code: p.code,
                                schoolName: p.schoolName,
                                ppd: p.ppd,
                                category: p.category,
                                projectTitle: p.projectTitle,
                                digitalProofUrl: p.digitalProofUrl,
                              });
                              setIsParticipantModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Padam peserta ${p.code} (${p.schoolName})?`
                                )
                              ) {
                                setParticipants((prev) =>
                                  prev.filter((item) => item.id !== p.id)
                                );
                                showToast("Rekod peserta telah dipadam.", "warning");
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODAL TAMBAH / SUNTING PESERTA */}
              {isParticipantModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
                    <h3 className="text-base font-extrabold text-slate-900 mb-4">
                      {editingParticipant
                        ? `Sunting Peserta: ${editingParticipant.code}`
                        : "Tambah Peserta Pertandingan Poster PBL"}
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Kod Peserta
                          </label>
                          <input
                            type="text"
                            value={pForm.code}
                            onChange={(e) =>
                              setPForm({ ...pForm, code: e.target.value })
                            }
                            placeholder="Cth: PBL-SM-05"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Kategori
                          </label>
                          <select
                            value={pForm.category}
                            onChange={(e) =>
                              setPForm({
                                ...pForm,
                                category: e.target.value as CategoryType,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="Sekolah Menengah">
                              Sekolah Menengah
                            </option>
                            <option value="Sekolah Rendah">
                              Sekolah Rendah
                            </option>
                            <option value="STEM-TVET">STEM-TVET</option>
                            <option value="Pendidikan Khas">
                              Pendidikan Khas
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Nama Sekolah / Institusi
                          </label>
                          <input
                            type="text"
                            value={pForm.schoolName}
                            onChange={(e) =>
                              setPForm({ ...pForm, schoolName: e.target.value })
                            }
                            placeholder="Cth: SMK Pinggan-Pinggan"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Daerah / PPD
                          </label>
                          <select
                            value={pForm.ppd}
                            onChange={(e) =>
                              setPForm({ ...pForm, ppd: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                          >
                            {SABAH_PPD_LIST.map((ppd) => (
                              <option key={ppd} value={ppd}>
                                {ppd}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Tajuk Projek PBL
                        </label>
                        <textarea
                          rows={2}
                          value={pForm.projectTitle}
                          onChange={(e) =>
                            setPForm({
                              ...pForm,
                              projectTitle: e.target.value,
                            })
                          }
                          placeholder="Masukkan tajuk penuh inovasi / projek PBL..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Pautan Bukti Digital / Folio Kod QR
                        </label>
                        <input
                          type="url"
                          value={pForm.digitalProofUrl}
                          onChange={(e) =>
                            setPForm({
                              ...pForm,
                              digitalProofUrl: e.target.value,
                            })
                          }
                          placeholder="https://drive.google.com/..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        onClick={() => setIsParticipantModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => {
                          if (!pForm.code.trim() || !pForm.schoolName.trim()) {
                            showToast(
                              "Sila lengkapkan Kod Peserta dan Nama Sekolah.",
                              "error"
                            );
                            return;
                          }
                          if (editingParticipant) {
                            setParticipants((prev) =>
                              prev.map((item) =>
                                item.id === editingParticipant.id
                                  ? { ...editingParticipant, ...pForm }
                                  : item
                              )
                            );
                            showToast(
                              "Maklumat peserta berjaya dikemas kini!",
                              "success"
                            );
                          } else {
                            setParticipants((prev) => [
                              ...prev,
                              { id: `p-${Date.now()}`, ...pForm },
                            ]);
                            showToast(
                              "Peserta baharu berjaya ditambah!",
                              "success"
                            );
                          }
                          setIsParticipantModalOpen(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold"
                      >
                        Simpan Peserta
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------
              SUB-TAB 4: KONFIGURASI RUBRIK DINAMIK (DYNAMIC RUBRIC BUILDER)
          ----------------------------------------------------------------- */}
          {adminTab === "rubric" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-800" />
                    Konfigurasi Rubrik Dinamik (Acuan Standard PBL JPN Sabah)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ubah suai pemberat (%) atau sub-kriteria mengikut pindaan
                    Kertas Konsep Karnival Pendidikan S5 tanpa mengubah kod.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`px-4 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 ${
                      totalRubricWeight === 100
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-red-50 border-red-300 text-red-700"
                    }`}
                  >
                    {totalRubricWeight === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    Jumlah Pemberat Semasa: {totalRubricWeight}% (Wajib 100%)
                  </div>

                  <button
                    onClick={() => {
                      setRubric(DEFAULT_JPN_SABAH_RUBRIC);
                      showToast(
                        "Rubrik telah ditetapkan semula ke Standard PBL JPN Sabah (100%).",
                        "success"
                      );
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tetapkan Semula ke Standard JPN Sabah
                  </button>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {rubric.map((section, sIdx) => (
                  <div
                    key={section.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-950 text-amber-300 text-xs font-extrabold">
                          {section.code}
                        </span>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRubric((prev) =>
                              prev.map((s, i) =>
                                i === sIdx ? { ...s, title: val } : s
                              )
                            );
                          }}
                          className="w-full max-w-md px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">
                          Pemberat (%):
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={section.weight}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setRubric((prev) =>
                              prev.map((s, i) =>
                                i === sIdx ? { ...s, weight: val } : s
                              )
                            );
                          }}
                          className="w-20 px-2.5 py-1.5 text-xs font-extrabold text-center rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Senarai Sub-Kriteria */}
                    <div className="space-y-2 mt-3">
                      {section.subCriteria.map((sub, subIdx) => (
                        <div
                          key={sub.id}
                          className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200"
                        >
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold shrink-0">
                            {sub.code}
                          </span>
                          <input
                            type="text"
                            value={sub.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRubric((prev) =>
                                prev.map((s, i) =>
                                  i === sIdx
                                    ? {
                                        ...s,
                                        subCriteria: s.subCriteria.map(
                                          (sc, j) =>
                                            j === subIdx
                                              ? { ...sc, text: val }
                                              : sc
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="flex-1 text-xs px-2.5 py-1 rounded border border-slate-200 focus:outline-none focus:border-blue-600"
                          />
                          {section.subCriteria.length > 1 && (
                            <button
                              onClick={() => {
                                setRubric((prev) =>
                                  prev.map((s, i) =>
                                    i === sIdx
                                      ? {
                                          ...s,
                                          subCriteria: s.subCriteria.filter(
                                            (_, j) => j !== subIdx
                                          ),
                                        }
                                      : s
                                  )
                                );
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Padam Sub-Kriteria"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const nextNum = section.subCriteria.length + 1;
                          const newSub: SubCriterion = {
                            id: `${section.code.toLowerCase()}-${Date.now()}`,
                            code: `${section.code}.${nextNum}`,
                            text: "Kriteria penilaian tambahan...",
                          };
                          setRubric((prev) =>
                            prev.map((s, i) =>
                              i === sIdx
                                ? {
                                    ...s,
                                    subCriteria: [...s.subCriteria, newSub],
                                  }
                                : s
                            )
                          );
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 hover:text-blue-950 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Sub-Kriteria{" "}
                        {section.code}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* =====================================================================
          PAPARAN 2: MOD PANEL JURI (JURI 1, JURI 2, JURI 3)
      ===================================================================== */}
      {role !== "admin" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* JIKA TIADA PESERTA DIPILIH -> PAPARKAN SENARAI TUGASAN JURI */}
          {!activeParticipantId ? (
            <div>
              {/* Maklumat Panel Juri */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 uppercase">
                    Panel Penilai Aktif: {role.toUpperCase()}
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                    Senarai Tugasan Penilaian Poster PBL
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pilih peserta di bawah untuk membuka borang rubrik interaktif
                    Skala Likert (1–5) dan mengimbas bukti digital Kod QR.
                  </p>
                </div>

                {/* Penapis Status Juri */}
                <div className="flex flex-wrap gap-1.5">
                  {["SEMUA", "BELUM DINILAI", "DRAF", "SELESAI"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setJudgeStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        judgeStatusFilter === st
                          ? "bg-blue-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Penapis Kategori & Carian */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Kod Peserta, Sekolah atau PPD..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="SEMUA">Semua Kategori</option>
                  <option value="Sekolah Menengah">Sekolah Menengah</option>
                  <option value="Sekolah Rendah">Sekolah Rendah</option>
                  <option value="STEM-TVET">STEM-TVET</option>
                  <option value="Pendidikan Khas">Pendidikan Khas</option>
                </select>
              </div>

              {/* Kad Senarai Peserta untuk Juri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResults
                  .filter((r) => {
                    const myStatus = r.judgeStatuses[role as JudgeId];
                    if (judgeStatusFilter === "BELUM DINILAI") return !myStatus;
                    if (judgeStatusFilter === "DRAF")
                      return myStatus === "draft";
                    if (judgeStatusFilter === "SELESAI")
                      return myStatus === "submitted";
                    return true;
                  })
                  .map((r) => {
                    const myStatus = r.judgeStatuses[role as JudgeId];
                    const myScore = r.judgeTotals[role as JudgeId];

                    return (
                      <div
                        key={r.participant.id}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-blue-400 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 text-xs font-extrabold">
                              {r.participant.code}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                myStatus === "submitted"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : myStatus === "draft"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {myStatus === "submitted"
                                ? `Selesai Dinilai (${myScore?.toFixed(2)}%)`
                                : myStatus === "draft"
                                ? `Draf Disimpan (${myScore?.toFixed(2)}%)`
                                : "Belum Dinilai"}
                            </span>
                          </div>

                          <h3 className="text-sm font-extrabold text-slate-900">
                            {r.participant.schoolName}
                          </h3>
                          <p className="text-xs font-semibold text-blue-800">
                            {r.participant.ppd} • {r.participant.category}
                          </p>
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                            {r.participant.projectTitle}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <a
                            href={r.participant.digitalProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-800"
                          >
                            <QrCode className="w-4 h-4 text-blue-700" />
                            Bukti Digital (QR)
                          </a>

                          <button
                            onClick={() =>
                              openJudgeScoring(
                                r.participant.id,
                                role as JudgeId
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition"
                          >
                            {myStatus === "submitted"
                              ? "Lihat Markah"
                              : "Nilai Poster Ini"}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* ===============================================================
               BORANG PEMARKAHAN INTERAKTIF JURI (SKALA LIKERT 1-5)
            =============================================================== */
            (() => {
              const currentP = participants.find(
                (p) => p.id === activeParticipantId
              );
              if (!currentP) return null;

              const existingEval = evaluations.find(
                (e) =>
                  e.participantId === currentP.id &&
                  e.judgeId === (role as JudgeId)
              );
              const isLocked = existingEval?.status === "submitted";

              const liveTotal = calculateSingleJudgeTotal(
                rubric,
                workingScores
              );

              return (
                <div className="pb-16">
                  {/* Bar Navigasi Kembali & Ringkasan Markah Terapung (Sticky) */}
                  <div className="sticky top-2 z-30 bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-700 mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveParticipantId(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                      >
                        ← Senarai Peserta
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-amber-400">
                            {currentP.code}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {currentP.schoolName} ({currentP.ppd})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-1 max-w-md">
                          {currentP.projectTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <a
                        href={currentP.digitalProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-800 hover:bg-blue-700 text-xs font-bold text-white"
                      >
                        <QrCode className="w-4 h-4 text-amber-300" />
                        Buka Bukti QR
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div className="text-right bg-slate-950 px-4 py-1.5 rounded-xl border border-amber-400/40">
                        <span className="block text-[10px] text-slate-400 uppercase">
                          Jumlah Markah ({role.toUpperCase()})
                        </span>
                        <span className="text-lg font-extrabold text-amber-400">
                          {liveTotal.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panduan Deskriptor Skala Likert 1 hingga 5 */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-700" />
                        Rujukan Standard Deskriptor Skala Likert (1 hingga 5) JPN Sabah
                      </span>
                      {isLocked && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <Lock className="w-3.5 h-3.5" /> Markah Telah Dikunci
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                      {[1, 2, 3, 4, 5].map((scale) => (
                        <div
                          key={scale}
                          className={`p-2.5 rounded-xl border ${LIKERT_DESCRIPTORS[scale].color}`}
                        >
                          <div className="font-extrabold">
                            Skala {scale}: {LIKERT_DESCRIPTORS[scale].label}
                          </div>
                          <p className="mt-0.5 leading-snug opacity-90">
                            {LIKERT_DESCRIPTORS[scale].desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Senarai 6 Bahagian Rubrik (B1 - B6) */}
                  <div className="space-y-6">
                    {rubric.map((section) => {
                      const secScore = calculateSingleJudgeSectionScore(
                        section,
                        workingScores
                      );

                      return (
                        <div
                          key={section.id}
                          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                        >
                          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold">
                                {section.code}
                              </span>
                              <h3 className="text-sm font-bold">
                                {section.title}
                              </h3>
                            </div>
                            <div className="text-xs font-extrabold text-amber-300 bg-slate-800 px-3 py-1 rounded-lg">
                              Skor Bahagian: {secScore.toFixed(2)}% /{" "}
                              {section.weight}%
                            </div>
                          </div>

                          <div className="p-5 space-y-5 divide-y divide-slate-100">
                            {section.subCriteria.map((sub) => {
                              const currentVal = workingScores[sub.id];
                              return (
                                <div
                                  key={sub.id}
                                  className="pt-4 first:pt-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                                >
                                  <div className="max-w-2xl">
                                    <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-xs font-extrabold mb-1 border border-blue-200">
                                      Kriteria {sub.code}
                                    </span>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                                      {sub.text}
                                    </p>
                                    {currentVal && (
                                      <p className="text-[11px] font-medium text-blue-800 mt-1.5 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100">
                                        <strong>
                                          Skala {currentVal} (
                                          {LIKERT_DESCRIPTORS[currentVal].label}
                                          ):
                                        </strong>{" "}
                                        {LIKERT_DESCRIPTORS[currentVal].desc}
                                      </p>
                                    )}
                                  </div>

                                  {/* Butang Pilihan Skala Likert 1 - 5 */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {[1, 2, 3, 4, 5].map((val) => {
                                      const isSelected = currentVal === val;
                                      return (
                                        <button
                                          key={val}
                                          disabled={isLocked}
                                          onClick={() =>
                                            setWorkingScores((prev) => ({
                                              ...prev,
                                              [sub.id]: val,
                                            }))
                                          }
                                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border font-extrabold text-sm flex flex-col items-center justify-center transition-all ${
                                            isSelected
                                              ? LIKERT_DESCRIPTORS[val].activeBg
                                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                                          } ${
                                            isLocked
                                              ? "opacity-60 cursor-not-allowed"
                                              : ""
                                          }`}
                                        >
                                          <span>{val}</span>
                                          <span className="text-[9px] font-medium opacity-90">
                                            {
                                              LIKERT_DESCRIPTORS[
                                                val
                                              ].label.split(" ")[0]
                                            }
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ruangan Ulasan Konstruktif & Butang Kunci Markah */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
                    <label className="block text-sm font-extrabold text-slate-900 mb-2">
                      Ulasan Konstruktif / Maklum Balas Panel Juri
                    </label>
                    <textarea
                      rows={3}
                      disabled={isLocked}
                      value={workingComment}
                      onChange={(e) => setWorkingComment(e.target.value)}
                      placeholder="Berikan ulasan berkaitan kekuatan projek PBL, impak inovasi kepada komuniti, atau cadangan penambahbaikan..."
                      className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100">
                      <div className="text-xs text-slate-600">
                        Status Penilaian:{" "}
                        <strong className="uppercase">
                          {isLocked
                            ? "DIKUNCI (TELAH DIHANTAR)"
                            : existingEval?.status === "draft"
                            ? "DRAF DISIMPAN"
                            : "BELUM DISIMPAN"}
                        </strong>
                      </div>

                      {!isLocked ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleSaveEvaluation("draft")}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700"
                          >
                            Simpan Sebagai Draf
                          </button>
                          <button
                            onClick={() => handleSaveEvaluation("submitted")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-md transition"
                          >
                            <Lock className="w-4 h-4" />
                            Kunci & Hantar Markah Akhir ({liveTotal.toFixed(2)}%)
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                          Markah telah dikunci. Sila rujuk Ketua Juri sekiranya
                          perlu membuat pindaan.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </main>
      )}
    </div>
  );
}