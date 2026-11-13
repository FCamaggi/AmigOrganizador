# **AmigOrganizador**

*Documento de Visión del Proyecto*

# **1\. Resumen Ejecutivo**

AmigOrganizador es una aplicación web que revoluciona la forma en que grupos de amigos coordinan sus encuentros. La plataforma permite a los usuarios gestionar sus horarios personales y compartirlos con grupos específicos, facilitando la identificación automática de momentos disponibles para reunirse.

**Problema que resuelve:** La coordinación de horarios entre múltiples personas es tediosa, consume tiempo y suele hacerse mediante cadenas interminables de mensajes de WhatsApp o encuestas que nadie completa.

# **2\. Visión del Producto**

Convertirnos en la herramienta de referencia para la coordinación social, donde planificar un encuentro con amigos sea tan simple como abrir la app y ver instantáneamente cuándo todos están disponibles.

## **2.1 Diferenciadores Clave**

* **Enfoque en simplicidad:** La interfaz prioriza la facilidad de uso sobre funcionalidades complejas  
* **Gestión rápida de horarios:** Múltiples opciones para establecer disponibilidad, desde entrada manual hasta importación masiva  
* **Privacidad granular:** Los usuarios controlan exactamente qué grupos ven sus horarios  
* **Completamente gratuito:** Utilizando stack tecnológico con planes gratuitos robustos (Netlify \+ MongoDB Atlas \+ Render)

# **3\. Objetivos del Proyecto**

## **3.1 Objetivos Funcionales**

* Permitir a los usuarios crear y mantener sus horarios mensuales de forma intuitiva  
* Facilitar la creación y gestión de grupos de amigos  
* Identificar automáticamente franjas horarias donde todos los miembros de un grupo están disponibles  
* Proporcionar opciones de importación/exportación de datos en formato JSON  
* Enviar notificaciones relevantes sobre cambios en disponibilidad grupal

## **3.2 Objetivos Técnicos**

* Implementar arquitectura escalable y mantenible  
* Garantizar respuesta rápida de la interfaz (\< 2 segundos para operaciones comunes)  
* Asegurar compatibilidad móvil y responsividad  
* Implementar seguridad robusta para datos personales  
* Optimizar costos manteniendo el servicio gratuito

# **4\. Alcance del Proyecto**

## **4.1 Dentro del Alcance \- MVP**

* Sistema de autenticación de usuarios (registro, login, recuperación de contraseña)  
* Gestión de horarios personales mes a mes con vista de calendario  
* Creación y gestión de grupos de amigos  
* Sistema de invitaciones a grupos  
* Visualización de disponibilidad grupal con identificación de coincidencias  
* Importación/exportación de horarios en formato JSON  
* Panel de perfil de usuario básico

## **4.2 Fuera del Alcance \- Versión Inicial**

* Integración con calendarios externos (Google Calendar, Outlook)  
* Sistema de chat o mensajería interna  
* Confirmación de eventos o reservas  
* Sugerencias inteligentes de lugares o actividades  
* Aplicación móvil nativa (iOS/Android)  
* Recordatorios automáticos o notificaciones push

# **5\. Usuarios Objetivo**

## **5.1 Perfil Principal**

* **Demográfico:** Adultos jóvenes de 20-40 años, activos socialmente  
* **Comportamiento:** Personas que coordinan regularmente actividades sociales con múltiples grupos de amigos  
* **Necesidad:** Reducir la fricción en la planificación social  
* **Tecnología:** Usuarios cómodos con tecnología web, acceso regular desde móvil y desktop

## **5.2 Casos de Uso Principales**

* **Grupos de estudio universitarios:** Estudiantes que necesitan coordinar sesiones de estudio  
* **Equipos deportivos amateur:** Grupos que practican deportes recreativos y necesitan coordinar partidos  
* **Círculos sociales:** Grupos de amigos que se juntan regularmente para actividades sociales  
* **Grupos de proyecto:** Equipos que trabajan en proyectos y necesitan coordinar reuniones  
* **Comunidades de interés:** Clubes de lectura, gamers, aficionados a hobbies específicos

# **6\. Propuesta de Valor**

## **6.1 Beneficios para los Usuarios**

* **Ahorro de tiempo:** Elimina largas conversaciones para coordinar horarios  
* **Visibilidad instantánea:** Ver de un vistazo cuándo todos están disponibles  
* **Flexibilidad:** Compartir horarios con diferentes grupos sin exponer toda la agenda  
* **Reducción de frustración:** Menos planes cancelados por mala coordinación  
* **Control:** Gestión centralizada de disponibilidad social

## **6.2 Ventajas Competitivas**

* **Especialización:** A diferencia de calendarios generales, está diseñado específicamente para coordinación social  
* **Simplicidad:** Interfaz más simple que Doodle o When2meet, enfocada en uso recurrente  
* **Gratuito:** Sin limitaciones de funcionalidad ni planes premium  
* **Gestión de múltiples grupos:** Permite participar en varios grupos simultáneamente con privacidad controlada

# **7\. Métricas de Éxito**

## **7.1 Métricas Principales**

* **Adopción:** Usuarios registrados activos mensualmente  
* **Engagement:** Frecuencia de actualización de horarios (objetivo: mínimo una vez por semana)  
* **Utilidad:** Número de grupos activos por usuario (objetivo: promedio de 2-3 grupos)  
* **Retención:** Porcentaje de usuarios que regresan después de 30 días (objetivo: \>40%)

## **7.2 Métricas Secundarias**

* Tiempo promedio para establecer horario mensual completo  
* Tasa de aceptación de invitaciones a grupos  
* Uso de funcionalidad de importación/exportación JSON  
* Satisfacción del usuario (NPS \- Net Promoter Score)

# **8\. Riesgos y Mitigación**

## **8.1 Riesgos Técnicos**

* **Riesgo:** Limitaciones de planes gratuitos (MongoDB Atlas, Render)

***Mitigación:** Optimización agresiva de queries, implementación de caching, monitoreo de uso*

* **Riesgo:** Complejidad en cálculo de disponibilidad grupal con múltiples usuarios

***Mitigación:** Algoritmos eficientes, límites en tamaño de grupos, procesamiento asíncrono*

## **8.2 Riesgos de Producto**

* **Riesgo:** Baja adopción inicial por efecto red (útil solo si amigos también la usan)

***Mitigación:** Onboarding que incentiva invitar amigos, funcionalidad útil incluso con pocos contactos*

* **Riesgo:** Usuarios encuentren tedioso mantener horarios actualizados

***Mitigación:** Diseño UX excepcional, opciones de importación rápida, recordatorios no intrusivos*

# **9\. Conclusión**

AmigOrganizador representa una solución práctica a un problema real que enfrentan millones de personas. Al enfocarnos en simplicidad, eficiencia y mantener el servicio completamente gratuito, tenemos la oportunidad de crear una herramienta que genuinamente mejore la coordinación social.

El proyecto combina viabilidad técnica (usando tecnologías probadas con planes gratuitos robustos) con una propuesta de valor clara. El MVP está diseñado para validar la hipótesis central: que usuarios están dispuestos a mantener sus horarios actualizados si esto simplifica significativamente la coordinación de encuentros sociales.

Con un enfoque disciplinado en la experiencia de usuario y una implementación técnica sólida, AmigOrganizador tiene el potencial de convertirse en la herramienta de referencia para coordinación social entre grupos de amigos.