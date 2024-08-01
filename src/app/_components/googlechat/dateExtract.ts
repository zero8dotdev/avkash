export function dateExtract(timestamp: number) {
    const date = new Date(timestamp);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const year = String(date.getFullYear()).slice(-4); // Get last two digits of the year
  
    return `${year}-${month}-${day}`;
  }
  