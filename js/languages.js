// languages.js
// CRUD para Idiomas
// LANGUAGE_ID NUMBER, LANGUAGE_NAME VARCHAR2

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let languages = [];
    let editIndex = null;

    // Paginación backend
    let currentUrl = 'https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/languages/all';
    let nextUrl = null;
    let prevUrl = null;
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'd-flex justify-content-center my-3';

    // API REST Oracle con paginación
    const API_URL = 'https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/languages/all';
    async function fetchLanguages(url = currentUrl) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        // Guardar los enlaces de paginación
        nextUrl = data.next ? data.next['$ref'] : null;
        prevUrl = data.prev ? data.prev['$ref'] : null;
        currentUrl = url;
        // data.items contiene el array de idiomas
        return data.items.map(item => ({
          languageId: item.language_id,
          languageName: item.language_name,
          selected: false
        }));
      } catch (error) {
        console.error('Error al obtener idiomas:', error);
        nextUrl = null;
        prevUrl = null;
        return [];
      }
    }

    // Referencias a elementos
    const form = document.getElementById('languageForm');
    const addBtn = document.getElementById('addBtn');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const searchBtn = document.getElementById('searchBtn');
    const selectAll = document.getElementById('selectAll');
    const tableBody = document.querySelector('#languageTable tbody');

    // Modal y campos del modal
    const modalForm = document.getElementById('modalLanguageForm');
    const modalLanguageId = document.getElementById('modalLanguageId');
    const modalLanguageName = document.getElementById('modalLanguageName');
    const modalAddBtn = document.getElementById('modalAddBtn');

    // Referencias al modal de edición
    const editModal = document.getElementById('editModal');
    const modalEditForm = document.getElementById('modalEditForm');
    const editLanguageId = document.getElementById('editLanguageId');
    const editLanguageName = document.getElementById('editLanguageName');
    const modalEditBtn = document.getElementById('modalEditBtn');

    // Habilitar botón solo si los campos requeridos están llenos
    function checkModalFields() {
        if (modalLanguageId.value && modalLanguageName.value) {
            modalAddBtn.disabled = false;
        } else {
            modalAddBtn.disabled = true;
        }
    }
    modalLanguageId.addEventListener('input', checkModalFields);
    modalLanguageName.addEventListener('input', checkModalFields);

    // Validar duplicados antes de agregar
    function isDuplicate(languageId) {
        return languages.some(item => item.languageId == languageId);
    }

    // Habilitar/deshabilitar botón Editar
    function updateEditBtnState() {
        const selectedRows = languages.filter(item => item.selected);
        if (selectedRows.length === 1) {
            editBtn.disabled = false;
            editBtn.style.opacity = '1';
            editBtn.style.cursor = 'pointer';
        } else {
            editBtn.disabled = true;
            editBtn.style.opacity = '0.6';
            editBtn.style.cursor = 'not-allowed';
        }
    }
    // Habilitar/deshabilitar botón Eliminar
    function updateDeleteBtnState() {
        const selectedRows = languages.filter(item => item.selected);
        if (selectedRows.length > 0) {
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
            deleteBtn.style.cursor = 'pointer';
        } else {
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.6';
            deleteBtn.style.cursor = 'not-allowed';
        }
    }

    // Renderizar tabla
    function renderTable(data = languages) {
        tableBody.innerHTML = '';
        data.forEach((item, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type='checkbox' class='rowCheckbox' data-index='${i}' ${item.selected ? 'checked' : ''}></td>
                <td>${item.languageId}</td>
                <td>${item.languageName}</td>
            `;
            tableBody.appendChild(tr);
        });
        addCheckboxListeners(data);
        renderPagination();
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        // Botón anterior (prev)
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline-primary btn-sm mx-1';
        prevBtn.textContent = 'Anterior';
        prevBtn.disabled = !prevUrl;
        prevBtn.onclick = async () => {
            if (prevUrl) {
                const apiLanguages = await fetchLanguages(prevUrl);
                languages = apiLanguages;
                renderTable(languages);
            }
        };
        paginationContainer.appendChild(prevBtn);
        // Botón siguiente (next)
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline-primary btn-sm mx-1';
        nextBtn.textContent = 'Siguiente';
        nextBtn.disabled = !nextUrl;
        nextBtn.onclick = async () => {
            if (nextUrl) {
                const apiLanguages = await fetchLanguages(nextUrl);
                languages = apiLanguages;
                renderTable(languages);
            }
        };
        paginationContainer.appendChild(nextBtn);
        // Insertar debajo de la tabla
        const tableResponsive = document.querySelector('.table-responsive');
        if (tableResponsive && !paginationContainer.parentNode) {
            tableResponsive.parentNode.insertBefore(paginationContainer, tableResponsive.nextSibling);
        }
    }

    // Inicializar tabla al cargar
    // Inicializar tabla al cargar con datos del API (primera página)
    fetchLanguages(currentUrl).then(apiLanguages => {
      languages = apiLanguages;
      renderTable(languages);
    });

    // Sincronizar checkboxes y botones
    function addCheckboxListeners(data) {
        document.querySelectorAll('.rowCheckbox').forEach(cb => {
            cb.addEventListener('change', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                if (data !== languages) {
                    const realIdx = languages.findIndex(l => l.languageId == data[idx].languageId);
                    if (realIdx !== -1) languages[realIdx].selected = this.checked;
                } else {
                    languages[idx].selected = this.checked;
                }
                if (!this.checked) {
                    selectAll.checked = false;
                } else {
                    const allChecked = languages.length > 0 && languages.every(item => item.selected);
                    selectAll.checked = allChecked;
                }
                updateEditBtnState();
                updateDeleteBtnState();
            });
        });
        updateEditBtnState();
        updateDeleteBtnState();
        const allChecked = languages.length > 0 && languages.every(item => item.selected);
        selectAll.checked = allChecked;
    }

    // Editar registro (almacenar ID original)
    let originalLanguageId = null;
    editBtn.addEventListener('click', function() {
        const selectedIndexes = languages.map((item, idx) => item.selected ? idx : -1).filter(idx => idx !== -1);
        if (selectedIndexes.length !== 1) return;
        const idx = selectedIndexes[0];
        editLanguageId.value = languages[idx].languageId;
        editLanguageName.value = languages[idx].languageName;
        editIndex = idx;
        originalLanguageId = languages[idx].languageId;
        setTimeout(() => {
            let modal = bootstrap.Modal.getInstance(editModal);
            if (!modal) modal = new bootstrap.Modal(editModal);
            modal.show();
        }, 0);
    });

    // Guardar cambios al editar (API PUT, usa ID original)
    modalEditForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (editIndex === null) return;
        const newId = parseInt(editLanguageId.value, 10);
        const newName = String(editLanguageName.value).trim();
        if (isNaN(newId) || !newName) {
            alert('Todos los campos son obligatorios y deben tener el tipo correcto.');
            return;
        }
        // API Oracle
        const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/languages/all";
        const payload = {
            P_LANGUAGE_ID: originalLanguageId,
            P_N_LANGUAGE_ID: newId,
            P_N_LANGUAGE_NAME: newName
        };
        try {
            const response = await fetch(PROC_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            let data = {};
            let parseError = false;
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            } catch (jsonErr) {
                data = {};
                parseError = true;
            }
            // Si la respuesta tiene error, mostrarlo y NO cerrar el modal
            if (!response.ok || (data && data.error)) {
                const errorMsg = (data && data.error && data.error.message) ? data.error.message : response.statusText;
                mostrarMensajeModal('error', 'Error específico: ' + errorMsg);
                return;
            }
            // Si la respuesta es exitosa (status 2xx), cerrar el modal y mostrar éxito
            mostrarMensajeModal('success', 'Idioma editado correctamente en la base de datos.');
            const editModalEl = document.getElementById('editModal');
            let modal = bootstrap.Modal.getInstance(editModalEl);
            if (!modal) modal = new bootstrap.Modal(editModalEl);
            modal.hide();
            // Recargar idiomas desde el backend
            const apiLanguages = await fetchLanguages(currentUrl);
            languages = apiLanguages;
            renderTable(languages);
            editIndex = null;
            originalLanguageId = null;
        } catch (err) {
            alert('Error de red o servidor: ' + err.message);
        }
    });

    // Mensaje de error para eliminar
    let deleteError = null;
    if (!document.getElementById('deleteError')) {
        deleteError = document.createElement('span');
        deleteError.id = 'deleteError';
        deleteError.className = 'text-danger ms-2';
        deleteError.style.fontSize = '0.9em';
        deleteError.style.display = 'none';
        deleteBtn.parentNode.appendChild(deleteError);
    } else {
        deleteError = document.getElementById('deleteError');
    }

    // Eliminar registros seleccionados (API DELETE)
    deleteBtn.addEventListener('click', async function() {
        const selectedLanguages = languages.filter(item => item.selected);
        if (selectedLanguages.length === 0) {
            deleteError.textContent = 'Selecciona al menos una fila para eliminar.';
            deleteError.style.display = 'inline';
            return;
        }
        deleteError.textContent = '';
        deleteError.style.display = 'none';
        for (const lang of selectedLanguages) {
            const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/languages/all";
            const payload = { P_LANGUAGE_ID: lang.languageId };
            try {
                const response = await fetch(PROC_URL, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                let data = {};
                try {
                    const text = await response.text();
                    data = text ? JSON.parse(text) : {};
                } catch (jsonErr) {
                    data = {};
                }
                if (!response.ok || (data && data.error)) {
                    const errorMsg = (data && data.error && data.error.message) ? data.error.message : response.statusText;
                    mostrarMensajeModal('error', 'Error al eliminar idioma ' + lang.languageId + ': ' + errorMsg);
                    continue;
                }
                mostrarMensajeModal('success', 'Idioma ' + lang.languageId + ' eliminado correctamente.');
            } catch (err) {
                mostrarMensajeModal('error', 'Error de red o servidor al eliminar idioma ' + lang.languageId + ': ' + err.message);
            }
        }
        // Recargar idiomas desde el backend
        const apiLanguages = await fetchLanguages(currentUrl);
        languages = apiLanguages;
        renderTable(languages);
        updateDeleteBtnState();
    });

    // Seleccionar/deseleccionar todas las filas
    selectAll.addEventListener('change', function() {
        const checked = selectAll.checked;
        languages.forEach(item => { item.selected = checked; });
        renderTable();
        setTimeout(() => {
            document.querySelectorAll('.rowCheckbox').forEach(cb => {
                cb.checked = checked;
            });
            updateEditBtnState();
            updateDeleteBtnState();
        }, 0);
    });

    // Agregar registro desde el modal (API y manejo robusto)
    modalForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Validar tipos y campos
        const languageId = parseInt(modalLanguageId.value, 10);
        const languageName = String(modalLanguageName.value).trim();
        if (isNaN(languageId) || !languageName) {
            alert('Todos los campos son obligatorios y deben tener el tipo correcto.');
            return;
        }
        // API Oracle
        const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/languages/all";
        const payload = {
            LANGUAGE_ID: languageId,
            LANGUAGE_NAME: languageName
        };
        try {
            const response = await fetch(PROC_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            let data = {};
            let parseError = false;
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            } catch (jsonErr) {
                data = {};
                parseError = true;
            }
            // Si la respuesta tiene error, mostrarlo y NO cerrar el modal
            if (!response.ok || (data && data.error)) {
                const errorMsg = (data && data.error && data.error.message) ? data.error.message : response.statusText;
                mostrarMensajeModal('error', 'Error específico: ' + errorMsg);
                return;
            }
            // Si la respuesta es exitosa (status 2xx), cerrar el modal y mostrar éxito
            mostrarMensajeModal('success', 'Idioma agregado correctamente en la base de datos.');
            modalForm.reset();
            checkModalFields();
            const addModalEl = document.getElementById('addModal');
            let addModal = bootstrap.Modal.getInstance(addModalEl);
            if (!addModal) addModal = new bootstrap.Modal(addModalEl);
            addModal.hide();
            // Recargar idiomas desde el backend
            const apiLanguages = await fetchLanguages(currentUrl);
            languages = apiLanguages;
            renderTable(languages);
        } catch (err) {
            alert('Error de red o servidor: ' + err.message);
        }
    });

    // Función para mostrar mensajes en el modal de agregar
    function mostrarMensajeModal(tipo, mensaje) {
        const modalBody = document.querySelector('#addModal .modal-body');
        let msgDiv = document.getElementById('modalMsg');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.id = 'modalMsg';
            modalBody.insertBefore(msgDiv, modalBody.firstChild);
        }
        msgDiv.textContent = mensaje;
        msgDiv.className = tipo === 'success' ? 'alert alert-success mt-2' : 'alert alert-danger mt-2';
        msgDiv.style.display = 'block';
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 2000);
    }

    // Inicializar estado de los botones
    updateDeleteBtnState();

    // Buscar idiomas
    // La lógica de búsqueda ha sido eliminada.
});
