Select * from DetallePedido
Select * from Pedidos
SELECT * FROM Productos

DROP PROCEDURE IF EXISTS SP_ProcesarPedido;
GO

-- =============================================
-- Stored Procedure: SP_ProcesarPedido (CORREGIDO)
-- Descripción: Procesa un pedido completo con validación de stock
-- =============================================
CREATE OR ALTER PROCEDURE SP_ProcesarPedido
    @IdUsuario INT,
    @Items NVARCHAR(MAX), -- JSON con los items del pedido
    @IdPedido INT OUTPUT,
    @Mensaje NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Inicializar valores de salida
    SET @IdPedido = 0;
    SET @Mensaje = '';
    
    DECLARE @Total DECIMAL(18,2) = 0;
    DECLARE @ErrorMsg NVARCHAR(500);
    
    -- Iniciar transacción
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE id_usuario = @IdUsuario)
        BEGIN
            SET @Mensaje = 'Usuario no encontrado';
            ROLLBACK TRANSACTION;
            RETURN -1;
        END
        
        -- Validar que el JSON no sea NULL o vacío
        IF @Items IS NULL OR @Items = '' OR @Items = '[]'
        BEGIN
            SET @Mensaje = 'No se proporcionaron items para el pedido';
            ROLLBACK TRANSACTION;
            RETURN -1;
        END
        
        -- Crear tabla temporal para los items
        CREATE TABLE #TempItems (
            IdProducto INT,
            IdVariante INT,
            Cantidad INT,
            PrecioUnitario DECIMAL(18,2),
            Subtotal DECIMAL(18,2)
        );
        
        -- Parsear JSON e insertar en tabla temporal con validación
        INSERT INTO #TempItems (IdProducto, IdVariante, Cantidad, PrecioUnitario, Subtotal)
        SELECT 
            CAST(JSON_VALUE(value, '$.IdProducto') AS INT),
            CAST(JSON_VALUE(value, '$.IdVariante') AS INT),
            CAST(JSON_VALUE(value, '$.Cantidad') AS INT),
            0, -- Se calculará después
            0  -- Se calculará después
        FROM OPENJSON(@Items)
        WHERE 
            ISNUMERIC(JSON_VALUE(value, '$.IdProducto')) = 1
            AND ISNUMERIC(JSON_VALUE(value, '$.IdVariante')) = 1
            AND ISNUMERIC(JSON_VALUE(value, '$.Cantidad')) = 1
            AND CAST(JSON_VALUE(value, '$.Cantidad') AS INT) > 0;
        
        -- Validar que se insertaron items
        IF NOT EXISTS (SELECT 1 FROM #TempItems)
        BEGIN
            SET @Mensaje = 'No se encontraron items válidos en el JSON';
            DROP TABLE #TempItems;
            ROLLBACK TRANSACTION;
            RETURN -1;
        END
        
        -- Validar stock y calcular precios
        DECLARE @IdProducto INT, @IdVariante INT, @Cantidad INT;
        DECLARE @Stock INT, @Precio DECIMAL(18,2), @PorcentajeDescuento DECIMAL(5,2);
        DECLARE @ProductoExiste BIT, @VarianteExiste BIT;
        
        DECLARE item_cursor CURSOR FOR 
        SELECT IdProducto, IdVariante, Cantidad FROM #TempItems;
        
        OPEN item_cursor;
        FETCH NEXT FROM item_cursor INTO @IdProducto, @IdVariante, @Cantidad;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Validar que el producto existe
            SELECT @ProductoExiste = CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
            FROM Productos 
            WHERE id_producto = @IdProducto;
            
            IF @ProductoExiste = 0
            BEGIN
                SET @ErrorMsg = 'El producto con ID ' + CAST(@IdProducto AS NVARCHAR(10)) + ' no existe';
                CLOSE item_cursor;
                DEALLOCATE item_cursor;
                DROP TABLE #TempItems;
                ROLLBACK TRANSACTION;
                SET @Mensaje = @ErrorMsg;
                RETURN -2;
            END
            
            -- Obtener stock de la variante
            SELECT 
                @Stock = stock,
                @VarianteExiste = 1
            FROM ProductoVariantes 
            WHERE id_variante = @IdVariante AND id_producto = @IdProducto;
            
            -- Validar que la variante existe
            IF @VarianteExiste IS NULL OR @Stock IS NULL
            BEGIN
                SET @ErrorMsg = 'La variante con ID ' + CAST(@IdVariante AS NVARCHAR(10)) + 
                                ' no existe para el producto ID ' + CAST(@IdProducto AS NVARCHAR(10));
                CLOSE item_cursor;
                DEALLOCATE item_cursor;
                DROP TABLE #TempItems;
                ROLLBACK TRANSACTION;
                SET @Mensaje = @ErrorMsg;
                RETURN -2;
            END
            
            -- Validar stock suficiente
            IF @Stock < @Cantidad
            BEGIN
                SET @ErrorMsg = 'Stock insuficiente para el producto: ' + 
                                (SELECT ISNULL(nombre_modelo, 'Desconocido') FROM Productos WHERE id_producto = @IdProducto) + 
                                ' (Talla: ' + CAST((SELECT talla FROM ProductoVariantes WHERE id_variante = @IdVariante) AS NVARCHAR(10)) + '). ' +
                                'Stock disponible: ' + CAST(@Stock AS NVARCHAR(10)) + 
                                ', Solicitado: ' + CAST(@Cantidad AS NVARCHAR(10));
                CLOSE item_cursor;
                DEALLOCATE item_cursor;
                DROP TABLE #TempItems;
                ROLLBACK TRANSACTION;
                SET @Mensaje = @ErrorMsg;
                RETURN -3;
            END
            
            -- Obtener precio y descuento del producto
            SELECT 
                @Precio = precio,
                @PorcentajeDescuento = ISNULL(porcentaje_descuento, 0)
            FROM Productos 
            WHERE id_producto = @IdProducto;
            
            -- Calcular precio con descuento si aplica
            IF @PorcentajeDescuento > 0
                SET @Precio = @Precio * (1 - @PorcentajeDescuento / 100.0);
            
            -- Actualizar precios en tabla temporal
            UPDATE #TempItems 
            SET 
                PrecioUnitario = @Precio,
                Subtotal = @Precio * @Cantidad
            WHERE IdProducto = @IdProducto AND IdVariante = @IdVariante;
            
            -- Reset variables
            SET @VarianteExiste = NULL;
            SET @Stock = NULL;
            
            FETCH NEXT FROM item_cursor INTO @IdProducto, @IdVariante, @Cantidad;
        END
        
        CLOSE item_cursor;
        DEALLOCATE item_cursor;
        
        -- Calcular total del pedido
        SELECT @Total = SUM(Subtotal) FROM #TempItems;
        
        -- Validar que el total sea mayor a 0
        IF @Total <= 0
        BEGIN
            SET @Mensaje = 'El total del pedido debe ser mayor a 0';
            DROP TABLE #TempItems;
            ROLLBACK TRANSACTION;
            RETURN -4;
        END
        
        -- Insertar el pedido
        INSERT INTO Pedidos (id_usuario, fecha_compra, total_pagado, estado_pedido)
        VALUES (@IdUsuario, GETDATE(), @Total, 'Pendiente');
        
        SET @IdPedido = SCOPE_IDENTITY();
        
        -- Insertar detalles del pedido
        INSERT INTO DetallePedido (id_pedido, id_producto, id_variante, cantidad_comprada, precio_unitario, subtotal)
        SELECT 
            @IdPedido,
            IdProducto,
            IdVariante,
            Cantidad,
            PrecioUnitario,
            Subtotal
        FROM #TempItems;
        
        -- Actualizar stock de las variantes
        UPDATE pv
        SET pv.stock = pv.stock - t.Cantidad
        FROM ProductoVariantes pv
        INNER JOIN #TempItems t ON pv.id_variante = t.IdVariante AND pv.id_producto = t.IdProducto;
        
        -- Limpiar tabla temporal
        DROP TABLE #TempItems;
        
        -- Confirmar transacción
        COMMIT TRANSACTION;
        
        SET @Mensaje = 'Pedido procesado exitosamente. Total: $' + CAST(@Total AS NVARCHAR(20));
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        -- Rollback en caso de error
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Limpiar tabla temporal si existe
        IF OBJECT_ID('tempdb..#TempItems') IS NOT NULL
            DROP TABLE #TempItems;
        
        SET @Mensaje = 'Error: ' + ERROR_MESSAGE() + ' (Línea: ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + ')';
        RETURN -99;
    END CATCH
END;
GO
Select * from Carrito

Select * from Productos
Select * from ProductoVariantes

Select * from Usuarios

Select * from Pedidos

Select * from Carrito

Select * from ProductoVariantes

ALTER TABLE Carrito
ADD id_variante INT NOT NULL;

ALTER TABLE Carrito
ADD CONSTRAINT FK_carrito_variante
FOREIGN KEY (id_variante) REFERENCES ProductoVariantes(id_variante);


Select * from Usuarios
arely.mendoza@utp.ac.pa