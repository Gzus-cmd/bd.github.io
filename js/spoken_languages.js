// spoken_languages.js
// Aquí va la lógica para Buscar, Agregar, Editar y Eliminar
// Puedes usar eventos y manipulación del DOM para conectar los botones y la tabla

// Ejemplo de estructura base:

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let spokenLanguages = [];
    let editIndex = null;

    // Paginación backend
    let currentUrl = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/spoken_languages/all";
    let nextUrl = null;
    let prevUrl = null;
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'd-flex justify-content-center my-3';

    // API REST Oracle con paginación
    const API_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/spoken_languages/all";
    async function fetchSpokenLanguages(url = currentUrl) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        // Guardar los enlaces de paginación
        nextUrl = data.next ? data.next['$ref'] : null;
        prevUrl = data.prev ? data.prev['$ref'] : null;
        currentUrl = url;
        // data.items contiene el array de idiomas hablados
        return data.items.map(item => ({
          countryId: item.country_id,
          languageId: item.language_id,
          official: item.official,
          description: item.description,
          selected: false
        }));
      } catch (error) {
        console.error('Error al obtener idiomas hablados:', error);
        nextUrl = null;
        prevUrl = null;
        return [];
      }
    }
    // Función para habilitar/deshabilitar el botón Eliminar
    function updateDeleteBtnState() {
        const selectedRows = spokenLanguages.filter(item => item.selected);
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

    // Referencias a elementos
    const form = document.getElementById('spokenForm');
    const addBtn = document.getElementById('addBtn');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const searchBtn = document.getElementById('searchBtn');
    const selectAll = document.getElementById('selectAll');
    const tableBody = document.querySelector('#spokenTable tbody');

    // Modal y campos del modal
    const modalForm = document.getElementById('modalSpokenForm');
    const modalCountryId = document.getElementById('modalCountryId');
    const modalLanguageId = document.getElementById('modalLanguageId');
    const modalOfficial = document.getElementById('modalOfficial');
    const modalDescription = document.getElementById('modalDescription');
    const modalAddBtn = document.getElementById('modalAddBtn');

    // Referencias al modal de edición
    const editModal = document.getElementById('editModal');
    const modalEditForm = document.getElementById('modalEditForm');
    const editCountryId = document.getElementById('editCountryId');
    const editLanguageId = document.getElementById('editLanguageId');
    const editOfficial = document.getElementById('editOfficial');
    const editDescription = document.getElementById('editDescription');
    const modalEditBtn = document.getElementById('modalEditBtn');

    // Habilitar botón solo si los campos requeridos están llenos
    function checkModalFields() {
        if (modalCountryId.value && modalLanguageId.value && modalOfficial.value) {
            modalAddBtn.disabled = false;
        } else {
            modalAddBtn.disabled = true;
        }
    }
    modalCountryId.addEventListener('input', checkModalFields);
    modalLanguageId.addEventListener('input', checkModalFields);
    modalOfficial.addEventListener('input', checkModalFields);

    // Validar duplicados antes de agregar
    function isDuplicate(countryId, languageId) {
        return spokenLanguages.some(item => item.countryId == countryId && item.languageId == languageId);
    }

    // ...existing code...

    // Habilitar/deshabilitar botón Editar según selección
    function updateEditBtnState() {
        const selectedRows = spokenLanguages.filter(item => item.selected);
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

    // Actualizar estado del botón Editar al cargar y al cambiar selección
    function addCheckboxListeners(data) {
        document.querySelectorAll('.rowCheckbox').forEach(cb => {
            cb.addEventListener('change', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                if (data !== spokenLanguages) {
                    const realIdx = spokenLanguages.findIndex(sl => sl.countryId == data[idx].countryId && sl.languageId == data[idx].languageId && sl.official == data[idx].official);
                    if (realIdx !== -1) spokenLanguages[realIdx].selected = this.checked;
                } else {
                    spokenLanguages[idx].selected = this.checked;
                }
                // Si se desmarca cualquier casilla, desmarcar el selectAll
                if (!this.checked) {
                    selectAll.checked = false;
                } else {
                    // Si todas las casillas están marcadas, marcar el selectAll
                    const allChecked = spokenLanguages.length > 0 && spokenLanguages.every(item => item.selected);
                    selectAll.checked = allChecked;
                }
                updateEditBtnState();
                updateDeleteBtnState();
            });
        });
        updateEditBtnState();
        updateDeleteBtnState();
        // Sincronizar el selectAll al renderizar
        const allChecked = spokenLanguages.length > 0 && spokenLanguages.every(item => item.selected);
        selectAll.checked = allChecked;
    }

    // Función para renderizar la tabla
    function renderTable(data = spokenLanguages) {
        tableBody.innerHTML = '';
        data.forEach((item, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type='checkbox' class='rowCheckbox' data-index='${i}' ${item.selected ? 'checked' : ''}></td>
                <td>${item.countryId}</td>
                <td>${item.languageId}</td>
                <td>${item.official}</td>
                <td>${item.description !== null && item.description !== undefined && item.description !== '' ? item.description : ''}</td>
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
                const apiSpokenLanguages = await fetchSpokenLanguages(prevUrl);
                spokenLanguages = apiSpokenLanguages;
                renderTable(spokenLanguages);
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
                const apiSpokenLanguages = await fetchSpokenLanguages(nextUrl);
                spokenLanguages = apiSpokenLanguages;
                renderTable(spokenLanguages);
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
    fetchSpokenLanguages(currentUrl).then(apiSpokenLanguages => {
      spokenLanguages = apiSpokenLanguages;
      renderTable(spokenLanguages);
    });

    // Editar registro
    editBtn.addEventListener('click', function() {
        const selectedIndexes = spokenLanguages.map((item, idx) => item.selected ? idx : -1).filter(idx => idx !== -1);
        if (selectedIndexes.length !== 1) return;
        const idx = selectedIndexes[0];
        editCountryId.value = spokenLanguages[idx].countryId;
        editLanguageId.value = spokenLanguages[idx].languageId;
        editOfficial.value = spokenLanguages[idx].official;
        editDescription.value = spokenLanguages[idx].description || '';
        editIndex = idx;
        // Forzar el modal a mostrarse correctamente
        setTimeout(() => {
            let modal = bootstrap.Modal.getInstance(editModal);
            if (!modal) modal = new bootstrap.Modal(editModal);
            modal.show();
        }, 0);
    });

    // Guardar cambios al editar
    modalEditForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (editIndex === null) return;
        const countryId = parseInt(editCountryId.value, 10);
        const languageId = parseInt(editLanguageId.value, 10);
        const newOfficial = String(editOfficial.value).trim();
        const newDescription = String(editDescription.value).trim();
        if (isNaN(countryId) || isNaN(languageId) || !newOfficial) {
            mostrarMensajeModal('error', 'Todos los campos obligatorios deben estar completos y tener el tipo correcto.');
            return;
        }
        // Preparar payload para el procedimiento UPDATE_SPOKEN_LANGUAGE
        const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/spoken_languages/all";
        const payload = {
            P_COUNTRY_ID: countryId,
            P_LANGUAGE_ID: languageId,
            P_N_OFFICIAL: newOfficial,
            P_N_DESCRIPTION: newDescription || null
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
            if (!response.ok || (data && data.error)) {
                const errorMsg = (data && data.error && data.error.message) ? data.error.message : response.statusText;
                mostrarMensajeModal('error', 'Error al editar idioma hablado: ' + errorMsg);
                return;
            }
            mostrarMensajeModal('success', 'Idioma hablado editado correctamente.');
            // Cerrar modal y refrescar tabla
            const modal = bootstrap.Modal.getInstance(editModal);
            if (modal) modal.hide();
            editIndex = null;
            // Recargar idiomas hablados desde el backend
            const apiSpokenLanguages = await fetchSpokenLanguages(currentUrl);
            spokenLanguages = apiSpokenLanguages;
            renderTable(spokenLanguages);
        } catch (err) {
            mostrarMensajeModal('error', 'Error de red o servidor: ' + err.message);
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

    // Eliminar registros seleccionados
    deleteBtn.addEventListener('click', async function() {
        const selectedItems = spokenLanguages.filter(item => item.selected);
        if (selectedItems.length === 0) {
            deleteError.textContent = 'Selecciona al menos una fila para eliminar.';
            deleteError.style.display = 'inline';
            return;
        }
        deleteError.textContent = '';
        deleteError.style.display = 'none';
        for (const item of selectedItems) {
            const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/spoken_languages/all";
            const payload = {
                P_COUNTRY_ID: item.countryId,
                P_LANGUAGE_ID: item.languageId
            };
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
                    mostrarMensajeModal('error', 'Error al eliminar relación: ' + errorMsg);
                    continue;
                }
                mostrarMensajeModal('success', 'Relación eliminada correctamente.');
            } catch (err) {
                mostrarMensajeModal('error', 'Error de red o servidor al eliminar relación: ' + err.message);
            }
        }
        // Recargar idiomas hablados desde el backend
        const apiSpokenLanguages = await fetchSpokenLanguages(currentUrl);
        spokenLanguages = apiSpokenLanguages;
        renderTable(spokenLanguages);
        updateDeleteBtnState();
    });

    // Seleccionar/deseleccionar todas las filas
    selectAll.addEventListener('change', function() {
        const checked = selectAll.checked;
        spokenLanguages.forEach(item => { item.selected = checked; });
        renderTable();
        // Esperar a que el DOM se actualice antes de sincronizar los checkboxes
        setTimeout(() => {
            document.querySelectorAll('.rowCheckbox').forEach(cb => {
                cb.checked = checked;
            });
            updateEditBtnState();
            updateDeleteBtnState();
        }, 0);
    });

    // Agregar registro desde el modal
    modalForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const countryId = parseInt(modalCountryId.value, 10);
        const languageId = parseInt(modalLanguageId.value, 10);
        const official = String(modalOfficial.value).trim();
        const description = String(modalDescription.value).trim();
        // Validar campos
        if (isNaN(countryId) || isNaN(languageId) || !official) {
            alert('Todos los campos obligatorios deben estar completos y tener el tipo correcto.');
            return;
        }
        // Preparar payload para el procedimiento
        const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/spoken_languages/all";
        const payload = {
            COUNTRY_ID: countryId,
            LANGUAGE_ID: languageId,
            OFFICIAL: official,
            COMMENTS: description || null
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
            if (!response.ok || (data && data.error)) {
                const errorMsg = (data && data.error && data.error.message) ? data.error.message : response.statusText;
                mostrarMensajeModal('error', 'Error específico: ' + errorMsg);
                return;
            }
            mostrarMensajeModal('success', 'Idioma hablado agregado correctamente.');
            modalForm.reset();
            checkModalFields();
            const addModalEl = document.getElementById('addModal');
            let addModal = bootstrap.Modal.getInstance(addModalEl);
            if (!addModal) addModal = new bootstrap.Modal(addModalEl);
            addModal.hide();
            // Recargar idiomas hablados desde el backend
            const apiSpokenLanguages = await fetchSpokenLanguages(currentUrl);
            spokenLanguages = apiSpokenLanguages;
            renderTable(spokenLanguages);
        } catch (err) {
            alert('Error de red o servidor: ' + err.message);
        }
    });
    // Función global para mostrar mensajes en los modales
    function mostrarMensajeModal(tipo, mensaje) {
        let modalBody = document.querySelector('.modal.show .modal-body');
        if (!modalBody) {
            modalBody = document.querySelector('#addModal .modal-body');
        }
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

    // Modificar addCheckboxListeners para sincronizar el checkbox de cabecera
    function addCheckboxListeners(data) {
        document.querySelectorAll('.rowCheckbox').forEach(cb => {
            cb.addEventListener('change', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                if (data !== spokenLanguages) {
                    const realIdx = spokenLanguages.findIndex(sl => sl.countryId == data[idx].countryId && sl.languageId == data[idx].languageId && sl.official == data[idx].official);
                    if (realIdx !== -1) spokenLanguages[realIdx].selected = this.checked;
                } else {
                    spokenLanguages[idx].selected = this.checked;
                }
                // Si se desmarca cualquier casilla, desmarcar el selectAll
                if (!this.checked) {
                    selectAll.checked = false;
                } else {
                    // Si todas las casillas están marcadas, marcar el selectAll
                    const allChecked = spokenLanguages.length > 0 && spokenLanguages.every(item => item.selected);
                    selectAll.checked = allChecked;
                }
                updateEditBtnState();
                updateDeleteBtnState();
            });
        });
        updateEditBtnState();
        updateDeleteBtnState();
        // Sincronizar el selectAll al renderizar
        const allChecked = spokenLanguages.length > 0 && spokenLanguages.every(item => item.selected);
        selectAll.checked = allChecked;
    }

    // Inicializar estado del botón Eliminar al cargar
    updateDeleteBtnState();

    // Funciones CRUD (debes implementar la lógica)
});
