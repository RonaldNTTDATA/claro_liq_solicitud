# Claro Liquidación - Solicitud de Cierre

Aplicación SAPUI5 para gestionar solicitudes de cierre de proyectos.

## 📋 Descripción

Esta aplicación permite a los usuarios crear y gestionar solicitudes de cierre de proyectos, incluyendo:
- Formulario de solicitud de cierre
- Selección de proyectos
- Gestión de PEPs (Posiciones de Estructura de Proyecto)
- Carga de adjuntos
- Seguimiento de estados

## 🚀 Demo en Vivo

**GitHub Pages:** https://ronaldnttdata.github.io/claro_liq_solicitud/

## 🛠️ Tecnologías

- **SAPUI5** - Framework UI
- **OpenUI5** - Librería base
- **JSON Model** - Manejo de datos
- **Responsive Design** - Compatible móvil/tablet/desktop

## 📂 Estructura

```
docs/
├── index.html          # Punto de entrada
├── Component.js        # Componente principal
├── manifest.json       # Descriptor de la app
├── mockdata.json       # Datos de prueba
├── controller/         # Controladores de vistas
├── view/              # Vistas XML
├── model/             # Modelos y formatters
├── i18n/              # Textos internacionalizados
├── css/               # Estilos personalizados
├── service/           # Servicios de datos
└── util/              # Utilidades
```

## 💻 Desarrollo Local

### Requisitos
- Python 3.x (para servidor local)

### Ejecutar

```bash
# Clonar el repositorio
git clone https://github.com/RonaldNTTDATA/claro_liq_solicitud.git
cd claro_liq_solicitud/docs

# Iniciar servidor
python3 -m http.server 8080

# Abrir en navegador
open http://localhost:8080
```

## 📱 Características

### ✅ Solicitud de Cierre
- Formulario completo con validación
- Selección de proyecto activo
- Motivo de cierre requerido

### ✅ Gestión de PEPs
- Listado de PEPs del proyecto
- Seguimiento de presupuesto vs ejecutado
- Validación de liquidación

### ✅ Adjuntos
- Carga múltiple de archivos
- Categorización de documentos
- Previsualización

### ✅ Estados
- Borrador
- Solicitado
- En Revisión
- Aprobado
- Rechazado

## 🔧 Configuración GitHub Pages

Este repositorio está configurado para GitHub Pages:

1. Ve a **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**
4. Folder: **/docs**
5. Save

La aplicación estará disponible en:
`https://ronaldnttdata.github.io/claro_liq_solicitud/`

## 📝 Datos de Prueba

La aplicación incluye datos mock en `mockdata.json`:
- 7 proyectos de ejemplo
- PEPs asociados
- Historial de solicitudes

## 👥 Autores

- **Claro Perú BTP Projects**
- Desarrollado con SAPUI5

## 📄 Licencia

Uso interno - Claro Perú

---

**Última actualización:** Marzo 2026
