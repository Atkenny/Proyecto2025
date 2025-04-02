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
import TablaCategorias from "../components/Categorias/TablaCategorias";
import ModalRegistroCategoria from "../components/Categorias/ModalRegistroCategoria";
import ModalEdicionCategoria from "../components/Categorias/ModalEdicionCategoria";
import ModalEliminacionCategoria from "../components/Categorias/ModalEliminacionCategoria";
import AnimacionEliminacion from "../components/Categorias/AnimacionEliminacion";
import AnimacionRegistro from "../components/Categorias/AnimacionRegistro";
import { useAuth } from "../assets/database/authcontext";
import { useNavigate } from "react-router-dom";

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnimacionRegistro, setShowAnimacionRegistro] = useState(false);
  const [showAnimacionEliminacion, setShowAnimacionEliminacion] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombreCategoria: "",
    descripcion: ""
  });
  const [categoriaEditada, setCategoriaEditada] = useState(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const categoriasCollection = collection(db, "categorias");

  const handleAddCategoria = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para agregar una categoría.");
      navigate("/login");
      return;
    }

    if (!nuevaCategoria.nombreCategoria || !nuevaCategoria.descripcion) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }
    try {
      setShowAnimacionRegistro(true);
      await addDoc(categoriasCollection, nuevaCategoria);
      setShowModal(false);
      setNuevaCategoria({
        nombreCategoria: "",
        descripcion: ""
      });
      await fetchData();
    } catch (error) {
      console.error("Error al agregar categoría:", error);
    } finally {
      setShowAnimacionRegistro(false);
    }
  };

  const handleEditCategoria = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para editar una categoría.");
      navigate("/login");
      return;
    }

    if (!categoriaEditada.nombreCategoria || !categoriaEditada.descripcion) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }
    try {
      setShowAnimacionRegistro(true);
      const categoriaRef = doc(db, "categorias", categoriaEditada.id);
      await updateDoc(categoriaRef, categoriaEditada);
      setShowEditModal(false);
      await fetchData();
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
    } finally {
      setShowAnimacionRegistro(false);
    }
  };

  const handleDeleteCategoria = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para eliminar una categoría.");
      navigate("/login");
      return;
    }

    if (categoriaAEliminar) {
      try {
        setShowAnimacionEliminacion(true);
        const categoriaRef = doc(db, "categorias", categoriaAEliminar.id);
        await deleteDoc(categoriaRef);
        setShowDeleteModal(false);
        await fetchData();
      } catch (error) {
        console.error("Error al eliminar categoría:", error);
      } finally {
        setShowAnimacionEliminacion(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setCategoriaEditada((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const openEditModal = (categoria) => {
    setCategoriaEditada(categoria);
    setShowEditModal(true);
  };

  const openDeleteModal = (categoria) => {
    setCategoriaAEliminar(categoria);
    setShowDeleteModal(true);
  };

  const fetchData = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(categoriasCollection);
      const fetchedCategorias = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCategorias(fetchedCategorias);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
    }
  }, [categoriasCollection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Categorías</h4>
      {isLoggedIn && (
        <Button className="mb-3" onClick={() => setShowModal(true)}>
          Agregar categoría
        </Button>
      )}
      <TablaCategorias
        categorias={categorias}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
        isLoggedIn={isLoggedIn}
      />
      <ModalRegistroCategoria
        showModal={showModal}
        setShowModal={setShowModal}
        nuevaCategoria={nuevaCategoria}
        handleInputChange={handleInputChange}
        handleAddCategoria={handleAddCategoria}
      />
      <ModalEdicionCategoria
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        categoriaEditada={categoriaEditada}
        handleEditInputChange={handleEditInputChange}
        handleEditCategoria={handleEditCategoria}
      />
      <ModalEliminacionCategoria
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteCategoria={handleDeleteCategoria}
      />
      <AnimacionEliminacion
        show={showAnimacionEliminacion}
        onHide={() => setShowAnimacionEliminacion(false)}
      />
      <AnimacionRegistro
        show={showAnimacionRegistro}
        onHide={() => setShowAnimacionRegistro(false)}
        tipo={categoriaEditada ? 'editar' : 'guardar'}
      />
    </Container>
  );
};

export default Categorias;