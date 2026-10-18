export function downloadStandaloneHtmlFile() {
  fetch('/dua-bi-offline.html')
    .then(res => res.text())
    .then(htmlContent => {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Dua_Bi_Co_Ha_Thanh_Thuy_THPT_Luong_Ngoc_Quyen.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(() => {
      window.open('/dua-bi-offline.html', '_blank');
    });
}
