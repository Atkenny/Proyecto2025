import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../assets/database/firebaseconfig";
import { Button, Form, ListGroup, Spinner, Modal } from "react-bootstrap";

const ChatIA = ({ showChatModal, setShowChatModal }) => {
  // State variables
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [intencion, setIntencion] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Firebase collections
  const chatCollection = collection(db, "chat");
  const categoriasCollection = collection(db, "categorias");

  // Load messages in real-time from Firebase
  useEffect(() => {
    const q = query(chatCollection, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajesObtenidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMensajes(mensajesObtenidos);
    });

    return () => unsubscribe();
  }, []);

  // Function to fetch categories from Firebase
  const obtenerCategorias = async () => {
    const snapshot = await getDocs(categoriasCollection);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  // Function to clear chat
  const limpiarChat = async () => {
    try {
      const snapshot = await getDocs(chatCollection);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setMensajes([]);
    } catch (error) {
      console.error("Error al limpiar el chat:", error);
      await addDoc(chatCollection, {
        texto: "Ocurrió un error al limpiar el chat. Intenta de nuevo.",
        emisor: "ia",
        timestamp: new Date(),
      });
    }
  };

  // Function to get AI response from Gemini API
  const obtenerRespuestaIA = async (promptUsuario) => {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    const prompt = `
      Analiza el mensaje del usuario: "${promptUsuario}".
      Determina la intención del usuario respecto a operaciones con categorías (no necesariamente con las mismas palabras, pueden ser sinonimos):
      - "crear": Si el usuario quiere crear una nueva categoría (ejemplo: 'crear categoría', 'agregar categoría', o un mensaje con nombre y descripción como 'NombreCategoria: X, DescripcionCategoria: Y'). Extrae el nombreCategoria y descripcionCategoria. Si no se proporciona descripcionCategoria, genera una corta basada en el nombreCategoria. Asegúrate de que comiencen con mayúsculas.
      - "listar": Si el usuario quiere ver las categorías existentes (ejemplo: 'ver categorías', 'mostrar categorías', 'listar categorías').
      - "actualizar": Si el usuario quiere actualizar una categoría existente (ejemplo: 'actualizar categoría', 'modificar categoría', 'actualiza la categoría michis que la descripcionCategoria diga X'). Si especifica un número o nombreCategoria (ejemplo: 'actualizar categoría 1', 'actualiza la categoría michis'), incluye el campo "seleccion" con el número o nombreCategoria. Si se proporcionan nuevos datos (ejemplo: 'que la descripcionCategoria diga X'), incluye también "datos".
      - "eliminar": Si el usuario quiere eliminar una categoría existente (ejemplo: 'eliminar categoría', 'borrar categoría', 'quiero eliminar la categoría carpintería'). Si especifica un número o nombreCategoria (ejemplo: 'eliminar categoría 1', 'quiero eliminar la categoría carpintería'), incluye el campo "seleccion" con el número o nombreCategoria.
      - "seleccionar_categoria": Si el usuario proporciona únicamente un número (ejemplo: '1') o nombreCategoria exacto de una categoría (ejemplo: 'Carpintería') tras una solicitud de actualización o eliminación.
      - "actualizar_datos": Si el usuario proporciona nuevos datos para una categoría (ejemplo: 'Nuevo nombreCategoria: X, Nueva descripcionCategoria: Y') tras seleccionar una categoría.

      Devuelve un JSON con la estructura:
      {
        "intencion": "crear|listar|actualizar|eliminar|seleccionar_categoria|actualizar_datos",
        "datos": { "nombreCategoria": "...", "descripcionCategoria": "..." }, // Solo para "crear" y "actualizar_datos", o "actualizar" si se proporcionan datos
        "seleccion": "..." // Solo para "eliminar" o "actualizar" si se especifica una categoría directamente
      }
      Si no se detecta una intención clara, devuelve { "intencion": "desconocida" }.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        }
      );

      if (response.status === 429) {
        return { intencion: "error", mensaje: "Has alcanzado el límite de solicitudes. Intenta de nuevo más tarde." };
      }

      const data = await response.json();
      const respuestaIA = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

      if (!respuestaIA.intencion) {
        return { intencion: "desconocida" };
      }

      return respuestaIA;
    } catch (error) {
      console.error("Error al obtener respuesta de la IA:", error);
      return { intencion: "error", mensaje: "No se pudo conectar con la IA. Verifica tu conexión o API Key." };
    }
  };

  // Main function to send message and process AI response
  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;

    const nuevoMensaje = {
      texto: mensaje,
      emisor: "usuario",
      timestamp: new Date(),
    };

    setCargando(true);
    setMensaje("");

    try {
      await addDoc(chatCollection, nuevoMensaje);
      const respuestaIA = await obtenerRespuestaIA(mensaje);

      const categorias = await obtenerCategorias();

      if (respuestaIA.intencion === "listar") {
        if (categorias.length === 0) {
          await addDoc(chatCollection, {
            texto: "No hay categorías registradas.",
            emisor: "ia",
            timestamp: new Date(),
          });
        } else {
          const lista = categorias
            .map((cat, i) => `${i + 1}. ${cat.nombreCategoria}: ${cat.descripcionCategoria}`)
            .join("\n");
          await addDoc(chatCollection, {
            texto: `Categorías disponibles:\n${lista}`,
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (respuestaIA.intencion === "crear" && !intencion) {
        const datos = respuestaIA.datos;
        if (datos.nombreCategoria && datos.descripcionCategoria) {
          await addDoc(categoriasCollection, datos);
          await addDoc(chatCollection, {
            texto: `Categoría "${datos.nombreCategoria}" registrada con éxito.`,
            emisor: "ia",
            timestamp: new Date(),
          });
        } else {
          await addDoc(chatCollection, {
            texto: "No se pudo registrar la categoría. Faltan datos válidos.",
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (respuestaIA.intencion === "eliminar") {
        if (categorias.length === 0) {
          await addDoc(chatCollection, {
            texto: "No hay categorías registradas para eliminar.",
            emisor: "ia",
            timestamp: new Date(),
          });
          setIntencion(null);
        } else if (respuestaIA.seleccion) {
          const encontrada = categorias.find(
            (cat, i) =>
              cat.nombreCategoria.toLowerCase() === respuestaIA.seleccion.toLowerCase() ||
              parseInt(respuestaIA.seleccion) === i + 1
          );
          if (encontrada) {
            await deleteDoc(doc(db, "categorias", encontrada.id));
            await addDoc(chatCollection, {
              texto: `Categoría "${encontrada.nombreCategoria}" eliminada con éxito.`,
              emisor: "ia",
              timestamp: new Date(),
            });
            setIntencion(null);
          } else {
            await addDoc(chatCollection, {
              texto: "No se encontró la categoría especificada.",
              emisor: "ia",
              timestamp: new Date(),
            });
          }
        } else {
          setIntencion("eliminar");
          const lista = categorias
            .map((cat, i) => `${i + 1}. ${cat.nombreCategoria}: ${cat.descripcionCategoria}`)
            .join("\n");
          await addDoc(chatCollection, {
            texto: `Selecciona una categoría para eliminar:\n${lista}`,
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (intencion === "eliminar" && respuestaIA.intencion === "seleccionar_categoria") {
        const encontrada = categorias.find(
          (cat, i) =>
            cat.nombreCategoria.toLowerCase() === mensaje.toLowerCase() || parseInt(mensaje) === i + 1
        );
        if (encontrada) {
          await deleteDoc(doc(db, "categorias", encontrada.id));
          await addDoc(chatCollection, {
            texto: `Categoría "${encontrada.nombreCategoria}" eliminada con éxito.`,
            emisor: "ia",
            timestamp: new Date(),
          });
          setIntencion(null);
        } else {
          await addDoc(chatCollection, {
            texto: "Selección inválida. Intenta con un número o nombre válido.",
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (respuestaIA.intencion === "actualizar") {
        if (categorias.length === 0) {
          await addDoc(chatCollection, {
            texto: "No hay categorías para actualizar.",
            emisor: "ia",
            timestamp: new Date(),
          });
          setIntencion(null);
        } else if (respuestaIA.seleccion) {
          const encontrada = categorias.find(
            (cat, i) =>
              cat.nombreCategoria.toLowerCase() === respuestaIA.seleccion.toLowerCase() ||
              parseInt(respuestaIA.seleccion) === i + 1
          );
          if (encontrada) {
            setCategoriaSeleccionada(encontrada);
            setIntencion("actualizar");
            await addDoc(chatCollection, {
              texto: `Seleccionaste "${encontrada.nombreCategoria}". Proporciona nuevos datos.`,
              emisor: "ia",
              timestamp: new Date(),
            });
          } else {
            await addDoc(chatCollection, {
              texto: "Categoría no encontrada.",
              emisor: "ia",
              timestamp: new Date(),
            });
          }
        } else {
          setIntencion("actualizar");
          const lista = categorias
            .map((cat, i) => `${i + 1}. ${cat.nombreCategoria}: ${cat.descripcionCategoria}`)
            .join("\n");
          await addDoc(chatCollection, {
            texto: `Selecciona una categoría para actualizar:\n${lista}`,
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (intencion === "actualizar" && respuestaIA.intencion === "seleccionar_categoria") {
        const encontrada = categorias.find(
          (cat, i) =>
            cat.nombreCategoria.toLowerCase() === mensaje.toLowerCase() || parseInt(mensaje) === i + 1
        );
        if (encontrada) {
          setCategoriaSeleccionada(encontrada);
          await addDoc(chatCollection, {
            texto: `Seleccionaste "${encontrada.nombreCategoria}". Proporciona los nuevos datos.`,
            emisor: "ia",
            timestamp: new Date(),
          });
        } else {
          await addDoc(chatCollection, {
            texto: "Selección inválida.",
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (
        intencion === "actualizar" &&
        categoriaSeleccionada &&
        respuestaIA.intencion === "actualizar_datos"
      ) {
        const datos = respuestaIA.datos;
        const ref = doc(db, "categorias", categoriaSeleccionada.id);
        await updateDoc(ref, {
          nombreCategoria: datos.nombreCategoria || categoriaSeleccionada.nombreCategoria,
          descripcionCategoria: datos.descripcionCategoria || categoriaSeleccionada.descripcionCategoria,
        });
        await addDoc(chatCollection, {
          texto: `Categoría "${categoriaSeleccionada.nombreCategoria}" actualizada con éxito.`,
          emisor: "ia",
          timestamp: new Date(),
        });
        setIntencion(null);
        setCategoriaSeleccionada(null);
      }

      if (respuestaIA.intencion === "desconocida") {
        await addDoc(chatCollection, {
          texto: "No entendí tu solicitud. Usa crear, listar, actualizar o eliminar.",
          emisor: "ia",
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      await addDoc(chatCollection, {
        texto: "Ocurrió un error. Intenta más tarde.",
        emisor: "ia",
        timestamp: new Date(),
      });
    } finally {
      setCargando(false);
    }
  };

  // Render the modal with chat
  return (
    <Modal show={showChatModal} onHide={() => setShowChatModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chat con IA</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup style={{ maxHeight: "300px", overflowY: "auto" }}>
          {mensajes.map((msg) => (
            <ListGroup.Item key={msg.id} variant={msg.emisor === "ia" ? "light" : "primary"}>
              <strong>{msg.emisor === "ia" ? "IA: " : "Tú: "}</strong>
              {msg.texto}
            </ListGroup.Item>
          ))}
        </ListGroup>
        <Form.Control
          className="mt-3"
          type="text"
          placeholder="Escribe tu mensaje..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={limpiarChat} disabled={cargando}>
          Limpiar Chat
        </Button>
        <Button variant="secondary" onClick={() => setShowChatModal(false)}>
          Cerrar
        </Button>
        <Button onClick={enviarMensaje} disabled={cargando}>
          {cargando ? <Spinner size="sm" animation="border" /> : "Enviar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChatIA;