function formatDateLocal(dateObj: Date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const dayName = days[dateObj.getDay()];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'P.M.' : 'A.M.';
  hours = hours % 12;
  hours = hours ? hours : 12;

  const formatted = `${dayName}, ${month} ${day}  ${year}, ${hours}:${minutes} ${ampm}`;
  return formatted;
}

function formatDateRangeLocal(dateObj1: Date, dateObj2: Date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const dayName1 = days[dateObj1.getDay()];
  const day1 = dateObj1.getDate();
  const month1 = months[dateObj1.getMonth()];
  const year1 = dateObj1.getFullYear();

  const dayName2 = days[dateObj2.getDay()];
  const day2 = dateObj2.getDate();
  const month2 = months[dateObj2.getMonth()];
  const year2 = dateObj2.getFullYear();

  if (year1 === year2 && month1 === month2) {
    return `${dayName1} ${day1} - ${dayName2} ${day2} ${month1}, ${year1}`;
  } else {
    return `${dayName1} ${day1} ${month1} - ${dayName2} ${day2} ${month2}, ${year2}`;
  }
}

export { formatDateLocal, formatDateRangeLocal };
