import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Copy,
  Trash2,
  Download,
  Upload,
  Crop,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  Square,
  Circle,
  Triangle,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  Palette,
  Settings
} from 'lucide-react';

interface ImageObject {
  id: string;
  src: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  aspectRatio: number;
  originalSize: { width: number; height: number };
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    sepia: number;
    grayscale: number;
  };
  border: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
    radius: number;
  };
  shadow: {
    enabled: boolean;
    x: number;
    y: number;
    blur: number;
    color: string;
  };
}

interface ImageManipulationProps {
  images: ImageObject[];
  onImagesChange: (images: ImageObject[]) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  readonly?: boolean;
}

export const ImageManipulationComponent: React.FC<ImageManipulationProps> = ({
  images,
  onImagesChange,
  containerRef,
  zoom = 100,
  readonly = false
}) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [clipboard, setClipboard] = useState<ImageObject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resizeHandle, setResizeHandle] = useState<string>('');

  const selectedImage = images.find(img => img.id === selectedImageId);

  // Função para criar uma nova imagem
  const createImageObject = useCallback((src: string, name: string): ImageObject => {
    const img = new Image();
    img.src = src;
    
    return {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      src,
      name,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      rotation: 0,
      opacity: 1,
      zIndex: images.length + 1,
      locked: false,
      visible: true,
      aspectRatio: 200 / 150,
      originalSize: { width: 200, height: 150 },
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        sepia: 0,
        grayscale: 0
      },
      border: {
        width: 0,
        color: '#000000',
        style: 'solid',
        radius: 0
      },
      shadow: {
        enabled: false,
        x: 2,
        y: 2,
        blur: 4,
        color: 'rgba(0,0,0,0.3)'
      }
    };
  }, [images.length]);

  // Função para adicionar imagem via upload
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const newImage = createImageObject(src, file.name);
      
      // Calcular tamanho real da imagem
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const maxWidth = 300;
        const maxHeight = 200;
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        const updatedImage: ImageObject = {
          ...newImage,
          size: { width, height },
          aspectRatio,
          originalSize: { width: img.width, height: img.height }
        };
        
        onImagesChange([...images, updatedImage]);
        setSelectedImageId(updatedImage.id);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    
    // Limpar input
    event.target.value = '';
  }, [images, onImagesChange, createImageObject]);

  // Função para adicionar imagem via URL
  const handleImageFromURL = useCallback((url: string) => {
    if (!url.trim()) return;
    
    const newImage = createImageObject(url, 'Imagem da Web');
    
    // Verificar se a imagem carrega
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const maxWidth = 300;
      const maxHeight = 200;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      const updatedImage: ImageObject = {
        ...newImage,
        size: { width, height },
        aspectRatio,
        originalSize: { width: img.width, height: img.height }
      };
      
      onImagesChange([...images, updatedImage]);
      setSelectedImageId(updatedImage.id);
      setShowImageModal(false);
    };
    img.onerror = () => {
      alert('Erro ao carregar a imagem. Verifique se a URL está correta.');
    };
    img.src = url;
  }, [images, onImagesChange, createImageObject]);

  // Função para atualizar propriedades da imagem
  const updateImage = useCallback((id: string, updates: Partial<ImageObject>) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, ...updates } : img
    );
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  // Função para deletar imagem
  const deleteImage = useCallback((id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    onImagesChange(updatedImages);
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
  }, [images, onImagesChange, selectedImageId]);

  // Função para copiar imagem
  const copyImage = useCallback((id: string) => {
    const imageToCopy = images.find(img => img.id === id);
    if (imageToCopy) {
      setClipboard(imageToCopy);
    }
  }, [images]);

  // Função para colar imagem
  const pasteImage = useCallback(() => {
    if (!clipboard) return;
    
    const newImage: ImageObject = {
      ...clipboard,
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: clipboard.position.x + 20,
        y: clipboard.position.y + 20
      },
      zIndex: Math.max(...images.map(img => img.zIndex)) + 1
    };
    
    onImagesChange([...images, newImage]);
    setSelectedImageId(newImage.id);
  }, [clipboard, images, onImagesChange]);

  // Função para duplicar imagem
  const duplicateImage = useCallback((id: string) => {
    copyImage(id);
    pasteImage();
  }, [copyImage, pasteImage]);

  // Handlers de mouse para arrastar
  const handleMouseDown = useCallback((e: React.MouseEvent, imageId: string) => {
    if (readonly) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const image = images.find(img => img.id === imageId);
    if (!image || image.locked) return;
    
    setSelectedImageId(imageId);
    setIsDragging(true);
    setDragStart({
      x: e.clientX - image.position.x,
      y: e.clientY - image.position.y
    });
  }, [readonly, images]);

  // Handlers de mouse para redimensionar
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, imageId: string, handle: string) => {
    if (readonly) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(imageId);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [readonly]);

  // Effect para lidar com movimento do mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && selectedImageId) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        updateImage(selectedImageId, {
          position: { x: Math.max(0, newX), y: Math.max(0, newY) }
        });
      }
      
      if (isResizing && selectedImage) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        let newWidth = selectedImage.size.width;
        let newHeight = selectedImage.size.height;
        
        switch (resizeHandle) {
          case 'se': // Southeast
            newWidth = Math.max(50, selectedImage.size.width + deltaX);
            newHeight = Math.max(50, selectedImage.size.height + deltaY);
            break;
          case 'sw': // Southwest
            newWidth = Math.max(50, selectedImage.size.width - deltaX);
            newHeight = Math.max(50, selectedImage.size.height + deltaY);
            break;
          case 'ne': // Northeast
            newWidth = Math.max(50, selectedImage.size.width + deltaX);
            newHeight = Math.max(50, selectedImage.size.height - deltaY);
            break;
          case 'nw': // Northwest
            newWidth = Math.max(50, selectedImage.size.width - deltaX);
            newHeight = Math.max(50, selectedImage.size.height - deltaY);
            break;
          case 'e': // East
            newWidth = Math.max(50, selectedImage.size.width + deltaX);
            break;
          case 'w': // West
            newWidth = Math.max(50, selectedImage.size.width - deltaX);
            break;
          case 'n': // North
            newHeight = Math.max(50, selectedImage.size.height - deltaY);
            break;
          case 's': // South
            newHeight = Math.max(50, selectedImage.size.height + deltaY);
            break;
        }
        
        // Manter proporção se Shift estiver pressionado
        if (e.shiftKey) {
          if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
            newHeight = newWidth / selectedImage.aspectRatio;
          } else if (resizeHandle.includes('n') || resizeHandle.includes('s')) {
            newWidth = newHeight * selectedImage.aspectRatio;
          }
        }
        
        updateImage(selectedImage.id, {
          size: { width: newWidth, height: newHeight }
        });
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      setResizeHandle('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedImageId, selectedImage, dragStart, resizeHandle, updateImage]);

  // Função para gerar estilo CSS da imagem
  const getImageStyle = useCallback((image: ImageObject): React.CSSProperties => {
    const { filters, border, shadow } = image;
    
    const filterString = [
      `brightness(${filters.brightness}%)`,
      `contrast(${filters.contrast}%)`,
      `saturate(${filters.saturation}%)`,
      `blur(${filters.blur}px)`,
      `sepia(${filters.sepia}%)`,
      `grayscale(${filters.grayscale}%)`
    ].join(' ');
    
    return {
      position: 'absolute',
      left: image.position.x * (zoom / 100),
      top: image.position.y * (zoom / 100),
      width: image.size.width * (zoom / 100),
      height: image.size.height * (zoom / 100),
      transform: `rotate(${image.rotation}deg)`,
      opacity: image.opacity,
      zIndex: image.zIndex,
      display: image.visible ? 'block' : 'none',
      cursor: readonly ? 'default' : (image.locked ? 'not-allowed' : 'move'),
      filter: filterString,
      border: border.width > 0 ? `${border.width}px ${border.style} ${border.color}` : 'none',
      borderRadius: border.radius > 0 ? `${border.radius}px` : '0',
      boxShadow: shadow.enabled ? `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.color}` : 'none',
      transition: isDragging || isResizing ? 'none' : 'all 0.2s ease'
    };
  }, [zoom, readonly, isDragging, isResizing]);

  // Função para renderizar handles de redimensionamento
  const renderResizeHandles = useCallback((image: ImageObject) => {
    if (selectedImageId !== image.id || readonly || image.locked) return null;
    
    const handleStyle = {
      position: 'absolute' as const,
      width: '8px',
      height: '8px',
      backgroundColor: '#16a34a',
      border: '2px solid white',
      borderRadius: '50%',
      cursor: 'pointer',
      zIndex: image.zIndex + 1000
    };
    
    const imageStyle = getImageStyle(image);
    const left = parseFloat(imageStyle.left as string) || 0;
    const top = parseFloat(imageStyle.top as string) || 0;
    const width = parseFloat(imageStyle.width as string) || 0;
    const height = parseFloat(imageStyle.height as string) || 0;
    
    return (
      <>
        {/* Corner handles */}
        <div
          style={{ ...handleStyle, left: left - 4, top: top - 4, cursor: 'nw-resize' }}
          onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'nw')}
        />
        <div
          style={{ ...handleStyle, left: left + width - 4, top: top - 4, cursor: 'ne-resize' }}
          onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'ne')}
        />
        <div
          style={{ ...handleStyle, left: left - 4, top: top + height - 4, cursor: 'sw-resize' }}
          onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'sw')}
        />
        <div
          style={{ ...handleStyle, left: left + width - 4, top: top + height - 4, cursor: 'se-resize' }}
          onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'se')}
        />
        
        {/* Side handles */}
        <div
          style={{ ...handleStyle, left: left + width / 2 - 4, top: top - 4, cursor: 'n-resize' }}
          onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'n')}
        />
        <div
          style={{ ...handleStyle, left: left + width - 4, top: top + height / 2 - 4, cursor: 'e-resize' }}
          onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'e')}
        />
        <div
          style={{ ...handleStyle, left: left + width / 2 - 4, top: top + height - 4, cursor: 's-resize' }}
          onMouseDown={(e) => handleResizeMouseDown(e, image.id, 's')}
        />
        <div
          style={{ ...handleStyle, left: left - 4, top: top + height / 2 - 4, cursor: 'w-resize' }}
          onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'w')}
        />
      </>
    );
  }, [selectedImageId, readonly, getImageStyle, handleResizeMouseDown]);

  return (
    <>
      {/* Renderizar imagens */}
      {images.map(image => (
        <div key={image.id}>
          <img
            src={image.src}
            alt={image.name}
            style={getImageStyle(image)}
            onMouseDown={(e) => handleMouseDown(e, image.id)}
            onClick={() => setSelectedImageId(image.id)}
            draggable={false}
          />
          {renderResizeHandles(image)}
        </div>
      ))}
      
      {/* Barra de ferramentas de imagem */}
      {!readonly && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '0.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 10000
        }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0.5rem',
              border: 'none',
              background: '#16a34a',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title="Adicionar imagem"
          >
            <Upload size={16} />
          </button>
          
          <button
            onClick={() => setShowImageModal(true)}
            style={{
              padding: '0.5rem',
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title="Adicionar imagem por URL"
          >
            <ImageIcon size={16} />
          </button>
          
          {selectedImage && (
            <>
              <button
                onClick={() => copyImage(selectedImage.id)}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  background: '#6b7280',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Copiar"
              >
                <Copy size={16} />
              </button>
              
              <button
                onClick={() => duplicateImage(selectedImage.id)}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  background: '#8b5cf6',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Duplicar"
              >
                <Layers size={16} />
              </button>
              
              <button
                onClick={() => setShowPropertiesModal(true)}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  background: '#f59e0b',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Propriedades"
              >
                <Settings size={16} />
              </button>
              
              <button
                onClick={() => deleteImage(selectedImage.id)}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Deletar"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          
          {clipboard && (
            <button
              onClick={pasteImage}
              style={{
                padding: '0.5rem',
                border: 'none',
                background: '#059669',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="Colar"
            >
              📋
            </button>
          )}
        </div>
      )}
      
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      
      {/* Modal para adicionar imagem por URL */}
      {showImageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            minWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Adicionar Imagem por URL</h3>
            <input
              type="url"
              placeholder="Digite a URL da imagem"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleImageFromURL((e.target as HTMLInputElement).value);
                }
              }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowImageModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                  if (input?.value) handleImageFromURL(input.value);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: '#16a34a',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de propriedades da imagem */}
      {showPropertiesModal && selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            minWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Propriedades da Imagem</h3>
            
            {/* Posição */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Posição</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={selectedImage.position.x}
                  onChange={(e) => updateImage(selectedImage.id, {
                    position: { ...selectedImage.position, x: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="X"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
                <input
                  type="number"
                  value={selectedImage.position.y}
                  onChange={(e) => updateImage(selectedImage.id, {
                    position: { ...selectedImage.position, y: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="Y"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            {/* Tamanho */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tamanho</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={selectedImage.size.width}
                  onChange={(e) => updateImage(selectedImage.id, {
                    size: { ...selectedImage.size, width: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="Largura"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
                <input
                  type="number"
                  value={selectedImage.size.height}
                  onChange={(e) => updateImage(selectedImage.id, {
                    size: { ...selectedImage.size, height: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="Altura"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            {/* Rotação */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Rotação: {selectedImage.rotation}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedImage.rotation}
                onChange={(e) => updateImage(selectedImage.id, { rotation: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            
            {/* Opacidade */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Opacidade: {Math.round(selectedImage.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedImage.opacity}
                onChange={(e) => updateImage(selectedImage.id, { opacity: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
            
            {/* Filtros */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Filtros</h4>
              
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem' }}>
                  Brilho: {selectedImage.filters.brightness}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedImage.filters.brightness}
                  onChange={(e) => updateImage(selectedImage.id, {
                    filters: { ...selectedImage.filters, brightness: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem' }}>
                  Contraste: {selectedImage.filters.contrast}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedImage.filters.contrast}
                  onChange={(e) => updateImage(selectedImage.id, {
                    filters: { ...selectedImage.filters, contrast: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem' }}>
                  Saturação: {selectedImage.filters.saturation}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedImage.filters.saturation}
                  onChange={(e) => updateImage(selectedImage.id, {
                    filters: { ...selectedImage.filters, saturation: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPropertiesModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

