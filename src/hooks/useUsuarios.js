import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        setIsLoading(true);
        
        // Obtener pedidos para extraer emails únicos
        const pedidosRef = collection(db, 'pedidos');
        const pedidosQuery = query(pedidosRef, orderBy('creadoEn', 'desc'));
        const pedidosSnap = await getDocs(pedidosQuery);
        
        // Extraer usuarios únicos por email
        const usuariosMap = new Map();
        
        pedidosSnap.docs.forEach(doc => {
          const pedido = doc.data();
          if (!pedido.clienteEmail || !pedido.creadoEn) return; // Skip si falta data
          
          if (!usuariosMap.has(pedido.clienteEmail)) {
            usuariosMap.set(pedido.clienteEmail, {
              email: pedido.clienteEmail,
              nombre: pedido.clienteNombre || 'Sin nombre',
              primerPedido: pedido.creadoEn,
              totalPedidos: 1,
              totalGastado: pedido.totalARS || 0,
            });
          } else {
            const usuario = usuariosMap.get(pedido.clienteEmail);
            usuario.totalPedidos += 1;
            usuario.totalGastado += pedido.totalARS || 0;
            // Mantener la fecha más antigua
            const pedidoSeconds = pedido.creadoEn.seconds || 0;
            const usuarioSeconds = usuario.primerPedido.seconds || 0;
            if (pedidoSeconds < usuarioSeconds) {
              usuario.primerPedido = pedido.creadoEn;
            }
          }
        });
        
        // Convertir a array y ordenar por fecha de registro (más recientes primero)
        const usuariosArray = Array.from(usuariosMap.values())
          .sort((a, b) => {
            const aSeconds = a.primerPedido?.seconds || 0;
            const bSeconds = b.primerPedido?.seconds || 0;
            return bSeconds - aSeconds;
          });
        
        setUsuarios(usuariosArray);
        setError(null);
      } catch (err) {
        console.error('Error al obtener usuarios:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsuarios();
  }, []);

  return { usuarios, isLoading, error };
}
