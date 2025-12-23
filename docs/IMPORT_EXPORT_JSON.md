# 📋 Guía de Importación y Exportación de Horarios (JSON)

## 📖 Descripción General

Esta guía explica cómo usar la funcionalidad de importación/exportación de horarios en formato JSON. Esto es útil para:
- Respaldo de tus horarios
- Compartir patrones de disponibilidad con otros
- Migrar horarios entre meses
- Automatizar la creación de horarios mediante scripts

---

## 📤 Exportar Horarios

### Desde la Interfaz

1. Ve a la página de **Horarios** (Schedule)
2. Haz clic en el botón "⚙️ Opciones"
3. Selecciona "📥 Exportar Mes Actual"
4. Se descargará un archivo JSON con tu horario

### Formato del Archivo Exportado

```json
{
  "year": 2025,
  "month": 1,
  "availability": [
    {
      "day": 15,
      "slots": [
        {
          "start": "08:00",
          "end": "20:00",
          "title": "Turno Día",
          "color": "#3b82f6"
        }
      ],
      "note": "Turno regular"
    }
  ],
  "exportedAt": "2025-01-23T15:30:00.000Z"
}
```

---

## 📥 Importar Horarios

### Desde la Interfaz

1. Ve a la página de **Horarios** (Schedule)
2. Haz clic en el botón "⚙️ Opciones"
3. Selecciona "📤 Importar Horario"
4. Selecciona tu archivo JSON
5. Confirma la importación

---

## 📝 Estructura del JSON

### Campos Principales

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `year` | number | ✅ Sí | Año del horario (ej: 2025) |
| `month` | number | ✅ Sí | Mes del horario (1-12) |
| `availability` | array | ✅ Sí | Lista de disponibilidad por día |
| `exportedAt` | string | ❌ No | Fecha de exportación (ISO 8601) |

### Estructura de `availability`

Cada elemento del array `availability` representa un día:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `day` | number | ✅ Sí | Día del mes (1-31) |
| `slots` | array | ✅ Sí | Lista de franjas horarias |
| `note` | string | ❌ No | Nota opcional para el día (máx 200 caracteres) |

### Estructura de `slots`

Cada slot representa una franja horaria:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `start` | string | ✅ Sí | Hora de inicio (formato HH:MM, 24h) |
| `end` | string | ✅ Sí | Hora de fin (formato HH:MM, 24h) |
| `title` | string | ❌ No | Título del slot (ej: "Turno Día") |
| `color` | string | ❌ No | Color en formato hex (ej: "#3b82f6") |

---

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Jornada de Enfermería - Turno Día (12 horas)

Turno de 8:00 a 20:00 aplicado a varios días:

```json
{
  "year": 2025,
  "month": 2,
  "availability": [
    {
      "day": 3,
      "slots": [
        {
          "start": "08:00",
          "end": "20:00",
          "title": "Turno Día",
          "color": "#3b82f6"
        }
      ],
      "note": "Hospital Central"
    },
    {
      "day": 4,
      "slots": [
        {
          "start": "08:00",
          "end": "20:00",
          "title": "Turno Día",
          "color": "#3b82f6"
        }
      ]
    },
    {
      "day": 5,
      "slots": [
        {
          "start": "08:00",
          "end": "20:00",
          "title": "Turno Día",
          "color": "#3b82f6"
        }
      ]
    }
  ]
}
```

### Ejemplo 2: Jornada de Enfermería - Turno Noche (12 horas)

Turno de 20:00 a 8:00 del día siguiente:

```json
{
  "year": 2025,
  "month": 2,
  "availability": [
    {
      "day": 10,
      "slots": [
        {
          "start": "20:00",
          "end": "08:00",
          "title": "Turno Noche",
          "color": "#1e40af"
        }
      ],
      "note": "Guardia nocturna"
    },
    {
      "day": 11,
      "slots": [
        {
          "start": "20:00",
          "end": "08:00",
          "title": "Turno Noche",
          "color": "#1e40af"
        }
      ]
    }
  ]
}
```

### Ejemplo 3: Turno de 24 horas

Turno completo de 8:00 a 8:00 del día siguiente:

```json
{
  "year": 2025,
  "month": 2,
  "availability": [
    {
      "day": 15,
      "slots": [
        {
          "start": "08:00",
          "end": "08:00",
          "title": "Turno 24h",
          "color": "#0f172a"
        }
      ],
      "note": "Guardia de 24 horas"
    }
  ]
}
```

### Ejemplo 4: Horario Tarde (13:00 - 22:00)

Para trabajos de tarde:

```json
{
  "year": 2025,
  "month": 3,
  "availability": [
    {
      "day": 1,
      "slots": [
        {
          "start": "13:00",
          "end": "22:00",
          "title": "Tarde",
          "color": "#f59e0b"
        }
      ]
    },
    {
      "day": 2,
      "slots": [
        {
          "start": "13:00",
          "end": "22:00",
          "title": "Tarde",
          "color": "#f59e0b"
        }
      ]
    },
    {
      "day": 3,
      "slots": [
        {
          "start": "13:00",
          "end": "22:00",
          "title": "Tarde",
          "color": "#f59e0b"
        }
      ]
    }
  ]
}
```

### Ejemplo 5: Horario Oficina Estándar (9:00 - 17:00)

Semana laboral típica:

```json
{
  "year": 2025,
  "month": 3,
  "availability": [
    {
      "day": 3,
      "slots": [
        {
          "start": "09:00",
          "end": "17:00",
          "title": "Oficina",
          "color": "#6366f1"
        }
      ]
    },
    {
      "day": 4,
      "slots": [
        {
          "start": "09:00",
          "end": "17:00",
          "title": "Oficina",
          "color": "#6366f1"
        }
      ]
    },
    {
      "day": 5,
      "slots": [
        {
          "start": "09:00",
          "end": "17:00",
          "title": "Oficina",
          "color": "#6366f1"
        }
      ]
    }
  ]
}
```

### Ejemplo 6: Múltiples Slots en un Día

Un día con varios turnos o descansos:

```json
{
  "year": 2025,
  "month": 4,
  "availability": [
    {
      "day": 12,
      "slots": [
        {
          "start": "08:00",
          "end": "12:00",
          "title": "Mañana",
          "color": "#10b981"
        },
        {
          "start": "14:00",
          "end": "18:00",
          "title": "Tarde",
          "color": "#f59e0b"
        },
        {
          "start": "20:00",
          "end": "22:00",
          "title": "Guardia Extra",
          "color": "#ef4444"
        }
      ],
      "note": "Día con múltiples turnos"
    }
  ]
}
```

### Ejemplo 7: Mes Completo con Patrón

Patrón rotativo de turnos:

```json
{
  "year": 2025,
  "month": 5,
  "availability": [
    {
      "day": 1,
      "slots": [{ "start": "08:00", "end": "20:00", "title": "Turno Día" }]
    },
    {
      "day": 2,
      "slots": [{ "start": "08:00", "end": "20:00", "title": "Turno Día" }]
    },
    {
      "day": 3,
      "slots": [{ "start": "08:00", "end": "20:00", "title": "Turno Día" }]
    },
    {
      "day": 4,
      "note": "Día libre"
    },
    {
      "day": 5,
      "slots": [{ "start": "20:00", "end": "08:00", "title": "Turno Noche" }]
    },
    {
      "day": 6,
      "slots": [{ "start": "20:00", "end": "08:00", "title": "Turno Noche" }]
    },
    {
      "day": 7,
      "slots": [{ "start": "20:00", "end": "08:00", "title": "Turno Noche" }]
    },
    {
      "day": 8,
      "note": "Día libre"
    }
  ]
}
```

---

## 🎨 Colores Sugeridos

Colores recomendados para diferentes tipos de turnos:

| Turno | Color Hex | Vista |
|-------|-----------|-------|
| Turno Día | `#3b82f6` | 🔵 Azul |
| Turno Noche | `#1e40af` | 🔷 Azul Oscuro |
| Turno 24h | `#0f172a` | ⬛ Negro Azulado |
| Tarde | `#f59e0b` | 🟡 Amarillo/Naranja |
| Oficina | `#6366f1` | 🟣 Índigo |
| Mañana | `#10b981` | 🟢 Verde |
| Extra/Guardia | `#ef4444` | 🔴 Rojo |
| Fin de Semana | `#8b5cf6` | 🟪 Púrpura |

---

## ⚠️ Validaciones y Restricciones

### Formato de Hora
- **Formato:** HH:MM (24 horas)
- **Válido:** `08:00`, `13:30`, `20:45`, `00:00`, `23:59`
- **Inválido:** `8:00`, `13:30:00`, `25:00`, `12:60`

### Días del Mes
- Deben estar entre 1 y 31
- El sistema validará que el día exista en el mes especificado
- Ejemplo: día 31 en febrero será rechazado

### Slots
- No puede haber slots vacíos (`slots: []` es válido, pero será ignorado)
- Los slots pueden solaparse (la app no valida esto, es intencional)
- Un turno de 24h se representa como `start: "08:00", end: "08:00"`
- Turnos nocturnos cruzan medianoche: `start: "20:00", end: "08:00"`

### Notas
- Máximo 200 caracteres por nota
- Pueden contener emojis y caracteres especiales
- Son opcionales

---

## 🔧 Generador de JSON

### Plantilla Básica

Usa esta plantilla como punto de partida:

```json
{
  "year": 2025,
  "month": 1,
  "availability": []
}
```

### Script Python para Generar JSON

```python
import json
from datetime import datetime

def generar_horario_turno_dia(year, month, dias):
    """
    Genera un horario con turno día (8:00-20:00) para los días especificados
    
    Args:
        year: Año (ej: 2025)
        month: Mes (1-12)
        dias: Lista de días (ej: [1, 2, 3, 10, 15])
    """
    horario = {
        "year": year,
        "month": month,
        "availability": []
    }
    
    for dia in dias:
        horario["availability"].append({
            "day": dia,
            "slots": [{
                "start": "08:00",
                "end": "20:00",
                "title": "Turno Día",
                "color": "#3b82f6"
            }],
            "note": "Turno regular"
        })
    
    return horario

# Ejemplo de uso
dias_trabajo = [1, 2, 3, 8, 9, 10, 15, 16, 17, 22, 23, 24]
horario = generar_horario_turno_dia(2025, 2, dias_trabajo)

# Guardar a archivo
with open('horario_febrero_2025.json', 'w', encoding='utf-8') as f:
    json.dump(horario, f, indent=2, ensure_ascii=False)

print("✅ Horario generado: horario_febrero_2025.json")
```

### Script JavaScript para Generar JSON

```javascript
function generarHorarioTurnoDia(year, month, dias) {
  /**
   * Genera un horario con turno día (8:00-20:00) para los días especificados
   * 
   * @param {number} year - Año (ej: 2025)
   * @param {number} month - Mes (1-12)
   * @param {number[]} dias - Array de días (ej: [1, 2, 3, 10, 15])
   */
  const horario = {
    year: year,
    month: month,
    availability: []
  };
  
  dias.forEach(dia => {
    horario.availability.push({
      day: dia,
      slots: [{
        start: "08:00",
        end: "20:00",
        title: "Turno Día",
        color: "#3b82f6"
      }],
      note: "Turno regular"
    });
  });
  
  return horario;
}

// Ejemplo de uso
const diasTrabajo = [1, 2, 3, 8, 9, 10, 15, 16, 17, 22, 23, 24];
const horario = generarHorarioTurnoDia(2025, 2, diasTrabajo);

// Guardar a archivo (Node.js)
const fs = require('fs');
fs.writeFileSync('horario_febrero_2025.json', JSON.stringify(horario, null, 2));

console.log('✅ Horario generado: horario_febrero_2025.json');
```

---

## 📱 Uso en la Aplicación

### Flujo Típico

1. **Crear Plantilla:**
   - Usa las plantillas predefinidas o crea una personalizada
   - Aplica al mes actual

2. **Ajustar Manualmente:**
   - Haz clic en días específicos para editar
   - Agrega notas o múltiples slots

3. **Exportar:**
   - Exporta tu horario para respaldo
   - Guarda el JSON para reutilizar

4. **Reutilizar:**
   - Modifica el mes/año en el JSON
   - Importa en un mes diferente
   - Comparte con compañeros de trabajo

---

## 🐛 Solución de Problemas

### Error: "Formato de hora inválido"
- Asegúrate de usar formato HH:MM (24h)
- Ejemplos válidos: `08:00`, `13:30`, `20:00`

### Error: "Día inválido para el mes"
- Verifica que el día existe en el mes
- Febrero tiene 28/29 días, no uses día 30 o 31

### Error: "JSON mal formado"
- Verifica que el JSON sea válido (usa jsonlint.com)
- Revisa comas, llaves y corchetes

### La importación no muestra cambios
- Refresca la página después de importar
- Verifica que el año y mes coincidan con el mes que estás viendo

---

## 💡 Tips y Mejores Prácticas

1. **Respaldo Regular:**
   - Exporta tu horario al inicio y fin de cada mes
   - Guarda los JSON en una carpeta organizada

2. **Nombres de Archivo Descriptivos:**
   - Usa formato: `horario_YYYY_MM.json`
   - Ejemplo: `horario_2025_02.json`

3. **Plantillas Reutilizables:**
   - Crea JSONs base para patrones comunes
   - Modifica solo mes/año para reutilizar

4. **Colores Consistentes:**
   - Usa siempre los mismos colores para tipos de turno
   - Facilita la identificación visual

5. **Notas Informativas:**
   - Agrega notas para turnos especiales
   - Indica ubicación o detalles importantes

---

## 🆘 Soporte

¿Tienes dudas o problemas? 
- Contacta al soporte de AmigOrganizador
- Revisa los ejemplos en esta guía
- Verifica la estructura del JSON con un validador online

---

**Última actualización:** 23 de diciembre de 2025
