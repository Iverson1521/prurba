// 📌 URL de tu API de Google Apps Script
const apiURL = "https://script.google.com/macros/s/AKfycbxfI5Funx67YyEzfpZiJTUXDeV_rB9vgKaprLLfbtOK651HI0qtLS2IPaPIgEfAO6BO/exec";

let studentsData = [];
let currentStudents = [];
let editingStudent = null;
let nextId = 5;

// 📌 Inicialización al cargar página
document.addEventListener('DOMContentLoaded', function() {
    fetch(apiURL)
      .then(response => response.json())
      .then(data => {
          studentsData = data;
          populateFilters();
          setupEventListeners();
      });
});

function setupEventListeners() {
    document.getElementById('institucion').addEventListener('change', handleInstitucionChange);
    document.getElementById('sede').addEventListener('change', handleSedeChange);
    document.getElementById('jornada').addEventListener('change', handleJornadaChange);
    document.getElementById('grado').addEventListener('change', handleGradoChange);
    document.getElementById('grupo').addEventListener('change', handleGrupoChange);
    document.getElementById('studentForm').addEventListener('submit', handleStudentFormSubmit);
}

function populateFilters() {
    const instituciones = [...new Set(studentsData.map(s => s.institucion))];
    const institucionSelect = document.getElementById('institucion');
    institucionSelect.innerHTML = '<option value="">Seleccionar institución...</option>';
    
    instituciones.forEach(inst => {
        const option = document.createElement('option');
        option.value = inst;
        option.textContent = inst;
        institucionSelect.appendChild(option);
    });
}

function handleInstitucionChange() {
    const institucion = document.getElementById('institucion').value;
    const sedeSelect = document.getElementById('sede');
    sedeSelect.innerHTML = '<option value="">Seleccionar sede...</option>';
    sedeSelect.disabled = !institucion;

    if (institucion) {
        const sedes = [...new Set(studentsData.filter(s => s.institucion === institucion).map(s => s.sede))];
        sedes.forEach(sede => {
            const option = document.createElement('option');
            option.value = sede;
            option.textContent = sede;
            sedeSelect.appendChild(option);
        });
    }

    resetFilters(['jornada', 'grado', 'grupo']);
}

function handleSedeChange() {
    const institucion = document.getElementById('institucion').value;
    const sede = document.getElementById('sede').value;
    const jornadaSelect = document.getElementById('jornada');
    jornadaSelect.innerHTML = '<option value="">Seleccionar jornada...</option>';
    jornadaSelect.disabled = !sede;

    if (sede) {
        const jornadas = [...new Set(studentsData.filter(s => 
            s.institucion === institucion && s.sede === sede
        ).map(s => s.jornada))];
        jornadas.forEach(jornada => {
            const option = document.createElement('option');
            option.value = jornada;
            option.textContent = jornada;
            jornadaSelect.appendChild(option);
        });
    }

    resetFilters(['grado', 'grupo']);
}

function handleJornadaChange() {
    const institucion = document.getElementById('institucion').value;
    const sede = document.getElementById('sede').value;
    const jornada = document.getElementById('jornada').value;
    const gradoSelect = document.getElementById('grado');
    gradoSelect.innerHTML = '<option value="">Seleccionar grado...</option>';
    gradoSelect.disabled = !jornada;

    if (jornada) {
        const grados = [...new Set(studentsData.filter(s => 
            s.institucion === institucion && s.sede === sede && s.jornada === jornada
        ).map(s => s.grado))].sort();
        grados.forEach(grado => {
            const option = document.createElement('option');
            option.value = grado;
            option.textContent = grado;
            gradoSelect.appendChild(option);
        });
    }

    resetFilters(['grupo']);
}

function handleGradoChange() {
    const institucion = document.getElementById('institucion').value;
    const sede = document.getElementById('sede').value;
    const jornada = document.getElementById('jornada').value;
    const grado = document.getElementById('grado').value;
    const grupoSelect = document.getElementById('grupo');
    grupoSelect.innerHTML = '<option value="">Seleccionar grupo...</option>';
    grupoSelect.disabled = !grado;

    if (grado) {
        const grupos = [...new Set(
            studentsData
                .filter(s =>
                    s.institucion === institucion &&
                    s.sede === sede &&
                    s.jornada === jornada &&
                    s.grado === grado &&
                    s.grupo
                )
                .map(s => s.grupo.toString().trim())
        )].sort();

        grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo;
            option.textContent = `Grupo ${grupo}`;
            grupoSelect.appendChild(option);
        });

        // ✅ Selección automática si solo hay un grupo
        if (grupos.length === 1) {
            grupoSelect.value = grupos[0];
            handleGrupoChange();
        }
    }

    document.getElementById('studentsSection').style.display = 'none';
    document.getElementById('observationsSection').style.display = 'none';
}


function handleGrupoChange() {
    const grupo = document.getElementById('grupo').value;
    if (grupo) {
        loadStudents();
        document.getElementById('studentsSection').style.display = 'block';
        document.getElementById('observationsSection').style.display = 'block';
    } else {
        document.getElementById('studentsSection').style.display = 'none';
        document.getElementById('observationsSection').style.display = 'none';
    }
}

function resetFilters(filters) {
    filters.forEach(filterId => {
        const select = document.getElementById(filterId);
        select.innerHTML = '<option value="">Seleccionar ' + filterId + '...</option>';
        select.disabled = true;
    });
    document.getElementById('studentsSection').style.display = 'none';
    document.getElementById('observationsSection').style.display = 'none';
}

function loadStudents() {
    const filters = {
        institucion: document.getElementById('institucion').value,
        sede: document.getElementById('sede').value,
        jornada: document.getElementById('jornada').value,
        grado: document.getElementById('grado').value,
        grupo: document.getElementById('grupo').value
    };
    currentStudents = studentsData.filter(student => 
        student.institucion === filters.institucion &&
        student.sede === filters.sede &&
        student.jornada === filters.jornada &&
        student.grado === filters.grado &&
        student.grupo?.toString().trim() === filters.grupo
    );
    displayStudents(currentStudents);
    updateAttendanceCount();
}

function displayStudents(students) {
    const studentsGrid = document.getElementById('studentsGrid');
    studentsGrid.innerHTML = '';
    students.forEach(student => {
        const studentCard = createStudentCard(student);
        studentsGrid.appendChild(studentCard);
    });
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
        <div class="student-info">
            <h3>${student.nombre}</h3>
            <p>📄 Doc: ${student.documento} | 🎂 Edad: ${student.edad}</p>
        </div>
        <select class="attendance-select ${student.asistencia}" onchange="updateAttendance('${student.documento}', this.value)">
            <option value="presente" ${student.asistencia === 'presente' ? 'selected' : ''}>✅ Presente</option>
            <option value="ausente" ${student.asistencia === 'ausente' ? 'selected' : ''}>❌ Ausente</option>
            <option value="retirado" ${student.asistencia === 'retirado' ? 'selected' : ''}>🚪 Retirado</option>
        </select>
    `;
    return card;
}

function updateAttendance(studentId, attendance) {
    const student = studentsData.find(s => s.documento === studentId);
    if (student) {
        student.asistencia = attendance;
        updateAttendanceCount();
        const select = document.querySelector(`select[onchange*="${studentId}"]`);
        select.className = `attendance-select ${attendance}`;
        fetch(apiURL, {
            method: "POST",
            body: JSON.stringify({
                accion: "actualizarAsistencia",
                id: studentId,
                asistencia: attendance
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(r => r.text())
        .then(res => console.log(res));
    }
}

function updateAttendanceCount() {
    const presente = currentStudents.filter(s => s.asistencia === 'presente').length;
    const ausente = currentStudents.filter(s => s.asistencia === 'ausente').length;
    const retirado = currentStudents.filter(s => s.asistencia === 'retirado').length;
    document.getElementById('presenteCount').textContent = presente;
    document.getElementById('ausenteCount').textContent = ausente;
    document.getElementById('retiradoCount').textContent = retirado;
}

function saveAttendance() {
    fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentsData)
    })
    .then(response => response.json())
    .then(data => {
        alert('✅ Asistencia guardada en Google Sheets.');
        console.log(data);
    })
    .catch(error => console.error("Error guardando asistencia:", error));
}
