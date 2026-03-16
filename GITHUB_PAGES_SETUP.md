# Configuración de GitHub Pages

## 📖 Instrucciones para habilitar GitHub Pages

### Paso 1: Ir a Settings
1. Ve al repositorio: https://github.com/RonaldNTTDATA/claro_liq_solicitud
2. Click en la pestaña **Settings** (⚙️)

### Paso 2: Configurar Pages
1. En el menú lateral izquierdo, busca **Pages** (bajo "Code and automation")
2. En la sección **Build and deployment**:
   - **Source**: Selecciona "Deploy from a branch"
   - **Branch**: Selecciona `main`
   - **Folder**: Selecciona `/docs`
   - Click **Save**

### Paso 3: Espera el despliegue
- GitHub Pages tomará 1-2 minutos para construir el sitio
- Verás un mensaje verde cuando esté listo
- La URL será: `https://ronaldnttdata.github.io/claro_liq_solicitud/`

## 🔗 Acceso a la aplicación

Una vez configurado, la aplicación estará disponible en:

**🌐 URL Pública:** https://ronaldnttdata.github.io/claro_liq_solicitud/

## ✅ Verificación

Para verificar que funciona:
1. Abre la URL en tu navegador
2. Deberías ver la aplicación SAPUI5 cargarse
3. Si hay error 404, espera unos minutos más o verifica la configuración

## 🔧 Troubleshooting

### Problema: Error 404
**Solución**: 
- Verifica que en Settings → Pages esté configurado `/docs`
- Espera 2-3 minutos para que GitHub reconstruya el sitio
- Limpia caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)

### Problema: Pantalla blanca
**Solución**:
- Abre la consola del navegador (F12)
- Verifica errores de rutas en `manifest.json`
- Asegúrate de que `index.html` esté en `/docs`

### Problema: No carga recursos SAPUI5
**Solución**:
- Verifica conexión a internet (se carga desde CDN)
- Revisa que el index.html apunte a OpenUI5 CDN correcto

## 📝 Comandos útiles

### Actualizar el sitio
```bash
cd claro_liq_solicitud
# Hacer cambios en docs/
git add .
git commit -m "Update: descripción de cambios"
git push origin main
# GitHub Pages se actualiza automáticamente en 1-2 min
```

### Ver logs de despliegue
1. Ve a la pestaña **Actions** en GitHub
2. Verás el workflow "pages build and deployment"
3. Click para ver detalles si falla

## 🎨 Personalización

### Cambiar tema
Edita `docs/manifest.json`:
```json
"sap.ui5": {
  "dependencies": {
    "libs": {
      "sap.ui.core": {},
      "sap.m": {},
      "sap.f": {}
    }
  }
}
```

### Agregar página custom
Edita el README.md para mostrar información en la página principal del repo.

---

**Nota:** GitHub Pages es público. Si necesitas privacidad, considera GitHub Pro o alternativas privadas.
