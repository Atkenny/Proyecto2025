import React, { useState, useEffect } from "react";
import { Container, Row, Form, Col } from "react-bootstrap";
import { db } from "../../assets/database/firebaseconfig";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import TarjetaProducto from "./TarjetaProducto";
import ModalEdicionProducto from "../Productos/ModalEdicionProducto";

const Catalogo = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [showEditModal, setShowEditModal] = useState(false);
  const [productoEditado, setProductoEditado] = useState(null);

  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  const fetchData = async () => {
    try {
      // Obtener productos
      const productosData = await getDocs(productosCollection);
      const fetchedProductos = productosData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProductos(fetchedProductos);

      // Obtener categorías
      const categoriasData = await getDocs(categoriasCollection);
      const fetchedCategorias = categoriasData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCategorias(fetchedCategorias);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Función para abrir el modal de edición
  const openEditModal = (producto) => {
    console.log("Abriendo modal para:", producto);
    setProductoEditado({ ...producto });
    setShowEditModal(true);
  };

  // Manejador de cambios en inputs del formulario de edición
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setProductoEditado((prev) => ({ ...prev, [name]: value }));
  };

  // Función para actualizar un producto
  const handleEditProducto = async () => {
    if (!productoEditado.nombreProducto || !productoEditado.precio || !productoEditado.categoria) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }
    try {
      const productoRef = doc(db, "productos", productoEditado.id);
      await updateDoc(productoRef, productoEditado);
      setShowEditModal(false);
      await fetchData();
    } catch (error) {
      console.error("Error al actualizar producto:", error);
    }
  };

  // Filtrar productos por categoría
  const productosFiltrados = categoriaSeleccionada === "Todas"
    ? productos
    : productos.filter((producto) => producto.categoria === categoriaSeleccionada);

  return (
    <Container className="mt-5">
      <br />
      <h4>Catálogo de Productos</h4>
      {/* Filtro de categorías */}
      <Row>
        <Col lg={3} md={3} sm={6}>
          <Form.Group className="mb-3">
            <Form.Label>Filtrar por categoría:</Form.Label>
            <Form.Select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            >
              <option value="Todas">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nombreCategoria}>
                  {categoria.nombreCategoria}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Catálogo de productos filtrados */}
      <Row>
        {productosFiltrados.length > 0 ? (
          productosFiltrados.map((producto) => (
            <TarjetaProducto 
              key={producto.id} 
              producto={producto} 
              openEditModal={openEditModal}
            />
          ))
        ) : (
          <p>No hay productos en esta categoría.</p>
        )}
      </Row>

      {/* Modal de edición */}
      {productoEditado && (
        <ModalEdicionProducto
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          productoEditado={productoEditado}
          handleEditInputChange={handleEditInputChange}
          handleEditProducto={handleEditProducto}
          categorias={categorias}
        />
      )}
    </Container>
  );
};

export default Catalogo;