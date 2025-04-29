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
import { useAuth } from "../assets/database/authcontext";
import { useNavigate } from "react-router-dom";
import CuadroBusquedas from "../components/Busquedas/CuadroBusquedas";
import Paginacion from "../components/Ordenamiento/Paginacion";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [Categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnimacionEliminacion, setShowAnimacionEliminacion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [nuevoProducto, setNuevoProducto] = useState({
    nombreProducto: "",
    precio: "",
    categoria: "",
    imagen: "",
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
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        await addDoc(productosCollection, nuevoProducto);
        await fetchData();
      } else {
        const productosLocal = JSON.parse(localStorage.getItem("productos") || "[]");
        productosLocal.push(nuevoProducto);
        localStorage.setItem("productos", JSON.stringify(productosLocal));
        alert("Producto agregado localmente. Se sincronizará cuando haya conexión.");
      }
      setShowModal(false);
      setNuevoProducto({
        nombreProducto: "",
        precio: "",
        categoria: "",
        imagen: "",
      });
    } catch (error) {
      console.error("Error al agregar producto:", error);
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        const productoRef = doc(db, "productos", productoEditado.id);
        await updateDoc(productoRef, productoEditado);
        await fetchData();
      } else {
        const productosLocal = JSON.parse(localStorage.getItem("productos") || "[]");
        const updatedProductos = productosLocal.map((producto) =>
          producto.id === productoEditado.id ? productoEditado : producto
        );
        localStorage.setItem("productos", JSON.stringify(updatedProductos));
        alert("Producto editado localmente. Se sincronizará cuando haya conexión.");
      }
      setShowEditModal(false);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
    } finally {
      setIsLoading(false);
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
        if (navigator.onLine) {
          const productoRef = doc(db, "productos", productoAEliminar.id);
          await deleteDoc(productoRef);
          await fetchData();
        } else {
          const productosLocal = JSON.parse(localStorage.getItem("productos") || "[]");
          const filteredProductos = productosLocal.filter((producto) => producto.id !== productoAEliminar.id);
          localStorage.setItem("productos", JSON.stringify(filteredProductos));
          alert("Producto eliminado localmente. Se sincronizará cuando haya conexión.");
        }
        setShowDeleteModal(false);
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      } finally {
        setShowAnimacionEliminacion(false);
      }
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(productosCollection);
      const fetchedProductos = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProductos(fetchedProductos);

      // Guardar en localStorage cuando haya conexión
      localStorage.setItem("productos", JSON.stringify(fetchedProductos));
    } catch (error) {
      console.error("Error al obtener productos:", error);

      // Si no hay conexión, cargar los productos desde localStorage
      const cachedProductos = localStorage.getItem("productos");
      if (cachedProductos) {
        setProductos(JSON.parse(cachedProductos));
      }
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
      await fetchData();
      await fetchCategorias();
    };
    cargarDatos();
  }, [fetchData, fetchCategorias]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProductos(productos);
    } else {
      const filtered = productos.filter((producto) =>
        producto.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProductos(filtered);
    }
  }, [searchTerm, productos]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const paginatedData = filteredProductos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCloseModal = () => setShowModal(false);
  const handleCloseEditModal = () => setShowEditModal(false);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  return (
    <Container>
      <Button onClick={() => setShowModal(true)}>Agregar Producto</Button>

      <CuadroBusquedas searchTerm={searchTerm} handleSearchChange={handleSearchChange} />

      <TablaProductos
        productos={paginatedData}
        setShowEditModal={setShowEditModal}
        setProductoEditado={setProductoEditado}
        setShowDeleteModal={setShowDeleteModal}
        setProductoAEliminar={setProductoAEliminar}
      />

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
      />

      <ModalRegistroProducto
        show={showModal}
        handleClose={handleCloseModal}
        handleAddProducto={handleAddProducto}
        nuevoProducto={nuevoProducto}
        setNuevoProducto={setNuevoProducto}
        isLoading={isLoading}
      />

      <ModalEdicionProducto
        show={showEditModal}
        handleClose={handleCloseEditModal}
        handleEditProducto={handleEditProducto}
        productoEditado={productoEditado}
        setProductoEditado={setProductoEditado}
        isLoading={isLoading}
      />

      <ModalEliminacionProducto
        show={showDeleteModal}
        handleClose={handleCloseDeleteModal}
        handleDeleteProducto={handleDeleteProducto}
      />

      {showAnimacionEliminacion && <AnimacionEliminacion />}
    </Container>
  );
};

export default Productos;
