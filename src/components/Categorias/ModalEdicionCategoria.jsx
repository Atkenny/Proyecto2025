import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const ModalEdicionCategoria = ({
  showEditModal,
  setShowEditModal,
  categoriaEditada,
  handleEditInputChange,
  handleEditCategoria
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await handleEditCategoria();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error al editar categoría:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!categoriaEditada) return null;

  const handleClose = () => {
    if (!isLoading) {
      setShowEditModal(false);
    }
  };

  return (
    <Modal 
      show={showEditModal} 
      onHide={handleClose}
      backdrop={isLoading ? "static" : true}
      keyboard={!isLoading}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-pencil-square me-2"></i>
          Editar Categoría
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-tag me-2"></i>
              Nombre de la Categoría
            </Form.Label>
            <Form.Control
              type="text"
              name="nombreCategoria"
              value={categoriaEditada.nombreCategoria}
              onChange={handleEditInputChange}
              required
              disabled={isLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-card-text me-2"></i>
              Descripción
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={categoriaEditada.descripcionCategoria}
              onChange={handleEditInputChange}
              required
              disabled={isLoading}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="light" 
              onClick={handleClose}
              className="fw-semibold"
              style={{ backgroundColor: '#F8F9FA' }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isLoading}
              className="fw-semibold"
              style={{ backgroundColor: '#0093E9', borderColor: '#0093E9' }}
            >
              {isLoading ? (
                <>
                  <i className="bi bi-arrow-repeat me-2 spinning"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Actualizar Cambios
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalEdicionCategoria;