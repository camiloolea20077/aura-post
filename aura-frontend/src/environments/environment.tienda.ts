// Servidor local de una tienda (modo híbrido): el front lo sirve nginx en el
// mismo equipo que el backend y /api llega al backend local. Una misma
// compilación sirve en todas las tiendas, sin importar su IP.
export const environment = {
  production: true,
  apiUrl: '/api/',
  socketUrl: 'wss://socket.cloudtecnology.cloud',
};
