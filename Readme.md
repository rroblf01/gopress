# GoPress

GoPress es un proyecto mínimo viable de un editor de contenidos inspirado en WordPress, pero desarrollado completamente en Go (Golang).

## Descripción

Este proyecto busca ofrecer una experiencia similar al editor de WordPress, permitiendo crear y editar contenido de manera sencilla desde una interfaz web minimalista. Todo el backend está implementado en Go, aprovechando su rendimiento y simplicidad.

## Ejecución local

Para ejecutar el proyecto en tu entorno local, necesitas tener una base de datos PostgreSQL en funcionamiento. Puedes levantar una instancia rápidamente usando Docker:

```bash
docker run --name gopress-postgres -e POSTGRES_USER=usuario_admin -e POSTGRES_PASSWORD=micontrasena123 -e POSTGRES_DB=mi_base_de_datos -p 5432:5432 -d postgres:latest
```

Luego, ejecuta la aplicación con la siguiente variable de entorno:

```bash
DATABASE_URL="postgresql://usuario_admin:micontrasena123@localhost:5432/mi_base_de_datos?sslmode=disable" go run .
```

## Rutas principales

- `/cms` — Acceso al editor de contenidos inspirado en WordPress.
- `/` — Renderiza el contenido editado y publicado desde el editor.

---

## Imagen de ejemplo
![GoPress Editor](captura.webp)
¡Explora, edita y publica contenido fácilmente con GoPress!
