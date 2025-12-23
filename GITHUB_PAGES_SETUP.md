# Configuración de GitHub Pages

## Pasos para habilitar GitHub Pages:

1. **Habilitar GitHub Pages en el repositorio:**
   - Ve a: `https://github.com/nccarla/cursor/settings/pages`
   - En "Source", selecciona: **"GitHub Actions"**
   - Guarda los cambios

2. **El workflow se ejecutará automáticamente:**
   - Cada vez que hagas push a la rama `master`, se construirá y desplegará automáticamente
   - Puedes ver el progreso en: `https://github.com/nccarla/cursor/actions`

3. **Acceder a la aplicación:**
   - Una vez desplegado, la aplicación estará disponible en:
   - `https://nccarla.github.io/cursor/`

## Notas importantes:

- La aplicación usa `HashRouter`, por lo que las rutas funcionarán correctamente en GitHub Pages
- El workflow construye la aplicación y la despliega automáticamente
- Si hay errores, revisa los logs en la pestaña "Actions" del repositorio

## Solución de problemas:

Si la página no aparece:
1. Verifica que GitHub Pages esté habilitado con "GitHub Actions" como fuente
2. Revisa que el workflow se haya ejecutado correctamente en la pestaña "Actions"
3. Espera unos minutos después del push para que se complete el despliegue
4. Verifica que no haya errores en el build




