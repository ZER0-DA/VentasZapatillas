document.addEventListener('DOMContentLoaded', () => {

const API_URL = 'https://localhost:7030/api/Productos/NuevoProducto';

    const container = document.getElementById('stock-variants-container');
    const addButton = document.getElementById('add-variant-button');
    const form = document.getElementById('container-cms');
    
    // Función para crear una nueva fila de Talla/Stock
    function createStockVariantRow() {
        const row = document.createElement('div');
        row.className = 'variant-row';
        
        row.innerHTML = `
            <div class="variant-input">
                <label>Talla</label>
                <input type="number" 
                    class="talla-input" 
                    placeholder="Ej: 42" 
                    min="1" required>
            </div>
            
            <div class="variant-input">
                <label>Stock</label>
                <input type="number" 
                    class="stock-input" 
                    placeholder="Cantidad" 
                    min="0" required>
            </div>
            
            <button type="button" class="remove-button" title="Eliminar talla">X</button>
        `;
        
        const removeButton = row.querySelector('.remove-button');
        removeButton.addEventListener('click', () => {
            row.remove();
        });

        return row;
    }

    // Inicializa la primera fila de variante
    function addStockVariant() {
        const newRow = createStockVariantRow();
        container.appendChild(newRow);
    }
    
    addStockVariant();
    addButton.addEventListener('click', addStockVariant);


    // --- Manejo del envío del Formulario ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Recoger y estructurar las variantes dinámicas (Tallas y Stock)
        const variantRows = document.querySelectorAll('.variant-row');
        const variantesArray = [];
        let totalStock = 0;

        variantRows.forEach(row => {
            const tallaInput = row.querySelector('.talla-input');
            const stockInput = row.querySelector('.stock-input');
            
            if (tallaInput.value && stockInput.value) {
                const talla = parseInt(tallaInput.value);
                const stock = parseInt(stockInput.value);

                if (!isNaN(talla) && !isNaN(stock) && stock >= 0) {
                    variantesArray.push({
                        Talla: talla, // Usa Talla y Stock con mayúscula inicial (coincide con VarianteDTO en C#)
                        Stock: stock
                    });
                    totalStock += stock;
                }
            }
        });

        if (variantesArray.length === 0 || totalStock < 0) {
            alert('Error: Debe añadir al menos una talla con stock.');
            return;
        }

        const formDataApi = new FormData();

        const imagenInput = document.getElementById('imagenProducto');
        if (imagenInput.files.length > 0) {
            // El nombre del campo ('imagen') DEBE coincidir con el parámetro IFormFile en el controlador
            formDataApi.append('imagen', imagenInput.files[0]);
        } else {
            alert('Error: Debe seleccionar una imagen para el producto.');
            return;
        }

        formDataApi.append('Marca', form.querySelector('#marca').value);
        formDataApi.append('Modelo', form.querySelector('#modelo').value);
        formDataApi.append('Descripcion', form.querySelector('#descripcion').value);
        formDataApi.append('Precio', form.querySelector('#precio').value); 
        formDataApi.append('Seccion', form.querySelector('#seccion').value);
        
        formDataApi.append('EsDestacado', form.querySelector('#esDestacado').checked ? 'true' : 'false');
        formDataApi.append('EnOferta', form.querySelector('#enOferta').checked ? 'true' : 'false');

        formDataApi.append('PorcentajeDescuento', form.querySelector('#porcentajeDescuento').value);

        const variantesJsonString = JSON.stringify(variantesArray);
        formDataApi.append('Variantes', variantesJsonString);
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formDataApi 
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Éxito: Producto creado. ID: ${result.productoId}`);

                if (window.opener && window.opener.cargarProductos) {
                window.opener.cargarProductos();

    }
                form.reset(); 
                container.innerHTML = ''; 
                addStockVariant(); 
            } else {
                const error = await response.json();
                console.error(error);
                alert(`Error del servidor: ${error.mensaje || response.statusText}`);
            }
        } catch (error) {
            console.error('Error de red o CORS:', error);
            alert('ubo un problema de conexión. Asegúrate que la API esté corriendo.');
        }
    });
});