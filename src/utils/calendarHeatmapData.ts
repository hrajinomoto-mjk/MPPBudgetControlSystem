import { DashboardItem, PlanRecord, ActualRecord, Department } from '../types';
import { DEPARTMENTS } from '../data/initialData';

export interface DailyHeatmapCell {
  date: number; // 1 - 31
  dateString: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  dayName: string; // 'Senin', 'Selasa', ...
  isWeekend: boolean;
  totalPlan: number;
  totalActual: number;
  planRW: number;
  planOS: number;
  actualRW: number;
  actualOS: number;
  variance: number; // actual - plan
  achievement: number; // (actual / plan) * 100
  status: 'SURPLUS_HIGH' | 'SURPLUS_MODERATE' | 'OPTIMAL' | 'DEFICIT_MODERATE' | 'DEFICIT_HIGH';
  topVarianceDept?: {
    deptId: string;
    deptName: string;
    deptVariance: number;
  };
  operationalNote: string;
}

export interface DeptMatrixCell {
  deptId: string;
  deptName: string;
  monthlyData: {
    fiscalMonth: number;
    calendarMonth: number;
    monthName: string;
    plan: number;
    actual: number;
    variance: number;
    achievement: number;
    status: 'SURPLUS_HIGH' | 'SURPLUS_MODERATE' | 'OPTIMAL' | 'DEFICIT_MODERATE' | 'DEFICIT_HIGH';
  }[];
  avgVariance: number;
  avgAchievement: number;
  overallStatus: 'SURPLUS_HIGH' | 'SURPLUS_MODERATE' | 'OPTIMAL' | 'DEFICIT_MODERATE' | 'DEFICIT_HIGH';
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Returns number of days in a given month and year
 */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Pseudo-random deterministic daily variance weight based on seed
 */
function pseudoDailyFactor(day: number, month: number, year: number, deptSeed: number = 0): number {
  const seed = day * 13 + month * 37 + year * 7 + deptSeed * 19;
  const sinVal = Math.sin(seed);
  return (sinVal - Math.floor(sinVal)) * 2 - 1; // range -1.0 to +1.0
}

/**
 * Generate daily calendar heatmap data based on the selected month, year, and department
 */
export function generateDailyHeatmapData(
  items: DashboardItem[],
  month: number, // Calendar month 1 - 12
  year: number,
  selectedDept: string = 'ALL'
): DailyHeatmapCell[] {
  const daysCount = getDaysInMonth(month, year);
  const filteredItems =
    selectedDept === 'ALL' ? items : items.filter((d) => d.deptId === selectedDept);

  // Sum monthly totals for the scope
  let totalMonthlyPlan = 0;
  let totalMonthlyActual = 0;
  let monthlyPlanRW = 0;
  let monthlyPlanOS = 0;
  let monthlyActualRW = 0;
  let monthlyActualOS = 0;

  filteredItems.forEach((d) => {
    totalMonthlyPlan += d.plan || 0;
    totalMonthlyActual += d.actual || 0;
    monthlyPlanRW += d.planRW || 0;
    monthlyPlanOS += d.planOS || 0;
    monthlyActualRW += d.actualRW || 0;
    monthlyActualOS += d.actualOS || 0;
  });

  // Base daily averages
  const avgDailyPlan = totalMonthlyPlan > 0 ? totalMonthlyPlan : 120;
  const avgDailyActual = totalMonthlyActual > 0 ? totalMonthlyActual : 120;
  const avgDailyPlanRW = monthlyPlanRW > 0 ? monthlyPlanRW : Math.round(avgDailyPlan * 0.65);
  const avgDailyPlanOS = monthlyPlanOS > 0 ? monthlyPlanOS : Math.round(avgDailyPlan * 0.35);
  const avgDailyActualRW = monthlyActualRW > 0 ? monthlyActualRW : Math.round(avgDailyActual * 0.65);
  const avgDailyActualOS = monthlyActualOS > 0 ? monthlyActualOS : Math.round(avgDailyActual * 0.35);

  const dailyCells: DailyHeatmapCell[] = [];

  for (let day = 1; day <= daysCount; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayName = INDO_DAYS[dayOfWeek];
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Weekend production factor (weekends usually have reduced plan or specific overtime batches)
    const weekendFactor = isWeekend ? 0.88 : 1.0;
    const dayNoise = pseudoDailyFactor(day, month, year, 10);
    const actualNoise = pseudoDailyFactor(day, month, year, 25);

    // Calculate daily plan and actual with natural daily fluctuations
    const plan = Math.max(1, Math.round(avgDailyPlan * weekendFactor * (1 + dayNoise * 0.03)));
    const planRW = Math.max(1, Math.round(avgDailyPlanRW * weekendFactor * (1 + dayNoise * 0.02)));
    const planOS = Math.max(0, plan - planRW);

    // Variance fluctuation (surges towards mid-month production targets and weekend maintenance)
    let varianceModifier = actualNoise * 0.08;
    if (day >= 12 && day <= 22) {
      // Mid-month production push
      varianceModifier += 0.04;
    }
    if (day >= 26) {
      // End-of-month reconciliation
      varianceModifier += (actualNoise * 0.05);
    }

    const actual = Math.max(1, Math.round(avgDailyActual * weekendFactor * (1 + varianceModifier)));
    const actualRW = Math.max(1, Math.round(avgDailyActualRW * weekendFactor * (1 + actualNoise * 0.03)));
    const actualOS = Math.max(0, actual - actualRW);

    const variance = actual - plan;
    const achievement = plan > 0 ? Number(((actual / plan) * 100).toFixed(1)) : 100;

    // Determine status tier
    let status: DailyHeatmapCell['status'] = 'OPTIMAL';
    if (achievement >= 110 || variance >= 10) {
      status = 'SURPLUS_HIGH';
    } else if (achievement > 104 || variance >= 4) {
      status = 'SURPLUS_MODERATE';
    } else if (achievement < 88 || variance <= -10) {
      status = 'DEFICIT_HIGH';
    } else if (achievement < 96 || variance <= -4) {
      status = 'DEFICIT_MODERATE';
    } else {
      status = 'OPTIMAL';
    }

    // Top variance department for this day
    let topDept: DailyHeatmapCell['topVarianceDept'];
    if (filteredItems.length > 0) {
      const highestDept = [...filteredItems].sort((a, b) => Math.abs(b.gap || 0) - Math.abs(a.gap || 0))[0];
      if (highestDept) {
        topDept = {
          deptId: highestDept.deptId,
          deptName: highestDept.deptName,
          deptVariance: highestDept.gap,
        };
      }
    }

    // Dynamic operational note
    let operationalNote = 'Alokasi headcount stabil sesuai ritme operasional standar.';
    if (status === 'SURPLUS_HIGH') {
      operationalNote = isWeekend
        ? 'Lonjakan alokasi lembur akhir pekan untuk percepatan output lini proses.'
        : 'Penambahan manpower outsource untuk memenuhi target jadwal pengiriman (delivery batch).';
    } else if (status === 'SURPLUS_MODERATE') {
      operationalNote = 'Kebutuhan tenaga kerja harian sedikit di atas rencana awal (+shift cadangan).';
    } else if (status === 'DEFICIT_HIGH') {
      operationalNote = isWeekend
        ? 'Aktivitas lini minimal / off-schedule terencana.'
        : 'Ketidakhadiran / kendala pemenuhan giliran kerja mitra outsource.';
    } else if (status === 'DEFICIT_MODERATE') {
      operationalNote = 'Optimalisasi produktivitas tanpa penambahan jam kerja lembur.';
    }

    dailyCells.push({
      date: day,
      dateString,
      dayOfWeek,
      dayName,
      isWeekend,
      totalPlan: plan,
      totalActual: actual,
      planRW,
      planOS,
      actualRW,
      actualOS,
      variance,
      achievement,
      status,
      topVarianceDept: topDept,
      operationalNote,
    });
  }

  return dailyCells;
}

/**
 * Generate department vs 12 fiscal months matrix heatmap data
 */
export function generateDeptMatrixData(
  allPlans: PlanRecord[],
  allActuals: ActualRecord[],
  selectedYear: number
): DeptMatrixCell[] {
  const fiscalMonths = [
    { fm: 1, cm: 4, name: 'Apr' },
    { fm: 2, cm: 5, name: 'Mei' },
    { fm: 3, cm: 6, name: 'Jun' },
    { fm: 4, cm: 7, name: 'Jul' },
    { fm: 5, cm: 8, name: 'Agu' },
    { fm: 6, cm: 9, name: 'Sep' },
    { fm: 7, cm: 10, name: 'Okt' },
    { fm: 8, cm: 11, name: 'Nov' },
    { fm: 9, cm: 12, name: 'Des' },
    { fm: 10, cm: 1, name: 'Jan' },
    { fm: 11, cm: 2, name: 'Feb' },
    { fm: 12, cm: 3, name: 'Mar' },
  ];

  return DEPARTMENTS.map((dept) => {
    let totalVar = 0;
    let totalAch = 0;

    const monthlyData = fiscalMonths.map((m) => {
      // Determine the calendar year: months 1-3 (Jan-Mar) are selectedYear + 1 in FY
      const calYear = m.cm >= 4 ? selectedYear : selectedYear + 1;

      const planRec = allPlans.find(
        (p) => p.deptId === dept.id && Number(p.bulan) === m.cm && Number(p.tahun) === calYear
      );
      const actualRec = allActuals.find(
        (a) => a.deptId === dept.id && Number(a.bulan) === m.cm && Number(a.tahun) === calYear
      );

      const plan = planRec ? Number(planRec.planRW || 0) + Number(planRec.planOS || 0) : 0;
      const actual = actualRec ? Number(actualRec.actualRW || 0) + Number(actualRec.actualOS || 0) : 0;
      const variance = actual - plan;
      const achievement = plan > 0 ? Number(((actual / plan) * 100).toFixed(1)) : actual > 0 ? 100 : 0;

      let status: DeptMatrixCell['overallStatus'] = 'OPTIMAL';
      if (achievement >= 110 || variance >= 8) {
        status = 'SURPLUS_HIGH';
      } else if (achievement > 103 || variance >= 3) {
        status = 'SURPLUS_MODERATE';
      } else if (achievement < 88 || variance <= -8) {
        status = 'DEFICIT_HIGH';
      } else if (achievement < 96 || variance <= -3) {
        status = 'DEFICIT_MODERATE';
      } else {
        status = 'OPTIMAL';
      }

      totalVar += variance;
      totalAch += achievement;

      return {
        fiscalMonth: m.fm,
        calendarMonth: m.cm,
        monthName: m.name,
        plan,
        actual,
        variance,
        achievement,
        status,
      };
    });

    const avgVariance = Math.round(totalVar / 12);
    const avgAchievement = Number((totalAch / 12).toFixed(1));

    let overallStatus: DeptMatrixCell['overallStatus'] = 'OPTIMAL';
    if (avgAchievement >= 110 || avgVariance >= 6) {
      overallStatus = 'SURPLUS_HIGH';
    } else if (avgAchievement > 103 || avgVariance >= 2) {
      overallStatus = 'SURPLUS_MODERATE';
    } else if (avgAchievement < 88 || avgVariance <= -6) {
      overallStatus = 'DEFICIT_HIGH';
    } else if (avgAchievement < 96 || avgVariance <= -2) {
      overallStatus = 'DEFICIT_MODERATE';
    }

    return {
      deptId: dept.id,
      deptName: dept.name,
      monthlyData,
      avgVariance,
      avgAchievement,
      overallStatus,
    };
  });
}
