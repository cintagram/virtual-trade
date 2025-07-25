function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function formatDateShort(timestamp) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

module.exports = { formatDate, formatDateShort };
