export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('vi-VN');
};