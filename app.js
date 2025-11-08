// public/app.js
async function loadStudents() {
  const res = await fetch('/api/students');
  const tbody = document.querySelector('#studentsTable tbody');
  if (!res.ok) {
    tbody.innerHTML = '<tr><td colspan="5">Failed to load (are you logged in?)</td></tr>';
    return;
  }
  const rows = await res.json();
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5">No records</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td>${r.subject}</td>
      <td><input value="${r.grade}" id="g_${r.id}_${r.subject.replace(/\\s+/g,'_')}" style="width:70px" /></td>
      <td>
        <button onclick="update(${r.id}, '${r.subject}')">Save</button>
        <button onclick="del(${r.id}, '${r.subject}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function update(id, subject) {
  const input = document.getElementById(`g_${id}_${subject.replace(/\s+/g,'_')}`);
  const grade = Number(input.value);
  if (isNaN(grade)) return alert('Enter a numeric grade');
  const name = prompt('Student name (leave empty to keep current)');
  const body = { subject, grade };
  if (name) body.name = name;
  const res = await fetch('/api/students/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  if (res.ok) { alert('Updated'); loadStudents(); }
  else { const e = await res.json().catch(()=>({error:'Update failed'})); alert(e.error || 'Update failed'); }
}

async function del(id, subject) {
  if (!confirm('Delete this subject record?')) return;
  const res = await fetch('/api/students/' + encodeURIComponent(id) + '?subject=' + encodeURIComponent(subject), {
    method: 'DELETE'
  });
  if (res.ok) { alert('Deleted'); loadStudents(); }
  else { alert('Delete failed'); }
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    id: fd.get('id'),
    name: fd.get('name'),
    subject: fd.get('subject'),
    grade: Number(fd.get('grade'))
  };
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  if (res.ok) { alert('Added'); e.target.reset(); loadStudents(); }
  else { const err = await res.json().catch(()=>({error:'Add failed'})); alert(err.error || 'Add failed'); }
});

loadStudents();
