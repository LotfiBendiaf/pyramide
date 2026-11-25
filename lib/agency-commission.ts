export const SALE_BUYER_COMMISSION_PERCENT = 1;
export const SALE_SELLER_COMMISSION_PERCENT = 1;
export const SALE_AGENCY_COMMISSION_PERCENT = SALE_BUYER_COMMISSION_PERCENT + SALE_SELLER_COMMISSION_PERCENT;

export function saleCommission(finalPrice: number) {
  const buyerAmount = Math.round(finalPrice * SALE_BUYER_COMMISSION_PERCENT) / 100;
  const sellerAmount = Math.round(finalPrice * SALE_SELLER_COMMISSION_PERCENT) / 100;
  return { buyerPercentage: SALE_BUYER_COMMISSION_PERCENT, sellerPercentage: SALE_SELLER_COMMISSION_PERCENT,
    buyerAmount, sellerAmount, totalPercentage: SALE_AGENCY_COMMISSION_PERCENT,
    totalAmount: Math.round((buyerAmount + sellerAmount) * 100) / 100 };
}
