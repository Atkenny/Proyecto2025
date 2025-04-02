import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const ModalRegistroCategoria = ({
  showModal,
  setShowModal,
  nuevaCategoria,
  handleInputChange,
  handleAddCategoria
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await handleAddCategoria();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      show={showModal} 
      onHide={() => !isLoading && setShowModal(false)}
      size="lg"
      centered
      backdrop={isLoading ? "static" : true}
      keyboard={!isLoading}
    >
      <Modal.Header 
        closeButton 
        className="border-0 pb-0"
        style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '8px 8px 0 0',
          padding: '1.5rem'
        }}
      >
        <Modal.Title className="h5 m-0">
          <div className="d-flex align-items-center">
            <div 
              className="me-3 p-2 rounded-circle"
              style={{
                background: 'rgba(0, 147, 233, 0.1)',
                color: '#0093E9'
              }}
            >
              <i className="bi bi-folder-plus fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold m-0">Registrar Categoría</h5>
              <small className="text-muted">Ingresa los detalles de la nueva categoría</small>
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 py-4">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold mb-2">
              <i className="bi bi-tag me-2 text-primary"></i>
              Nombre de la Categoría
            </Form.Label>
            <Form.Control
              type="text"
              name="nombreCategoria"
              value={nuevaCategoria.nombreCategoria}
              onChange={handleInputChange}
              required
              className="form-control-lg"
              disabled={isLoading}
              placeholder="Ej: Electrónicos, Ropa, Alimentos..."
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold mb-2">
              <i className="bi bi-card-text me-2 text-primary"></i>
              Descripción
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={nuevaCategoria.descripcion}
              onChange={handleInputChange}
              required
              className="form-control-lg"
              disabled={isLoading}
              placeholder="Describe brevemente esta categoría..."
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button 
              variant="light" 
              onClick={() => setShowModal(false)}
              className="fw-semibold px-4"
              style={{ backgroundColor: '#F8F9FA' }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isLoading}
              className="fw-semibold px-4"
              style={{ backgroundColor: '#0093E9', borderColor: '#0093E9' }}
            >
              {isLoading ? (
                <>
                  <i className="bi bi-arrow-repeat me-2 spinning"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2"></i>
                  Agregar Categoría
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalRegistroCategoria;