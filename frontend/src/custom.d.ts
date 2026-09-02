// Este archivo le "enseña" a TypeScript a entender importaciones de archivos
// que no son de código, como las imágenes SVG.

// Le decimos a TypeScript que cualquier archivo que termine en .svg
// es un módulo válido.
declare module "*.svg" {
  // Y que el contenido de ese módulo (lo que obtienes al importarlo)
  // es de tipo 'string', que corresponde a la URL de la imagen.
  const content: string;
  export default content;
}
