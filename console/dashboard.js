document.getElementById('f').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const p = document.getElementById('pass').value;
  const res = await fetch('/server/admin?pass=' + encodeURIComponent(p));
  if (!res.ok){ document.getElementById('out').textContent = 'Unauthorized'; return; }
  const j = await res.json(); document.getElementById('out').textContent = JSON.stringify(j,null,2);
});
