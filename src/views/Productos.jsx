import React, { useState, useEffect, useCallback } from "react";
import { Container, Button } from "react-bootstrap";
import { db } from "../assets/database/firebaseconfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import TablaProductos from "../components/Productos/TablaProductos";
import ModalRegistroProducto from "../components/Productos/ModalRegistroProducto";
import ModalEdicionProducto from "../components/Productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../components/Productos/ModalEliminacionProducto";
import AnimacionEliminacion from "../components/Productos/AnimacionEliminacion";
import AnimacionRegistro from "../components/Productos/AnimacionRegistro";
import { useAuth } from "../assets/database/authcontext";
import { useNavigate } from "react-router-dom";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnimacionRegistro, setShowAnimacionRegistro] = useState(false);
  const [showAnimacionEliminacion, setShowAnimacionEliminacion] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombreProducto: "",
    precio: "",
    categoria: "",
    imagen: ""
  });
  const [productoEditado, setProductoEditado] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  const handleAddProducto = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para agregar un producto.");
      navigate("/login");
      return;
    }

    if (!nuevoProducto.nombreProducto || !nuevoProducto.precio || !nuevoProducto.categoria) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }
    try {
      setShowAnimacionRegistro(true);
      await addDoc(productosCollection, nuevoProducto);
      setShowModal(false);
      setNuevoProducto({
        nombreProducto: "",
        precio: "",
        categoria: "",
        imagen: ""
      });
      await fetchData();
    } catch (error) {
      console.error("Error al agregar producto:", error);
    } finally {
      setShowAnimacionRegistro(false);
    }
  };

  const handleEditProducto = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para editar un producto.");
      navigate("/login");
      return;
    }

    if (!productoEditado.nombreProducto || !productoEditado.precio || !productoEditado.categoria) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }
    try {
      setShowAnimacionRegistro(true);
      const productoRef = doc(db, "productos", productoEditado.id);
      await updateDoc(productoRef, productoEditado);
      setShowEditModal(false);
      await fetchData();
    } catch (error) {
      console.error("Error al actualizar producto:", error);
    } finally {
      setShowAnimacionRegistro(false);
    }
  };

  const handleDeleteProducto = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para eliminar un producto.");
      navigate("/login");
      return;
    }

    if (productoAEliminar) {
      try {
        setShowAnimacionEliminacion(true);
        const productoRef = doc(db, "productos", productoAEliminar.id);
        await deleteDoc(productoRef);
        setShowDeleteModal(false);
        await fetchData();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      } finally {
        setShowAnimacionEliminacion(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setProductoEditado((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const openEditModal = (producto) => {
    setProductoEditado(producto);
    setShowEditModal(true);
  };

  const openDeleteModal = (producto) => {
    setProductoAEliminar(producto);
    setShowDeleteModal(true);
  };

  const fetchData = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(productosCollection);
      const fetchedProductos = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProductos(fetchedProductos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  }, [productosCollection]);

  const fetchCategorias = useCallback(async () => {
    try {
      const categoriasData = await getDocs(categoriasCollection);
      const fetchedCategorias = categoriasData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCategorias(fetchedCategorias);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
    }
  }, [categoriasCollection]);

  useEffect(() => {
    const cargarDatos = async () => {
      await Promise.all([fetchData(), fetchCategorias()]);
    };
    cargarDatos();
  }, [fetchData, fetchCategorias]);

  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Productos</h4>
      {isLoggedIn && (
        <Button className="mb-3" onClick={() => setShowModal(true)}>
          Agregar producto
        </Button>
      )}
      <TablaProductos
        productos={productos}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
        isLoggedIn={isLoggedIn}
      />
      <ModalRegistroProducto
        showModal={showModal}
        setShowModal={setShowModal}
        nuevoProducto={nuevoProducto}
        handleInputChange={handleInputChange}
        handleAddProducto={handleAddProducto}
        categorias={categorias}
      />
      <ModalEdicionProducto
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        productoEditado={productoEditado}
        setProductoEditado={setProductoEditado}
        handleEditInputChange={handleEditInputChange}
        handleEditProducto={handleEditProducto}
        categorias={categorias}
      />
      <ModalEliminacionProducto
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteProducto={handleDeleteProducto}
      />
      <AnimacionEliminacion
        show={showAnimacionEliminacion}
        onHide={() => setShowAnimacionEliminacion(false)}
      />
      <AnimacionRegistro
        show={showAnimacionRegistro}
        onHide={() => setShowAnimacionRegistro(false)}
        tipo={productoEditado ? 'editar' : 'guardar'}
      />
    </Container>
  );
};

export default Productos;