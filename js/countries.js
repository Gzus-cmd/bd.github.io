// countries.js
// CRUD para Países
// COUNTRY_ID NUMBER, REGION_ID NUMBER, COUNTRY_NAME VARCHAR2, CURRENCY_CODE VARCHAR2

document.addEventListener('DOMContentLoaded', function() {
    // Paginación backend
    let currentUrl = 'https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/countries/all';
    let nextUrl = null;
    let prevUrl = null;
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'd-flex justify-content-center my-3';

    // Variables globales
    let countries = [];
    let editIndex = null;

    // API REST Oracle con paginación
    const API_URL = 'https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/countries/all';
    async function fetchCountries(url = currentUrl) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        // Guardar los enlaces de paginación
        nextUrl = data.next ? data.next['$ref'] : null;
        prevUrl = data.prev ? data.prev['$ref'] : null;
        currentUrl = url;
        // data.items contiene el array de países
        return data.items.map(item => ({
          countryId: item.country_id,
          regionId: item.region_id,
          countryName: item.country_name,
          currencyCode: item.currency_code,
          selected: false
        }));
      } catch (error) {
        console.error('Error al obtener países:', error);
        nextUrl = null;
        prevUrl = null;
        return [];
      }
    }

    // Referencias a elementos
    const form = document.getElementById('countryForm');
    const addBtn = document.getElementById('addBtn');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    // const searchBtn = document.getElementById('searchBtn'); // Eliminado porque ya no existe
    const selectAll = document.getElementById('selectAll');
    const tableBody = document.querySelector('#countryTable tbody');

    // Modal y campos del modal
    const modalForm = document.getElementById('modalCountryForm');
    const modalCountryId = document.getElementById('modalCountryId');
    const modalRegionId = document.getElementById('modalRegionId');
    const modalCountryName = document.getElementById('modalCountryName');
    const modalCurrencyCode = document.getElementById('modalCurrencyCode');
    const modalAddBtn = document.getElementById('modalAddBtn');

    // Referencias al modal de edición
    const editModal = document.getElementById('editModal');
    const modalEditForm = document.getElementById('modalEditForm');
    const editCountryId = document.getElementById('editCountryId');
    const editRegionId = document.getElementById('editRegionId');
    const editCountryName = document.getElementById('editCountryName');
    const editCurrencyCode = document.getElementById('editCurrencyCode');
    const modalEditBtn = document.getElementById('modalEditBtn');

    // Habilitar botón solo si los campos requeridos están llenos
    function checkModalFields() {
        if (modalCountryId.value && modalRegionId.value && modalCountryName.value && modalCurrencyCode.value) {
            modalAddBtn.disabled = false;
        } else {
            modalAddBtn.disabled = true;
        }
    }
    modalCountryId.addEventListener('input', checkModalFields);
    modalRegionId.addEventListener('input', checkModalFields);
    modalCountryName.addEventListener('input', checkModalFields);
    modalCurrencyCode.addEventListener('input', checkModalFields);

    // Validar duplicados antes de agregar
    function isDuplicate(countryId) {
        return countries.some(item => item.countryId == countryId);
    }

    // Habilitar/deshabilitar botón Editar
    function updateEditBtnState() {
        const selectedRows = countries.filter(item => item.selected);
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
        const selectedRows = countries.filter(item => item.selected);
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
    function renderTable(data = countries) {
        tableBody.innerHTML = '';
        // Renderizar todos los países recibidos (ya paginados por backend)
        data.forEach((item, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type='checkbox' class='rowCheckbox' data-index='${i}' ${item.selected ? 'checked' : ''}></td>
                <td>${item.countryId}</td>
                <td>${item.regionId}</td>
                <td>${item.countryName}</td>
                <td>${item.currencyCode}</td>
            `;
            tableBody.appendChild(tr);
        });
        addCheckboxListeners(data);
        renderPagination();
    }

    function renderPagination(totalPages) {
        paginationContainer.innerHTML = '';
        // Botón anterior (prev)
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline-primary btn-sm mx-1';
        prevBtn.textContent = 'Anterior';
        prevBtn.disabled = !prevUrl;
        prevBtn.onclick = async () => {
            if (prevUrl) {
                countries = await fetchCountries(prevUrl);
                renderTable(countries);
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
                countries = await fetchCountries(nextUrl);
                renderTable(countries);
            }
        };
        paginationContainer.appendChild(nextBtn);
        // Insertar debajo de la tabla
        const tableResponsive = document.querySelector('.table-responsive');
        if (tableResponsive && !paginationContainer.parentNode) {
            tableResponsive.parentNode.insertBefore(paginationContainer, tableResponsive.nextSibling);
        }
    }

    // Inicializar tabla al cargar con datos del API (primera página)
    fetchCountries(currentUrl).then(apiCountries => {
      countries = apiCountries;
      renderTable(countries);
    });

    // Sincronizar checkboxes y botones
    function addCheckboxListeners(data) {
        document.querySelectorAll('.rowCheckbox').forEach(cb => {
            cb.addEventListener('change', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                if (data !== countries) {
                    const realIdx = countries.findIndex(c => c.countryId == data[idx].countryId);
                    if (realIdx !== -1) countries[realIdx].selected = this.checked;
                } else {
                    countries[idx].selected = this.checked;
                }
                if (!this.checked) {
                    selectAll.checked = false;
                } else {
                    const allChecked = countries.length > 0 && countries.every(item => item.selected);
                    selectAll.checked = allChecked;
                }
                updateEditBtnState();
                updateDeleteBtnState();
            });
        });
        updateEditBtnState();
        updateDeleteBtnState();
        const allChecked = countries.length > 0 && countries.every(item => item.selected);
        selectAll.checked = allChecked;
    }

    // Editar registro
    editBtn.addEventListener('click', function() {
        const selectedIndexes = countries.map((item, idx) => item.selected ? idx : -1).filter(idx => idx !== -1);
        if (selectedIndexes.length !== 1) return;
        const idx = selectedIndexes[0];
        // Solo mostrar el campo de nombre para editar
        editCountryName.value = countries[idx].countryName;
        editIndex = idx;
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
        const countryId = countries[editIndex].countryId;
        const newCountryName = editCountryName.value;
        // Preparar payload para el procedimiento UPDATE_COUNTRY solo con nombre
        const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/countries/all";
        const payload = {
            P_COUNTRY_ID: Number(countryId),
            P_N_COUNTRY_NAME: String(newCountryName)
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
                mostrarMensajeModal('error', 'Error al editar país: ' + errorMsg);
                return;
            }
            mostrarMensajeModal('success', 'Nombre de país editado correctamente.');
            // Cerrar modal y refrescar tabla
            const modal = bootstrap.Modal.getInstance(editModal);
            if (modal) modal.hide();
            editIndex = null;
            // Recargar países desde el backend
            const apiCountries = await fetchCountries(currentUrl);
            countries = apiCountries;
            renderTable(countries);
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
        const selectedCountries = countries.filter(item => item.selected);
        if (selectedCountries.length === 0) {
            deleteError.textContent = 'Selecciona al menos una fila para eliminar.';
            deleteError.style.display = 'inline';
            return;
        }
        deleteError.textContent = '';
        deleteError.style.display = 'none';
        for (const country of selectedCountries) {
            const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/countries/all";
            const payload = { P_COUNTRY_ID: country.countryId };
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
                    mostrarMensajeModal('error', 'Error al eliminar país ' + country.countryId + ': ' + errorMsg);
                    continue;
                }
                mostrarMensajeModal('success', 'País ' + country.countryId + ' eliminado correctamente.');
            } catch (err) {
                mostrarMensajeModal('error', 'Error de red o servidor al eliminar país ' + country.countryId + ': ' + err.message);
            }
        }
        // Recargar países desde el backend
        const apiCountries = await fetchCountries(currentUrl);
        countries = apiCountries;
        renderTable(countries);
        updateDeleteBtnState();
    });

    // Seleccionar/deseleccionar todas las filas
    selectAll.addEventListener('change', function() {
        const checked = selectAll.checked;
        countries.forEach(item => { item.selected = checked; });
        renderTable();
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
        // Convertir y validar tipos
        const countryId = parseInt(modalCountryId.value, 10);
        const regionId = parseInt(modalRegionId.value, 10);
        const countryName = String(modalCountryName.value).trim();
        const currencyCode = String(modalCurrencyCode.value).trim();
        const languageId = parseInt(document.getElementById('modalLanguageId').value, 10);

        if (
            isNaN(countryId) || isNaN(regionId) || isNaN(languageId) ||
            !countryName || !currencyCode
        ) {
            alert('Todos los campos son obligatorios y deben tener el tipo correcto.');
            return;
        }

        // Realizar la petición directamente aquí con la nueva URL
        const PROC_URL = "https://g78208b3b569888-cdy68get8b83bqvk.adb.sa-santiago-1.oraclecloudapps.com/ords/undcdb/countries/all";
        const payload = {
            P_COUNTRY_ID: countryId,
            P_COUNTRY_NAME: countryName,
            P_REGION_ID: regionId,
            P_CURRENCY_CODE: currencyCode,
            P_LANGUAGE_ID: languageId
        };
        console.log('Payload enviado:', payload);
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
            mostrarMensajeModal('success', 'País agregado correctamente en la base de datos.');
            modalForm.reset();
            checkModalFields();
            const addModalEl = document.getElementById('addModal');
            let addModal = bootstrap.Modal.getInstance(addModalEl);
            if (!addModal) addModal = new bootstrap.Modal(addModalEl);
            addModal.hide();
            // Recargar países desde el backend
            const apiCountries = await fetchCountries(currentUrl);
            countries = apiCountries;
            renderTable(countries);
        } catch (err) {
            alert('Error de red o servidor: ' + err.message);
        }
    });

    // Inicializar estado de los botones
    updateDeleteBtnState();

    // Eliminada la lógica de búsqueda porque los elementos ya no existen en el HTML
    });
    
    // ...el resto del código...

    // Función global para mostrar mensajes en los modales
    function mostrarMensajeModal(tipo, mensaje) {
        // Detectar si el modal de edición está abierto
        let modalBody = document.querySelector('.modal.show .modal-body');
        if (!modalBody) {
            // Si no hay modal abierto, usar el de agregar
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
