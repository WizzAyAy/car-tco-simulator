export interface FinancingPlan {
  monthlyPayment: number
  totalPaid: number
  totalInterest: number
  principal: number
  termMonths: number
}

export function computeFinancing(params: {
  purchasePrice: number
  downPayment: number
  aprPercent: number
  termYears: number
}): FinancingPlan {
  const principal = Math.max(0, params.purchasePrice - params.downPayment)
  const termMonths = Math.max(1, Math.round(params.termYears * 12))
  const monthlyRate = params.aprPercent / 100 / 12

  let monthlyPayment: number
  if (monthlyRate === 0) {
    monthlyPayment = principal / termMonths
  }
  else {
    const factor = (1 + monthlyRate) ** termMonths
    monthlyPayment = (principal * monthlyRate * factor) / (factor - 1)
  }

  const totalPaid = monthlyPayment * termMonths
  return {
    monthlyPayment,
    totalPaid,
    totalInterest: totalPaid - principal,
    principal,
    termMonths,
  }
}
