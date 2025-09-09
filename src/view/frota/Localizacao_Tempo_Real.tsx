import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import styles from './css/LocalizacaoTempoReal.module.css';

interface Position {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

const LocalizacaoTempoReal: React.FC = () => {
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Inicializar mapa quando o componente montar
  useEffect(() => {
    initializeMap();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const initializeMap = (): void => {
    // Aguardar um pouco para garantir que o elemento DOM existe
    setTimeout(() => {
      if (mapRef.current && !mapInstanceRef.current) {
        // Verificar se o Leaflet está disponível
        if (typeof (window as any).L !== 'undefined') {
          const map = (window as any).L.map(mapRef.current).setView([-23.5505, -46.6333], 13);
          
          (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          mapInstanceRef.current = map;
          getCurrentLocation();
        } else {
          // Carregar Leaflet dinamicamente
          loadLeaflet().then(() => {
            const map = (window as any).L.map(mapRef.current).setView([-23.5505, -46.6333], 13);
            
            (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            mapInstanceRef.current = map;
            getCurrentLocation();
          });
        }
      }
    }, 100);
  };

  const loadLeaflet = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Carregar CSS do Leaflet
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css';
      document.head.appendChild(cssLink);

      // Carregar JS do Leaflet
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar Leaflet'));
      document.head.appendChild(script);
    });
  };

  const getCurrentLocation = (): void => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada por este navegador.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos: GeolocationPosition) => {
        const newPosition: Position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setPosition(newPosition);
        setLoading(false);
        updateMapPosition(newPosition);
      },
      (err: GeolocationPositionError) => {
        let errorMessage = 'Erro ao obter localização.';
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Timeout ao obter localização.';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const startTracking = (): void => {
    if (!navigator.geolocation) return;

    setTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos: GeolocationPosition) => {
        const newPosition: Position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setPosition(newPosition);
        updateMapPosition(newPosition);
      },
      (err: GeolocationPositionError) => {
        console.error('Erro no tracking:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
    watchIdRef.current = watchId;
  };

  const stopTracking = (): void => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  };

  const updateMapPosition = (pos: Position): void => {
    if (mapInstanceRef.current && (window as any).L) {
      // Atualizar vista do mapa
      mapInstanceRef.current.setView([pos.lat, pos.lng], 16);

      // Remover marcador anterior se existir
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Adicionar novo marcador
      markerRef.current = (window as any).L.marker([pos.lat, pos.lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-sm">
            <strong>Sua localização</strong><br/>
            Precisão: ${Math.round(pos.accuracy)}m<br/>
            Atualizado: ${pos.timestamp}
          </div>
        `);

      // Adicionar círculo de precisão
      (window as any).L.circle([pos.lat, pos.lng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        radius: pos.accuracy
      }).addTo(mapInstanceRef.current);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles["header-title"]}>
          <MapPin className={styles["header-icon"]} />
          <h1 className={styles.title}>Localização em Tempo Real</h1>
        </div>
        
        <div className={styles["button-group"]}>
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className={`${styles.button} ${styles["button-primary"]}`}
          >
            <RefreshCw className={`${styles["reload-icon"]} ${loading ? styles.spinning : ''}`} />
            <span>Atualizar</span>
          </button>
          
          <button
            onClick={tracking ? stopTracking : startTracking}
            className={`${styles.button} ${tracking ? styles["button-danger"] : styles["button-success"]}`}
          >
            <Navigation className={styles["reload-icon"]} />
            <span>{tracking ? 'Parar' : 'Rastrear'}</span>
          </button>
        </div>
      </div>

      {/* Status de Erro */}
      {error && (
        <div className={`${styles["status-card"]} ${styles["status-error"]}`}>
          <div className={styles["status-content"]}>
            <AlertCircle className={`${styles["status-icon"]} ${styles.error}`} />
            <p className={styles["status-text"]}>{error}</p>
          </div>
        </div>
      )}

      {/* Informações da Posição */}
      {position && (
        <div className={`${styles["status-card"]} ${styles["status-success"]}`}>
          <div className={styles["info-grid"]}>
            <div className={styles["info-item"]}>
              <span className={styles["info-label"]}>Latitude:</span>
              <p className={styles["info-value"]}>{position.lat.toFixed(6)}</p>
            </div>
            <div className={styles["info-item"]}>
              <span className={styles["info-label"]}>Longitude:</span>
              <p className={styles["info-value"]}>{position.lng.toFixed(6)}</p>
            </div>
            <div className={styles["info-item"]}>
              <span className={styles["info-label"]}>Precisão:</span>
              <p className={styles["info-value"]}>{Math.round(position.accuracy)}m</p>
            </div>
            <div className={styles["info-item"]}>
              <span className={styles["info-label"]}>Atualizado:</span>
              <p className={styles["info-value"]}>{position.timestamp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className={styles["map-container"]}>
        <div className={styles["map-overlay"]} />
        <div 
          ref={mapRef} 
          className={styles.map}
        />
      </div>

      {/* Status do rastreamento */}
      <div className={styles.footer}>
        <div className={`${styles["tracking-status"]} ${tracking ? styles.active : styles.inactive}`}>
          <div className={`${styles["status-indicator"]} ${tracking ? styles.active : styles.inactive}`} />
          <span>{tracking ? 'Rastreamento ativo' : 'Rastreamento inativo'}</span>
        </div>
      </div>
    </div>
  );
};

export default LocalizacaoTempoReal;
