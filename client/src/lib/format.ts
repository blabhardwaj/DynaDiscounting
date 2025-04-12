// Format number to Indian currency format (₹12,34,567.89)
export function formatIndianCurrency(num: number): string {
  if (isNaN(num)) return '₹0.00';
  
  // Convert to string with 2 decimal places
  const numStr = num.toFixed(2);
  
  // Split the decimal part
  const parts = numStr.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format the integer part with Indian thousand separators
  const lastThree = integerPart.length > 3 ? integerPart.slice(-3) : integerPart;
  const otherNumbers = integerPart.length > 3 ? integerPart.slice(0, -3) : '';
  
  integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree;
  
  return `₹${integerPart}.${decimalPart}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Assume format could be ISO or dd/mm/yyyy
    let date: Date;
    if (dateString.includes('/')) {
      // dd/mm/yyyy format
      const parts = dateString.split('/');
      date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      // ISO format
      date = new Date(dateString);
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}
